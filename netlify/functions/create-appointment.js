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
  // Esta função só aceita requisições POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Pegamos os dados do agendamento enviados pelo front-end
    const {
      barbershopId,
      serviceId,
      serviceName,
      serviceDuration,
      date, // Formato "YYYY-MM-DD"
      slot, // Formato "HH:mm"
      clientName,
      clientEmail
    } = JSON.parse(event.body);

    // Validação básica dos dados recebidos
    if (!barbershopId || !serviceId || !date || !slot || !clientName || !clientEmail) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do agendamento incompletos." }) };
    }

    // 2. Convertemos a data e o horário para um Timestamp do Firestore
    // Isso é crucial para que possamos fazer buscas por data no futuro
    const [hour, minute] = slot.split(':');
    const appointmentDateTimeString = `${date}T${hour}:${minute}:00`;
    
    // Usamos a biblioteca de fuso horário para garantir que a data seja salva corretamente em UTC
    const appointmentDate = fromZonedTime(appointmentDateTimeString, TIME_ZONE);

    // 3. TODO: Adicionar uma verificação de segurança
    // Antes de salvar, deveríamos verificar novamente se este horário ainda está disponível.
    // Isso evita que duas pessoas agendem ao mesmo tempo. Por enquanto, vamos pular esta etapa para simplificar.

    // 4. Salvamos o novo agendamento na subcoleção 'appointments' da barbearia correta
    const newAppointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc();
    
    await newAppointmentRef.set({
      serviceId,
      serviceName,
      serviceDuration: Number(serviceDuration),
      clientName,
      clientEmail,
      date: Timestamp.fromDate(appointmentDate), // Salva como um tipo de data do Firestore
      status: 'confirmed', // Status inicial do agendamento
      createdAt: Timestamp.now(), // Data de quando o agendamento foi criado
    });

    return { 
      statusCode: 201, // 201 Created
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
