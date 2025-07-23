// netlify/functions/cancel-client-appointment.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Segurança: Verificamos o token do cliente
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { email: clientEmailFromToken } = decodedToken;

    if (!clientEmailFromToken) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Token inválido." }) };
    }

    // 2. Pegamos os IDs da URL (ex: .../barbershopId/appointmentId)
    const pathParts = event.path.split("/").filter(p => p);
    const barbershopId = pathParts[pathParts.length - 2];
    const appointmentId = pathParts[pathParts.length - 1];

    if (!barbershopId || !appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ message: "IDs da barbearia e do agendamento são necessários." }) };
    }

    // 3. Acedemos diretamente ao documento do agendamento
    const appointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc(appointmentId);
    const doc = await appointmentRef.get();

    if (!doc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: "Agendamento não encontrado." }) };
    }

    const appointmentData = doc.data();

    // 4. Segurança: Verificamos se o e-mail do agendamento corresponde ao e-mail do token
    if (appointmentData.clientEmail !== clientEmailFromToken) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Você só pode cancelar os seus próprios agendamentos." }) };
    }

    // 5. Se tudo estiver correto, apagamos o agendamento
    await appointmentRef.delete();

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Agendamento cancelado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao cancelar agendamento pelo cliente:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao processar o seu pedido.' }) 
    };
  }
};
