// netlify/functions/update-shop-settings.js

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
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }

    const settingsData = JSON.parse(event.body);

    if (!settingsData) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados de configuração não fornecidos." }) };
    }

    const shopRef = db.collection('barbershops').doc(barbershopId);
    
    await shopRef.set(settingsData, { merge: true });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Configurações da loja atualizadas com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao atualizar as configurações.' }) 
    };
  }
};
