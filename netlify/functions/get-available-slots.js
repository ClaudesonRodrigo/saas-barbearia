// netlify/functions/get-available-slots.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

// --- REGRAS DE NEGÓCIO (FIXAS POR ENQUANTO) ---
const dailyBusinessHours = {
  start: { hour: 9, minute: 0 },   // 9:00 AM
  end: { hour: 18, minute: 0 },    // 6:00 PM
};
const lunchBreak = {
  start: { hour: 12, minute: 0 },  // 12:00 PM
  end: { hour: 13, minute: 0 },    // 1:00 PM
};
const slotInterval = 30; // Intervalo entre os horários, em minutos
const TIME_ZONE = 'America/Sao_Paulo'; // Fuso horário do Brasil

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Pegamos os dados da URL (query parameters)
    const { slug, date, duration } = event.queryStringParameters;

    if (!slug || !date || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados insuficientes." }) };
    }
    const serviceDuration = parseInt(duration);
    
    // 2. Encontramos o ID da barbearia a partir do slug
    const shopsRef = db.collection('barbershops');
    const shopQuery = await shopsRef.where('publicUrlSlug', '==', slug).limit(1).get();
    if (shopQuery.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    const barbershopId = shopQuery.docs[0].id;

    // 3. Buscamos os agendamentos existentes para o dia selecionado
    const selectedDayStart = zonedTimeToUtc(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = zonedTimeToUtc(`${date}T23:59:59`, TIME_ZONE);

    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const appointmentsSnapshot = await appointmentsRef
      .where('date', '>=', selectedDayStart)
      .where('date', '<=', selectedDayEnd)
      .get();
      
    const bookedSlots = [];
    appointmentsSnapshot.forEach(doc => {
      const bookingData = doc.data();
      const zonedDate = utcToZonedTime(bookingData.date.toDate(), TIME_ZONE);
      bookedSlots.push({
        start: zonedDate,
      });
    });

    // 4. Geramos todos os slots possíveis para o dia
    const availableSlots = [];
    let currentTime = new Date(`${date}T${dailyBusinessHours.start.hour}:${dailyBusinessHours.start.minute}:00`);
    const dayEnd = new Date(`${date}T${dailyBusinessHours.end.hour}:${dailyBusinessHours.end.minute}:00`);

    while (currentTime < dayEnd) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000); // Adiciona a duração do serviço

      const lunchStart = new Date(`${date}T${lunchBreak.start.hour}:${lunchBreak.start.minute}:00`);
      const lunchEnd = new Date(`${date}T${lunchBreak.end.hour}:${lunchBreak.end.minute}:00`);

      // Verifica se o slot está dentro do horário de almoço ou termina depois do fim do dia
      const isDuringLunch = slotStart < lunchEnd && slotEnd > lunchStart;
      const isAfterWork = slotEnd > dayEnd;
      
      if (!isDuringLunch && !isAfterWork) {
        // Agora, verifica se colide com algum horário já agendado
        const isBooked = bookedSlots.some(bookedSlot => {
            const bookedStart = bookedSlot.start;
            // Duração do serviço agendado (precisaríamos buscar, por simplicidade vamos assumir 30 min)
            const bookedEnd = new Date(bookedStart.getTime() + 30 * 60000); 

            return slotStart < bookedEnd && slotEnd > bookedStart;
        });

        if (!isBooked) {
          availableSlots.push(format(slotStart, 'HH:mm'));
        }
      }

      // Vai para o próximo slot possível
      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(availableSlots)
    };

  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};