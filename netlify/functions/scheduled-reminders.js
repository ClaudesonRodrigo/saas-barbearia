// netlify/functions/scheduled-reminders.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const twilio = require('twilio');

// --- Configurações ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);
// --- Fim das Configurações ---

exports.handler = async function(event, context) {
  console.log("Iniciando a função de lembretes agendados...");

  try {
    // 1. CALCULAR A JANELA DE TEMPO
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
    const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);

    // 2. BUSCAR AGENDAMENTOS NO FIRESTORE
    // Buscando na coleção correta 'schedules'
    const snapshot = await db.collection('schedules')
      .where('status', '==', 'confirmed')
      .where('startTime', '>=', startTime)
      .where('startTime', '<', endTime)
      .get();

    if (snapshot.empty) {
      console.log("Nenhum agendamento encontrado para o próximo dia. Encerrando.");
      return { statusCode: 200, body: "Nenhum agendamento para notificar." };
    }

    console.log(`Encontrados ${snapshot.docs.length} agendamentos para notificar.`);
    
    // 3. PROCESSAR CADA AGENDAMENTO
    for (const doc of snapshot.docs) {
      const schedule = doc.data();
      
      // Buscando na coleção correta 'users'
      const clientDoc = await db.collection('users').doc(schedule.clientId).get();
      if (!clientDoc.exists() || !clientDoc.data().wantsWhatsappReminders || !clientDoc.data().whatsappNumber) {
        console.log(`Cliente ${schedule.clientId} não tem dados de WhatsApp ou não quer receber lembretes. Pulando.`);
        continue;
      }
      
      const barbershopDoc = await db.collection('barbershops').doc(schedule.barbershopId).get();
      const client = clientDoc.data();
      const barbershop = barbershopDoc.data();

      const appointmentDate = new Date(schedule.startTime.toDate()).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 4. MONTAR E ENVIAR A MENSAGEM
      const messageBody = `Olá, ${client.name}! Lembrete do seu agendamento na ${barbershop.name} amanhã, dia ${appointmentDate}. Esperamos por você!`;
      
      console.log(`Enviando mensagem para ${client.whatsappNumber}: "${messageBody}"`);

      // --- ATUALIZAÇÃO APLICADA AQUI ---
      // a. Capturamos a resposta do Twilio ao enviar a mensagem
      const message = await twilioClient.messages.create({
         from: `whatsapp:${twilioPhoneNumber}`,
         to: `whatsapp:${client.whatsappNumber}`,
         body: messageBody
      });

      // b. Salvamos o ID (SID) da mensagem no nosso documento de agendamento
      await doc.ref.update({
        notificationSid: message.sid
      });

      console.log(`Mensagem enviada com SID: ${message.sid}`);
      // --- FIM DA ATUALIZAÇÃO ---
    }

    return { statusCode: 200, body: "Lembretes enviados com sucesso." };

  } catch (error) {
    console.error("Erro ao executar a função de lembretes:", error);
    return { statusCode: 500, body: "Erro interno no servidor." };
  }
};