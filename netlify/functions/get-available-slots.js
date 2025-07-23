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
    const { slug, date, duration } = event.queryStringParameters;
    if (!slug || !date || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados insuficientes." }) };
    }
    const serviceDuration = parseInt(duration);
    
    // 1. Buscamos a barbearia e as suas configurações
    const shopsRef = db.collection('barbershops'); // CORREÇÃO AQUI
    const shopQuery = await shopsRef.where('publicUrlSlug', '==', slug).limit(1).get();
    if (shopQuery.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    const shopDoc = shopQuery.docs[0];
    const barbershopId = shopDoc.id;
    const shopData = shopDoc.data();

    // 2. Usamos os horários guardados no banco de dados. Se não existirem, usamos valores padrão.
    const dailyBusinessHours = shopData.businessHours || { start: '09:00', end: '18:00' };
    const lunchBreak = shopData.lunchBreak || { start: '12:00', end: '13:00' };

    // 3. Buscamos os agendamentos existentes para o dia
    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);

    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const appointmentsSnapshot = await appointmentsRef
      .where('date', '>=', selectedDayStart)
      .where('date', '<=', selectedDayEnd)
      .get();
      
    const bookedSlots = [];
    appointmentsSnapshot.forEach(doc => {
      const bookingData = doc.data();
      const zonedDate = toZonedTime(bookingData.date.toDate(), TIME_ZONE);
      bookedSlots.push({ start: zonedDate, duration: bookingData.serviceDuration || 30 });
    });

    // 4. Geramos os horários disponíveis usando os horários dinâmicos
    const availableSlots = [];
    let currentTime = fromZonedTime(`${date}T${dailyBusinessHours.start}`, TIME_ZONE);
    const dayEnd = fromZonedTime(`${date}T${dailyBusinessHours.end}`, TIME_ZONE);
    const lunchStart = fromZonedTime(`${date}T${lunchBreak.start}`, TIME_ZONE);
    const lunchEnd = fromZonedTime(`${date}T${lunchBreak.end}`, TIME_ZONE);

    while (currentTime < dayEnd) {
      const slotStart = currentTime;
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      
      const isDuringLunch = slotStart < lunchEnd && slotEnd > lunchStart;
      const isAfterWork = slotEnd > dayEnd;
      
      if (!isDuringLunch && !isAfterWork) {
        const isBooked = bookedSlots.some(bookedSlot => {
            const bookedStart = bookedSlot.start;
            const bookedEnd = new Date(bookedStart.getTime() + bookedSlot.duration * 60000); 
            return slotStart < bookedEnd && slotEnd > bookedStart;
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
