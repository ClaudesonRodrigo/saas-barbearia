// netlify/functions/update-service.js

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

    const serviceId = event.path.split("/").pop();
    // Agora aceitamos um imageUrl opcional
    const { name, price, duration, imageUrl } = JSON.parse(event.body);

    if (!serviceId || !name || !price || !duration) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do serviço incompletos." }) };
    }

    const serviceRef = db.collection('barbershops').doc(barbershopId).collection('services').doc(serviceId);
    
    // Construímos o objeto de atualização dinamicamente
    const dataToUpdate = {
      name,
      price: Number(price),
      duration: Number(duration),
    };

    // Adicionamos o imageUrl apenas se ele for fornecido
    // Se for 'null', ele irá remover a imagem existente
    if (imageUrl !== undefined) {
      dataToUpdate.imageUrl = imageUrl;
    }
    
    await serviceRef.update(dataToUpdate);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Serviço atualizado com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};
