// netlify/functions/get-barbershops.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

exports.handler = async function(event, context) {
  // Por enquanto, qualquer um pode chamar, mas depois vamos proteger para só Super Admin acessar
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const barbershopsRef = db.collection('barbershops');
    const snapshot = await barbershopsRef.get();

    if (snapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]), // Retorna uma lista vazia se não houver barbearias
      };
    }

    const barbershops = [];
    snapshot.forEach(doc => {
      barbershops.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(barbershops)
    };

  } catch (error) {
    console.error("Erro ao buscar barbearias:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};