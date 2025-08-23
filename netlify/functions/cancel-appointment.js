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
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Segurança: Verificamos se o utilizador é um Dono de Barbearia
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    
    // 2. Pegamos o ID do agendamento a ser cancelado
    const appointmentId = event.path.split("/").pop();

    if (!appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do agendamento não fornecido." }) };
    }

    // 3. CORREÇÃO: Apontamos para a coleção principal 'schedules'
    const appointmentRef = db.collection('schedules').doc(appointmentId);
    const doc = await appointmentRef.get();

    if (!doc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: "Agendamento não encontrado." }) };
    }

    // 4. Segurança extra: Verificamos se o agendamento pertence à barbearia do dono logado
    if (doc.data().barbershopId !== barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Você não tem permissão para cancelar este agendamento." }) };
    }

    // 5. Se tudo estiver correto, apagamos o agendamento
    await appointmentRef.delete();

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Agendamento cancelado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao cancelar agendamento pelo dono:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao cancelar o agendamento.' }) 
    };
  }
};