// netlify/functions/get-public-barbershop-data.js

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
  console.log("--- FUNÇÃO GET-PUBLIC-BARBERSHOP-DATA INICIADA ---");

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const slug = event.path.split("/").pop();
    console.log("1. Slug recebido:", slug);

    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ message: "Identificador da barbearia não fornecido." }) };
    }

    console.log("2. A procurar barbearia no Firestore...");
    const barbershopsRef = db.collection('barbershops');
    const querySnapshot = await barbershopsRef.where('publicUrlSlug', '==', slug).limit(1).get();

    if (querySnapshot.empty) {
      console.log("3. Nenhuma barbearia encontrada com este slug.");
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    console.log("3. Barbearia encontrada!");

    const shopDoc = querySnapshot.docs[0];
    const shopData = {
      id: shopDoc.id,
      ...shopDoc.data()
    };

    console.log("4. A buscar serviços e barbeiros...");
    const servicesRef = shopDoc.ref.collection('services');
    const barbersRef = shopDoc.ref.collection('barbers');

    const servicesSnapshot = await servicesRef.get();
    const barbersSnapshot = await barbersRef.get();

    const services = [];
    servicesSnapshot.forEach(doc => services.push({ id: doc.id, ...doc.data() }));

    const barbers = [];
    barbersSnapshot.forEach(doc => barbers.push({ id: doc.id, ...doc.data() }));
    console.log(`5. Encontrados ${services.length} serviços e ${barbers.length} barbeiros.`);

    const responseData = {
      shop: shopData,
      services: services,
      barbers: barbers
    };

    console.log("6. A enviar resposta para o front-end...");
    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error("### ERRO FATAL NA FUNÇÃO GET-PUBLIC-BARBERSHOP-DATA ###:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar dados.' }) 
    };
  }
};
