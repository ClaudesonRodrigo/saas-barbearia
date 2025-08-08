// netlify/functions/get-available-slots.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { fromZonedTime, toZonedTime, format } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

const TIME_ZONE = 'America/Sao_Paulo';
const slotInterval = 30; // Intervalo de 30 minutos entre os horários

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { slug, date, duration, barberId } = event.queryStringParameters;
    if (!slug || !date || !duration || !barberId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados insuficientes. A seleção do profissional é obrigatória." }) };
    }
    const serviceDuration = parseInt(duration);
    
    const shopsRef = db.collection('barbershops');
    const shopQuery = await shopsRef.where('publicUrlSlug', '==', slug).limit(1).get();
    if (shopQuery.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    const shopDoc = shopQuery.docs[0];
    const barbershopId = shopDoc.id;
    const shopData = shopDoc.data();

    // --- LÓGICA DE SEGURANÇA REFORÇADA ---
    // Verificamos cada campo de horário individualmente e usamos um valor padrão se ele não existir.
    const dailyBusinessHours = {
      start: shopData.businessHours?.start || '09:00',
      end: shopData.businessHours?.end || '18:00',
    };
    const lunchBreak = {
      start: shopData.lunchBreak?.start || '12:00',
      end: shopData.lunchBreak?.end || '13:00',
    };
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);

    const appointmentsQuery = db.collection('barbershops').doc(barbershopId).collection('appointments')
      .where('date', '>=', selectedDayStart)
      .where('date', '<=', selectedDayEnd)
      .where('barberId', '==', barberId);
    
    const appointmentsSnapshot = await appointmentsQuery.get();
      
    const bookedSlots = [];
    appointmentsSnapshot.forEach(doc => {
      const bookingData = doc.data();
      const zonedDate = toZonedTime(bookingData.date.toDate(), TIME_ZONE);
      bookedSlots.push({ start: zonedDate, duration: bookingData.serviceDuration || 30 });
    });

    const availableSlots = [];
    
    const [startHour, startMinute] = dailyBusinessHours.start.split(':');
    let currentTime = fromZonedTime(new Date(date), TIME_ZONE);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const [endHour, endMinute] = dailyBusinessHours.end.split(':');
    let dayEnd = fromZonedTime(new Date(date), TIME_ZONE);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    const [lunchStartHour, lunchStartMinute] = lunchBreak.start.split(':');
    let lunchStart = fromZonedTime(new Date(date), TIME_ZONE);
    lunchStart.setHours(lunchStartHour, lunchStartMinute, 0, 0);

    const [lunchEndHour, lunchEndMinute] = lunchBreak.end.split(':');
    let lunchEnd = fromZonedTime(new Date(date), TIME_ZONE);
    lunchEnd.setHours(lunchEndHour, lunchEndMinute, 0, 0);

    const now = toZonedTime(new Date(), TIME_ZONE);
    const isToday = format(now, 'yyyy-MM-dd') === date;

    while (currentTime < dayEnd) {
      const slotStart = currentTime;
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      
      const isDuringLunch = slotStart.getTime() < lunchEnd.getTime() && slotEnd.getTime() > lunchStart.getTime();
      const isAfterWork = slotEnd > dayEnd;
      const isPastTime = isToday && slotStart < now;
      
      if (!isDuringLunch && !isAfterWork && !isPastTime) {
        const isBooked = bookedSlots.some(bookedSlot => {
            const bookedStart = bookedSlot.start;
            const bookedEnd = new Date(bookedStart.getTime() + bookedSlot.duration * 60000); 
            return slotStart.getTime() < bookedEnd.getTime() && slotEnd.getTime() > bookedStart.getTime();
        });

        if (!isBooked) {
          availableSlots.push(format(slotStart, 'HH:mm', { timeZone: TIME_ZONE }));
        }
      }
      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(availableSlots)
    };

  } catch (error) {
    console.error("### ERRO FATAL DENTRO DA FUNÇÃO ###:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};
