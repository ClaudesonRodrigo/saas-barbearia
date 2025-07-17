// netlify/functions/create-barbershop.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// As credenciais de serviço do Firebase DEVEM ser uma Environment Variable no Netlify
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Evita reinicializações múltiplas em ambiente de desenvolvimento
if (!getAuth().app) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const authAdmin = getAuth();

exports.handler = async function(event, context) {
  // Apenas o Super Admin pode chamar esta função.
  // Futuramente, vamos proteger isso verificando o token JWT do requisitante.
  // Por agora, vamos focar na lógica principal.

  const { shopName, ownerEmail, ownerPassword } = JSON.parse(event.body);

  if (!shopName || !ownerEmail || !ownerPassword) {
    return { statusCode: 400, body: JSON.stringify({ message: "Dados incompletos." }) };
  }

  try {
    // 1. Criar a barbearia no Firestore para obter um ID
    const newShopRef = db.collection('barbershops').doc();
    
    // 2. Criar o usuário Dono da Loja no Firebase Auth
    const userRecord = await authAdmin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: shopName, // Ou um nome de dono
    });

    // 3. Salvar os dados da barbearia, agora com o ID do dono
    await newShopRef.set({
      name: shopName,
      ownerId: userRecord.uid,
      publicUrlSlug: shopName.toLowerCase().replace(/\s+/g, '-'), // Ex: "barbearia-do-ze"
      status: 'active',
      createdAt: new Date(),
    });
    
    // 4. ESSENCIAL: Definir o "role" e o "barbershopId" no token do usuário.
    // Isso é um "Custom Claim". É a forma mais segura e eficiente de gerenciar permissões.
    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'shopOwner',
      barbershopId: newShopRef.id 
    });

    // 5. Criar o documento do usuário na nossa coleção 'users' para dados adicionais
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: ownerEmail,
      name: shopName,
      role: 'shopOwner',
      barbershopId: newShopRef.id
    });

    return { statusCode: 201, body: JSON.stringify({ message: 'Barbearia criada com sucesso!', shopId: newShopRef.id }) };

  } catch (error) {
    console.error("Erro ao criar barbearia:", error);
    // Se deu erro, podemos deletar o usuário criado para não deixar lixo
    if (error.code && error.code.startsWith('auth/')) {
       // Lógica de limpeza aqui
    }
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};