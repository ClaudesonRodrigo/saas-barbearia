// netlify/functions/get-public-barbershop-data.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// AQUI ESTÁ A PARTE IMPORTANTE: exports.handler
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const slug = event.path.split("/").pop();

    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ message: "Identificador da barbearia não fornecido." }) };
    }

    const barbershopsRef = db.collection('barbershops');
    const querySnapshot = await barbershopsRef.where('publicUrlSlug', '==', slug).limit(1).get();

    if (querySnapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }

    const shopDoc = querySnapshot.docs[0];
    const shopData = {
      id: shopDoc.id,
      ...shopDoc.data()
    };

    const servicesRef = shopDoc.ref.collection('services');
    const barbersRef = shopDoc.ref.collection('barbers');

    const servicesSnapshot = await servicesRef.get();
    const barbersSnapshot = await barbersRef.get();

    const services = [];
    servicesSnapshot.forEach(doc => services.push({ id: doc.id, ...doc.data() }));

    const barbers = [];
    barbersSnapshot.forEach(doc => barbers.push({ id: doc.id, ...doc.data() }));

    const responseData = {
      shop: shopData,
      services: services,
      barbers: barbers
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error("Erro ao buscar dados públicos da barbearia:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};