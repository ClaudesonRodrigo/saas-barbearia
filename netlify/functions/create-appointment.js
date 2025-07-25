// netlify/functions/create-appointment.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth'); // Importamos o getAuth
const { fromZonedTime } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth(); // Criamos a instância do Auth

const TIME_ZONE = 'America/Sao_Paulo';

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
      serviceId,
      serviceName,
      serviceDuration,
      servicePrice,
      barberId,
      date,
      slot,
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

    // --- VERIFICAÇÃO DE SEGURANÇA NO BACK-END ---
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
      servicePrice: Number(servicePrice),
      barberId,
      clientName,
      clientEmail,
      date: Timestamp.fromDate(appointmentDate),
      status: 'confirmed',
      createdAt: Timestamp.now(),
    });

    // --- LÓGICA DE NOTIFICAÇÕES CORRIGIDA ---
    const shopDoc = await db.collection('barbershops').doc(barbershopId).get();
    const shopData = shopDoc.data();
    
    // Usamos o ownerId para buscar o utilizador e obter o seu e-mail
    const ownerUser = await authAdmin.getUser(shopData.ownerId);
    const ownerEmail = ownerUser.email;

    await sendEmail({
      to: clientEmail,
      subject: `Agendamento Confirmado na ${shopData.name}!`,
      body: `Olá ${clientName}, o seu agendamento para o serviço "${serviceName}" no dia ${date} às ${slot} foi confirmado com sucesso.`
    });

    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: `Novo Agendamento: ${clientName} às ${slot}`,
        body: `Um novo agendamento foi marcado por ${clientName} (${clientEmail}) para o serviço "${serviceName}" no dia ${date} às ${slot}.`
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
