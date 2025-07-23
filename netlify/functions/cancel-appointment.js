// netlify/functions/cancel-appointment.js

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
  // Esta função só aceita requisições DELETE
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const appointmentId = event.path.split("/").pop();

    if (!appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do agendamento não fornecido." }) };
    }

    const appointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc(appointmentId);
    
    await appointmentRef.delete();

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Agendamento cancelado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao cancelar o agendamento.' }) 
    };
  }
};
