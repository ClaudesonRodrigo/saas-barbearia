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

// --- REGRAS DE NEGÓCIO ---
const dailyBusinessHours = { start: { hour: 9, minute: 0 }, end: { hour: 18, minute: 0 } };
const lunchBreak = { start: { hour: 12, minute: 0 }, end: { hour: 13, minute: 0 } };
const slotInterval = 30;
const TIME_ZONE = 'America/Sao_Paulo';

exports.handler = async function(event, context) {
  try {
    const { slug, date, duration } = event.queryStringParameters;
    if (!slug || !date || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados insuficientes." }) };
    }
    const serviceDuration = parseInt(duration);
    
    const shopsRef = db.collection('barbershops');
    const shopQuery = await shopsRef.where('publicUrlSlug', '==', slug).limit(1).get();
    if (shopQuery.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    const barbershopId = shopQuery.docs[0].id;

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
      bookedSlots.push({ start: zonedDate, duration: bookingData.serviceDuration || 30 }); // Adicionamos a duração
    });

    const availableSlots = [];
    // --- CORREÇÃO PRINCIPAL AQUI ---
    // Construímos a data base e depois aplicamos horas/minutos
    let currentTime = fromZonedTime(date, TIME_ZONE);
    currentTime.setHours(dailyBusinessHours.start.hour, dailyBusinessHours.start.minute, 0, 0);

    let dayEnd = fromZonedTime(date, TIME_ZONE);
    dayEnd.setHours(dailyBusinessHours.end.hour, dailyBusinessHours.end.minute, 0, 0);

    while (currentTime < dayEnd) {
      const slotStart = currentTime;
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      
      const lunchStart = fromZonedTime(date, TIME_ZONE);
      lunchStart.setHours(lunchBreak.start.hour, lunchBreak.start.minute, 0, 0);
      const lunchEnd = fromZonedTime(date, TIME_ZONE);
      lunchEnd.setHours(lunchBreak.end.hour, lunchBreak.end.minute, 0, 0);
      
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