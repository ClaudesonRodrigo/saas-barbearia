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
    // Verificamos o token do Dono da Barbearia para garantir que ele só pode cancelar agendamentos da sua loja
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // Pegamos o ID do agendamento que queremos cancelar, que virá na URL
    // Ex: /.netlify/functions/cancel-appointment/ID_DO_AGENDAMENTO
    const appointmentId = event.path.split("/").pop();

    if (!appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do agendamento não fornecido." }) };
    }

    // Montamos a referência para o documento que queremos apagar
    const appointmentRef = db.collection('barbershops').doc(barbershopId).collection('appointments').doc(appointmentId);
    
    // Apagamos o documento
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
