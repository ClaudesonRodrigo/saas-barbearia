// netlify/functions/register-client.js

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
  // Esta função só aceita requisições POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, password } = JSON.parse(event.body);

    if (!name || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Nome, e-mail e senha são obrigatórios." }) };
    }

    // 1. Cria o novo utilizador no Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Define a permissão (role) de 'client' para este novo utilizador
    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'client'
    });

    // 3. Guarda as informações do cliente na nossa coleção geral 'users'
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name,
      email: email,
      role: 'client',
      createdAt: new Date(),
    });

    return { 
      statusCode: 201, 
      body: JSON.stringify({ message: `Bem-vindo, ${name}! A sua conta foi criada com sucesso.` }) 
    };

  } catch (error) {
    console.error("Erro ao registar cliente:", error);
    if (error.code === 'auth/email-already-exists') {
        return { statusCode: 409, body: JSON.stringify({ message: "Este e-mail já está em uso." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao criar a conta.' }) 
    };
  }
};
