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

// Definimos os limites para cada plano
const PLAN_LIMITS = {
  monthly_plan: 4,
  semestral_plan: 10,
  yearly_plan: Infinity, // Ilimitado
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }

    // --- LÓGICA DE VERIFICAÇÃO DE LIMITE ---
    const shopRef = db.collection('barbershops').doc(barbershopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: "Barbearia não encontrada." }) };
    }
    
    const planId = shopDoc.data().planId;
    const limit = PLAN_LIMITS[planId] || 0; // Se não tiver plano, o limite é 0

    const barbersSnapshot = await shopRef.collection('barbers').get();
    const currentBarberCount = barbersSnapshot.size;

    if (currentBarberCount >= limit) {
      return { statusCode: 403, body: JSON.stringify({ message: `Limite de ${limit} barbeiros para o seu plano foi atingido.` }) };
    }
    // --- FIM DA LÓGICA DE VERIFICAÇÃO ---

    const { name, email } = JSON.parse(event.body);
    const tempPassword = Math.random().toString(36).slice(-8);

    if (!name || !email) {
      return { statusCode: 400, body: JSON.stringify({ message: "Nome e e-mail são obrigatórios." }) };
    }
    
    const userRecord = await authAdmin.createUser({
      email: email,
      password: tempPassword,
      displayName: name,
    });

    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'barber',
      barbershopId: barbershopId
    });

    await shopRef.collection('barbers').doc(userRecord.uid).set({
      name: name,
      email: email,
      createdAt: new Date(),
    });

    await db.collection('users').doc(userRecord.uid).set({
      name: name,
      email: email,
      role: 'barber',
      barbershopId: barbershopId
    });

    return { 
      statusCode: 201, 
      body: JSON.stringify({ message: `Barbeiro ${name} criado com sucesso!`, temporaryPassword: tempPassword }) 
    };

  } catch (error) {
    console.error("Erro ao criar barbeiro:", error);
    if (error.code === 'auth/email-already-exists') {
        return { statusCode: 409, body: JSON.stringify({ message: "Este e-mail já está em uso." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};
