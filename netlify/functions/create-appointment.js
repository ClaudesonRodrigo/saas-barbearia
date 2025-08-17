// netlify/functions/create-appointment.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth();

// --- Placeholder para a nossa função de envio de e-mail ---
const sendEmail = async ({ to, subject, body }) => {
  console.log("--- SIMULAÇÃO DE ENVIO DE E-MAIL ---");
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Corpo: ${body}`);
  console.log("------------------------------------");
  return Promise.resolve();
};
// ---------------------------------------------------------

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      barbershopId,
      clientId,
      services,
      serviceName,
      serviceDuration,
      servicePrice,
      barberId,
      startTime,
      clientName,
      clientEmail
    } = JSON.parse(event.body);

    if (!barbershopId || !clientId || !services || services.length === 0 || !startTime || !clientName || !clientEmail || !barberId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do agendamento incompletos." }) };
    }

    const appointmentStart = new Date(startTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60000);

    // --- VERIFICAÇÃO DE CONFLITO (Lógica de data corrigida) ---
    const startOfDay = new Date(appointmentStart);
    startOfDay.setUTCHours(0, 0, 0, 0); // Usando UTC para consistência

    const endOfDay = new Date(appointmentStart);
    endOfDay.setUTCHours(23, 59, 59, 999); // Usando UTC para consistência

    const appointmentsRef = db.collection('schedules');
    const querySnapshot = await appointmentsRef
        .where('barbershopId', '==', barbershopId)
        .where('barberId', '==', barberId)
        .where('startTime', '>=', startOfDay)
        .where('startTime', '<=', endOfDay)
        .get();

    const isAlreadyBooked = querySnapshot.docs.some(doc => {
        const existingApp = doc.data();
        const existingStart = existingApp.startTime.toDate();
        const existingEnd = new Date(existingStart.getTime() + (existingApp.serviceDuration * 60000));
        return appointmentStart.getTime() < existingEnd.getTime() && appointmentEnd.getTime() > existingStart.getTime();
    });

    if (isAlreadyBooked) {
        return { statusCode: 409, body: JSON.stringify({ message: "Conflito: Este horário já foi reservado. Por favor, escolha outro." }) };
    }
    // --- FIM DA VERIFICAÇÃO ---
    
    const newAppointmentRef = db.collection('schedules').doc();
    
    await newAppointmentRef.set({
      barbershopId,
      clientId,
      services,
      serviceName,
      serviceDuration: Number(serviceDuration),
      servicePrice: Number(servicePrice),
      barberId,
      clientName,
      clientEmail,
      startTime: Timestamp.fromDate(appointmentStart),
      status: 'confirmed',
      createdAt: Timestamp.now(),
    });

    // --- LÓGICA DE NOTIFICAÇÕES (sem alterações) ---
    const shopDoc = await db.collection('barbershops').doc(barbershopId).get();
    const shopData = shopDoc.data();
    const ownerUser = await authAdmin.getUser(shopData.ownerId);
    const ownerEmail = ownerUser.email;

    const formattedDateTime = appointmentStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await sendEmail({
      to: clientEmail,
      subject: `Agendamento Confirmado na ${shopData.name}!`,
      body: `Olá ${clientName}, o seu agendamento para "${serviceName}" no dia ${formattedDateTime} foi confirmado com sucesso.`
    });

    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: `Novo Agendamento: ${clientName}`,
        body: `Um novo agendamento foi marcado por ${clientName} (${clientEmail}) para "${serviceName}" no dia ${formattedDateTime}.`
      });
    }
    // --- FIM DA LÓGICA DE NOTIFICAÇÕES ---

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
