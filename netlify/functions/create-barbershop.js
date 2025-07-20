// netlify/functions/create-barbershop.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const authAdmin = getAuth();
const db = getFirestore();

exports.handler = async function(event, context) {

    console.log("--- INÍCIO DO DEBUG DA FUNÇÃO ---");
    console.log("Variável de ambiente FIREBASE_SERVICE_ACCOUNT está definida?", !!process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Tipo do event.body:", typeof event.body);
    console.log("Conteúdo do event.body:", event.body);
    console.log("--- FIM DO DEBUG DA FUNÇÃO ---");
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Futuramente, vamos adicionar uma verificação para garantir que só um Super Admin pode chamar isso
  
  const { shopName, ownerEmail, ownerPassword } = JSON.parse(event.body);

  if (!shopName || !ownerEmail || !ownerPassword) {
    return { statusCode: 400, body: JSON.stringify({ message: "Dados incompletos." }) };
  }

  try {
    // 1. Cria a barbearia no Firestore para obter um ID único
    const newShopRef = db.collection('barbershops').doc();
    
    // 2. Cria o usuário Dono da Loja no Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: `Dono(a) da ${shopName}`,
    });

    // 3. ESSENCIAL: Define o "role" de Dono e o ID da barbearia para esse usuário
    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'shopOwner',
      barbershopId: newShopRef.id 
    });

    // 4. Agora, salva os dados da barbearia no Firestore, já com o ID do dono
    await newShopRef.set({
      name: shopName,
      ownerId: userRecord.uid,
      publicUrlSlug: shopName.toLowerCase().replace(/\s+/g, '-'),
      status: 'active',
      createdAt: new Date(),
    });

    // 5. (Opcional, mas recomendado) Cria um documento para o dono na coleção 'users'
    await db.collection('users').doc(userRecord.uid).set({
      name: `Dono(a) da ${shopName}`,
      email: ownerEmail,
      role: 'shopOwner',
      barbershopId: newShopRef.id
    });

    return { 
      statusCode: 201, 
      body: JSON.stringify({ message: 'Barbearia criada com sucesso!', shopId: newShopRef.id }) 
    };

  } catch (error) {
    console.error("Erro ao criar barbearia:", error);
    // Adicionar lógica para deletar o usuário criado se a operação falhar no meio
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message }) 
    };
  }
};