// netlify/functions/create-service.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Inicialização do Firebase Admin (já conhecemos)
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
    // --- LÓGICA DE SEGURANÇA ---
    // Pegamos o token do usuário que fez a requisição
    const token = event.headers.authorization.split("Bearer ")[1];
    
    // Verificamos se o token é válido e pegamos os dados do usuário (incluindo a 'role' e o 'barbershopId')
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    // Se o usuário não for um 'shopOwner' ou não tiver um ID de barbearia, bloqueamos a ação
    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // Pegamos os dados do serviço enviados pelo front-end
    const { name, price, duration } = JSON.parse(event.body);

    if (!name || !price || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do serviço incompletos." }) };
    }

    // Criamos um novo serviço DENTRO da subcoleção 'services' da barbearia correta
    const newServiceRef = db.collection('barbershops').doc(barbershopId).collection('services').doc();
    
    await newServiceRef.set({
      name,
      price: Number(price), // Garantimos que o preço seja um número
      duration: Number(duration), // Garantimos que a duração seja um número
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