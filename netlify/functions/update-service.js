// netlify/functions/update-service.js

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
  // Esta função só aceita requisições PUT (padrão para atualização)
  if (event.httpMethod !== 'PUT') {
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

    // Pegamos o ID do serviço que queremos atualizar, que virá na URL
    const serviceId = event.path.split("/").pop();
    
    // Pegamos os novos dados do serviço, que virão no corpo da requisição
    const { name, price, duration } = JSON.parse(event.body);

    if (!serviceId) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do serviço não fornecido." }) };
    }

    if (!name || !price || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do serviço incompletos." }) };
    }

    // Montamos a referência para o documento que queremos atualizar
    const serviceRef = db.collection('barbershops').doc(barbershopId).collection('services').doc(serviceId);
    
    // Atualizamos o documento com os novos dados
    await serviceRef.update({
      name,
      price: Number(price),
      duration: Number(duration),
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Serviço atualizado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};