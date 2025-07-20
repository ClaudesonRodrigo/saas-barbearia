// netlify/functions/get-barbers.js

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
  if (event.httpMethod !== 'GET') {
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

    // Buscamos a subcoleção 'barbers' dentro do documento da barbearia correta
    const barbersRef = db.collection('barbershops').doc(barbershopId).collection('barbers');
    const snapshot = await barbersRef.orderBy('createdAt').get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]), // Retorna uma lista vazia
      };
    }

    const barbers = [];
    snapshot.forEach(doc => {
      barbers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(barbers)
    };

  } catch (error) {
    console.error("Erro ao buscar barbeiros:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};