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
  // Esta função só aceita requisições GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Buscamos a coleção 'barbershops'
    const barbershopsRef = db.collection('barbershops');
    const snapshot = await barbershopsRef.where('status', '==', 'active').get(); // Mostra apenas barbearias ativas

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]), // Retorna uma lista vazia se não houver barbearias
      };
    }

    // 2. Montamos uma lista simplificada com os dados públicos de cada barbearia
    const barbershops = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      barbershops.push({
        id: doc.id,
        name: data.name,
        address: data.address,
        slug: data.publicUrlSlug // O slug para construir o link de agendamento
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
