// netlify/functions/get-latest-barbershops.js

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
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const barbershopsRef = db.collection('barbershops');
    const snapshot = await barbershopsRef
      .where('status', '==', 'active')       // Filtra apenas as ativas
      .orderBy('createdAt', 'desc')         // Ordena pelas mais recentes
      .limit(3)                             // Limita o resultado a 3
      .get();

    if (snapshot.empty) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const barbershops = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.location?.address || 'Endereço não informado', // Acesso seguro ao endereço
        slug: data.publicUrlSlug,
        logoUrl: data.logoUrl || null
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(barbershops)
    };

  } catch (error) {
    console.error("Erro ao buscar últimas barbearias:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};