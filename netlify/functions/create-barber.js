// netlify/functions/create-barber.js

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    // Verificamos o token do Dono da Barbearia para saber quem está fazendo a requisição
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    // Apenas um 'shopOwner' pode cadastrar um barbeiro
    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // Pegamos os dados do novo barbeiro (nome e email)
    const { name, email } = JSON.parse(event.body);
    const tempPassword = Math.random().toString(36).slice(-8); // Gera uma senha temporária

    if (!name || !email) {
      return { statusCode: 400, body: JSON.stringify({ message: "Nome e e-mail são obrigatórios." }) };
    }
    
    // 1. Cria o usuário 'barber' no Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: email,
      password: tempPassword,
      displayName: name,
    });

    // 2. Define o 'role' de Barbeiro e o ID da barbearia para esse novo usuário
    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'barber',
      barbershopId: barbershopId // Vincula à barbearia do dono que o criou
    });

    // 3. Salva os dados do barbeiro na subcoleção 'barbers' da barbearia correta
    await db.collection('barbershops').doc(barbershopId).collection('barbers').doc(userRecord.uid).set({
      name: name,
      email: email,
      createdAt: new Date(),
    });

    // 4. (Opcional) Salva o usuário na coleção geral 'users'
    await db.collection('users').doc(userRecord.uid).set({
      name: name,
      email: email,
      role: 'barber',
      barbershopId: barbershopId
    });

    return { 
      statusCode: 201, 
      // Enviamos a senha temporária de volta para que o dono possa informá-la ao barbeiro
      body: JSON.stringify({ message: `Barbeiro ${name} criado com sucesso!`, temporaryPassword: tempPassword }) 
    };

  } catch (error) {
    console.error("Erro ao criar barbeiro:", error);
    // Trata erro de e-mail já existente
    if (error.code === 'auth/email-already-exists') {
        return { statusCode: 409, body: JSON.stringify({ message: "Este e-mail já está em uso." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};