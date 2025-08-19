// netlify/functions/cancel-client-appointment.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// 1. Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth();

exports.handler = async function(event, context) {
  // 2. Usaremos o método DELETE, que é o mais apropriado para apagar um recurso.
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido' }) };
  }

  try {
    // 3. Pegamos apenas o ID do agendamento, que agora é único.
    const appointmentId = event.path.split("/").pop();
    if (!appointmentId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'O ID do agendamento é obrigatório.' }) };
    }

    // 4. Verificamos quem é o usuário pelo UID do token.
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const clientUid = decodedToken.uid; // ID do usuário logado

    // 5. Verificação de Segurança na coleção correta ('schedules').
    const appointmentRef = db.collection('schedules').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: "Agendamento não encontrado." }) };
    }

    // Comparamos o 'clientId' (UID) do agendamento com o UID do usuário.
    if (appointmentDoc.data().clientId !== clientUid) {
      return { statusCode: 403, body: JSON.stringify({ message: "Você não tem permissão para cancelar este agendamento." }) };
    }

    // 6. Se tudo estiver certo, deletamos o agendamento.
    await appointmentRef.delete();

    // 7. Retornamos uma mensagem de sucesso.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Agendamento cancelado com sucesso!" })
    };

  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    if (error.code === 'auth/id-token-expired') {
        return { statusCode: 401, body: JSON.stringify({ message: 'Sua sessão expirou, por favor, faça login novamente.' }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao cancelar o agendamento.' }) 
    };
  }
};