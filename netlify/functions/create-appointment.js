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

// --- Placeholder para a nossa função de envio de e-mail ---
// No futuro, aqui entraria a integração com um serviço como o SendGrid
const sendEmail = async ({ to, subject, body }) => {
  console.log("--- SIMULAÇÃO DE ENVIO DE E-MAIL ---");
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Corpo: ${body}`);
  console.log("------------------------------------");
  // Em produção, aqui teríamos: await sendgrid.send({ to, from, subject, html });
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
      serviceName,
      serviceDuration,
      barberId,
      date,
      slot,
      clientName,
      clientEmail
    } = JSON.parse(event.body);

    // ... (validação de dados, sem alterações)

    const [hour, minute] = slot.split(':');
    const appointmentDateTimeString = `${date}T${hour}:${minute}:00`;
    const appointmentDate = fromZonedTime(appointmentDateTimeString, TIME_ZONE);

    // ... (verificação de segurança de horário duplicado, sem alterações)
    
    // Guardamos o novo agendamento
    const newAppointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc();
    await newAppointmentRef.set({
      // ... (dados do agendamento)
      serviceName,
      serviceDuration: Number(serviceDuration),
      barberId,
      clientName,
      clientEmail,
      date: Timestamp.fromDate(appointmentDate),
      status: 'confirmed',
      createdAt: Timestamp.now(),
    });

    // --- LÓGICA DE NOTIFICAÇÕES POR E-MAIL ---
    // 1. Buscamos os dados da barbearia para obter o e-mail do dono
    const shopDoc = await db.collection('barbershops').doc(barbershopId).get();
    const shopData = shopDoc.data();
    const ownerEmail = shopData.ownerEmail; // Assumindo que temos este campo

    // 2. Enviamos o e-mail de confirmação para o cliente
    await sendEmail({
      to: clientEmail,
      subject: `Agendamento Confirmado na ${shopData.name}!`,
      body: `Olá ${clientName}, o seu agendamento para o serviço "${serviceName}" no dia ${date} às ${slot} foi confirmado com sucesso.`
    });

    // 3. Enviamos o e-mail de notificação para o dono da barbearia (se ele tiver um e-mail registado)
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
