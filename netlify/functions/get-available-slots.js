// netlify/functions/get-available-slots.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
// 1. Importamos uma nova função auxiliar 'zonedTimeToUtc'
const { toZonedTime, format, zonedTimeToUtc } = require('date-fns-tz');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

const TIME_ZONE = 'America/Sao_Paulo';
const slotInterval = 30;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { slug, date, duration, barberId } = event.queryStringParameters;
    if (!slug || !date || !duration || !barberId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados insuficientes." }) };
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

    const dailyBusinessHours = {
      start: shopData.businessHours?.start || '09:00',
      end: shopData.businessHours?.end || '22:00',
    };
    const lunchBreak = {
      start: shopData.lunchBreak?.start || '12:00',
      end: shopData.lunchBreak?.end || '13:00',
    };

    // --- LÓGICA DE DATAS REFEITA PARA SER MAIS ROBUSTA ---
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = dailyBusinessHours.start.split(':').map(Number);
    const [endHour, endMinute] = dailyBusinessHours.end.split(':').map(Number);
    const [lunchStartHour, lunchStartMinute] = lunchBreak.start.split(':').map(Number);
    const [lunchEndHour, lunchEndMinute] = lunchBreak.end.split(':').map(Number);

    // 2. Criamos as datas de forma explícita, sem ambiguidades
    const selectedDayStart = zonedTimeToUtc(new Date(year, month - 1, day, 0, 0, 0), TIME_ZONE);
    const selectedDayEnd = zonedTimeToUtc(new Date(year, month - 1, day, 23, 59, 59), TIME_ZONE);
    let currentTime = zonedTimeToUtc(new Date(year, month - 1, day, startHour, startMinute, 0), TIME_ZONE);
    let dayEnd = zonedTimeToUtc(new Date(year, month - 1, day, endHour, endMinute, 0), TIME_ZONE);
    let lunchStart = zonedTimeToUtc(new Date(year, month - 1, day, lunchStartHour, lunchStartMinute, 0), TIME_ZONE);
    let lunchEnd = zonedTimeToUtc(new Date(year, month - 1, day, lunchEndHour, lunchEndMinute, 0), TIME_ZONE);
    // --- FIM DA LÓGICA DE DATAS REFEITA ---

    const appointmentsQuery = db.collection('schedules')
      .where('barbershopId', '==', barbershopId)
      .where('barberId', '==', barberId)
      .where('startTime', '>=', selectedDayStart)
      .where('startTime', '<=', selectedDayEnd);
    
    const appointmentsSnapshot = await appointmentsQuery.get();
      
    const bookedSlots = [];
    appointmentsSnapshot.forEach(doc => {
      const bookingData = doc.data();
      const zonedDate = toZonedTime(bookingData.startTime.toDate(), TIME_ZONE);
      bookedSlots.push({ start: zonedDate, duration: bookingData.serviceDuration || 30 });
    });

    const availableSlots = [];
    
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
    console.error("Erro em get-available-slots:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: `Falha ao buscar horários: ${error.message}` }) 
    };
  }
};