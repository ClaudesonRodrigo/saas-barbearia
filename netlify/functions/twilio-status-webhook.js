// netlify/functions/twilio-status-webhook.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const twilio = require('twilio');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

exports.handler = async function(event, context) {
  // 1. Validação de segurança para garantir que a requisição veio do Twilio
  const twilioSignature = event.headers['x-twilio-signature'];
  const webhookUrl = `https://${event.headers.host}${event.path}`;
  const params = new URLSearchParams(event.body);
  const requestParams = Object.fromEntries(params.entries());

  if (!twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, twilioSignature, webhookUrl, requestParams)) {
    return { statusCode: 403, body: 'Acesso negado: Assinatura do Twilio inválida.' };
  }

  // 2. Extraímos o status e o "código de rastreio" (MessageSid)
  const { MessageStatus, MessageSid } = requestParams;
  console.log(`Recebido status '${MessageStatus}' para a mensagem ${MessageSid}`);

  if (!MessageSid) {
    return { statusCode: 200, body: 'SID da mensagem não fornecido.' };
  }

  try {
    // 3. Buscamos o agendamento no nosso banco que tem esse "código de rastreio"
    const schedulesRef = db.collection('schedules');
    const querySnapshot = await schedulesRef.where('notificationSid', '==', MessageSid).limit(1).get();
    
    if (!querySnapshot.empty) {
      const scheduleDoc = querySnapshot.docs[0];
      
      // 4. Atualizamos o agendamento com o novo status da notificação
      await scheduleDoc.ref.update({
        notificationStatus: MessageStatus, // ex: 'sent', 'delivered', 'failed'
        notificationStatusUpdatedAt: new Date(),
      });
      console.log(`Agendamento ${scheduleDoc.id} atualizado com o status: ${MessageStatus}`);
    } else {
      console.warn(`Nenhum agendamento encontrado com o SID: ${MessageSid}`);
    }

  } catch (error) {
    console.error("Erro ao processar webhook do Twilio:", error);
    // Mesmo com erro interno, respondemos 200 para o Twilio não tentar reenviar indefinidamente.
  }

  return { statusCode: 200, body: 'Status recebido.' };
};