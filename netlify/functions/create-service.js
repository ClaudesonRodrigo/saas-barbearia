// netlify/functions/create-service.js

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }

    // Agora aceitamos um imageUrl opcional
    const { name, price, duration, imageUrl } = JSON.parse(event.body);

    if (!name || !price || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do serviço incompletos." }) };
    }

    const newServiceRef = db.collection('barbershops').doc(barbershopId).collection('services').doc();
    
    await newServiceRef.set({
      name,
      price: Number(price),
      duration: Number(duration),
      imageUrl: imageUrl || null, // Guarda a URL da imagem ou null se não for fornecida
      createdAt: new Date(),
    });

    return { 
      statusCode: 201, 
      body: JSON.stringify({ message: 'Serviço criado com sucesso!', serviceId: newServiceRef.id }) 
    };

  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido ou expirado." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};
