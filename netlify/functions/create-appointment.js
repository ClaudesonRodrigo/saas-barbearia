// netlify/functions/create-appointment.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { fromZonedTime } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

const TIME_ZONE = 'America/Sao_Paulo';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      barbershopId,
      serviceId,
      serviceName,
      serviceDuration,
      barberId,
      date, // Formato "YYYY-MM-DD"
      slot, // Formato "HH:mm"
      clientName,
      clientEmail
    } = JSON.parse(event.body);

    if (!barbershopId || !serviceId || !date || !slot || !clientName || !clientEmail || !barberId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do agendamento incompletos." }) };
    }

    const [hour, minute] = slot.split(':');
    const appointmentDateTimeString = `${date}T${hour}:${minute}:00`;
    const appointmentDate = fromZonedTime(appointmentDateTimeString, TIME_ZONE);
    const appointmentEnd = new Date(appointmentDate.getTime() + serviceDuration * 60000);

    // --- VERIFICAÇÃO DE SEGURANÇA FINAL NO BACK-END ---
    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const querySnapshot = await appointmentsRef
        .where('barberId', '==', barberId)
        .where('date', '>=', fromZonedTime(`${date}T00:00:00`, TIME_ZONE))
        .where('date', '<=', fromZonedTime(`${date}T23:59:59`, TIME_ZONE))
        .get();

    const isAlreadyBooked = querySnapshot.docs.some(doc => {
        const existingApp = doc.data();
        const existingStart = existingApp.date.toDate();
        const existingEnd = new Date(existingStart.getTime() + (existingApp.serviceDuration * 60000));
        // Verifica colisão
        return appointmentDate.getTime() < existingEnd.getTime() && appointmentEnd.getTime() > existingStart.getTime();
    });

    if (isAlreadyBooked) {
        return { statusCode: 409, body: JSON.stringify({ message: "Conflito: Este horário já foi reservado. Por favor, escolha outro." }) };
    }
    // --- FIM DA VERIFICAÇÃO ---
    
    const newAppointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc();
    
    await newAppointmentRef.set({
      serviceId,
      serviceName,
      serviceDuration: Number(serviceDuration),
      barberId,
      clientName,
      clientEmail,
      date: Timestamp.fromDate(appointmentDate),
      status: 'confirmed',
      createdAt: Timestamp.now(),
    });

    return { 
      statusCode: 201,
      body: JSON.stringify({ message: 'Agendamento confirmado com sucesso!', appointmentId: newAppointmentRef.id }) 
    };

  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao processar o agendamento.' }) 
    };
  }
};
