// netlify/functions/scheduled-reminders.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const twilio = require('twilio');

// --- Configurações ---
// Firebase: Usa a variável de ambiente que já tínhamos
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// Twilio: Pega as credenciais que você acabou de configurar na Netlify
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // O número do sandbox
const twilioClient = twilio(accountSid, authToken);
// --- Fim das Configurações ---

exports.handler = async function(event, context) {
  console.log("Iniciando a função de lembretes agendados...");

  try {
    // 1. CALCULAR A JANELA DE TEMPO
    // Queremos agendamentos que acontecerão entre 24h e 25h a partir de agora,
    // para garantir que a função pegue todos os agendamentos do dia seguinte.
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
    const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000); // Janela de 1 hora para buscar

    // 2. BUSCAR AGENDAMENTOS NO FIRESTORE
    const snapshot = await db.collection('schedules')
      .where('status', '==', 'confirmed')
      .where('startTime', '>=', startTime.toISOString())
      .where('startTime', '<', endTime.toISOString())
      .get();

    if (snapshot.empty) {
      console.log("Nenhum agendamento encontrado para o próximo dia. Encerrando.");
      return { statusCode: 200, body: "Nenhum agendamento para notificar." };
    }

    console.log(`Encontrados ${snapshot.docs.length} agendamentos para notificar.`);
    
    // 3. PROCESSAR CADA AGENDAMENTO
    for (const doc of snapshot.docs) {
      const schedule = doc.data();
      
      const clientDoc = await db.collection('clients').doc(schedule.clientId).get();
      if (!clientDoc.exists || !clientDoc.data().wantsWhatsappReminders || !clientDoc.data().whatsappNumber) {
        console.log(`Cliente ${schedule.clientId} não tem dados de WhatsApp ou não quer receber lembretes. Pulando.`);
        continue;
      }
      
      const barbershopDoc = await db.collection('barbershops').doc(schedule.barbershopId).get();
      const client = clientDoc.data();
      const barbershop = barbershopDoc.data();

      // Formata a data para o formato brasileiro
      const appointmentDate = new Date(schedule.startTime).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 4. MONTAR E ENVIAR A MENSAGEM
      const messageBody = `Olá, ${client.name}! Lembrete do seu agendamento na ${barbershop.name} amanhã, dia ${appointmentDate}. Esperamos por você!`;
      
      console.log(`Enviando mensagem para ${client.whatsappNumber}: "${messageBody}"`);

      await twilioClient.messages.create({
         from: `whatsapp:${twilioPhoneNumber}`,
         to: `whatsapp:${client.whatsappNumber}`,
         body: messageBody
      });
    }

    return { statusCode: 200, body: "Lembretes enviados com sucesso." };

  } catch (error) {
    console.error("Erro ao executar a função de lembretes:", error);
    return { statusCode: 500, body: "Erro interno no servidor." };
  }
};