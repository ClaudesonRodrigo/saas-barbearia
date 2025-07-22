// netlify/functions/update-barber.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth();

exports.handler = async function(event, context) {
  // Esta função só aceita requisições PUT
  if (event.httpMethod !== 'PUT') {
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

    const barberIdToUpdate = event.path.split("/").pop();
    const { name, email } = JSON.parse(event.body);

    if (!barberIdToUpdate) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do barbeiro não fornecido." }) };
    }
    if (!name || !email) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do barbeiro incompletos." }) };
    }

    // 1. Atualizamos os dados do utilizador no Firebase Authentication
    await authAdmin.updateUser(barberIdToUpdate, {
      email: email,
      displayName: name,
    });

    // 2. Atualizamos os dados na subcoleção 'barbers'
    const barberRef = db.collection('barbershops').doc(barbershopId).collection('barbers').doc(barberIdToUpdate);
    await barberRef.update({
      name: name,
      email: email,
    });
    
    // 3. (Opcional) Atualizamos os dados na coleção geral 'users'
    const userRef = db.collection('users').doc(barberIdToUpdate);
    await userRef.update({
      name: name,
      email: email,
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Dados do barbeiro atualizados com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar barbeiro:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao atualizar os dados do barbeiro.' }) 
    };
  }
};
