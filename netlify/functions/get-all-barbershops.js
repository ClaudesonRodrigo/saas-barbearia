// netlify/functions/get-all-barbershops.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const barbershopsRef = db.collection('barbershops');
    const snapshot = await barbershopsRef.where('status', '==', 'active').get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    const barbershops = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      barbershops.push({
        id: doc.id,
        name: data.name,
        address: data.address,
        slug: data.publicUrlSlug,
        logoUrl: data.logoUrl || null // Adicionamos a URL do logo
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(barbershops)
    };

  } catch (error) {
    console.error("Erro ao buscar todas as barbearias:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};
