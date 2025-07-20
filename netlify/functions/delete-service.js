// netlify/functions/delete-service.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const authAdmin = getAuth();
const db = getFirestore();

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

    // Pegamos o ID do serviço que queremos deletar, que virá na URL
    // Ex: /.netlify/functions/delete-service/ID_DO_SERVICO
    const serviceId = event.path.split("/").pop();

    if (!serviceId) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do serviço não fornecido." }) };
    }

    // Montamos a referência para o documento que queremos deletar
    const serviceRef = db.collection('barbershops').doc(barbershopId).collection('services').doc(serviceId);
    
    // Deletamos o documento
    await serviceRef.delete();

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Serviço deletado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao deletar serviço:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};