// netlify/functions/create-barbershop.js
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// --- Configuração do Firebase Admin ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const authAdmin = getAuth();
const db = getFirestore();
// --- Fim da Configuração ---

// Função Helper para verificar se o chamador é Super Admin
const verifySuperAdmin = async (headers) => {
  if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {
    throw new Error("Token de autorização não fornecido.");
  }
  const token = headers.authorization.split('Bearer ')[1];
  const decodedToken = await authAdmin.verifyIdToken(token);
  if (decodedToken.role !== 'superAdmin') {
    throw new Error("Acesso negado. Apenas Super Admins podem executar esta ação.");
  }
  return decodedToken;
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let userRecord; // Variável para armazenar o usuário criado para o rollback

  try {
    // 1. VERIFICAÇÃO DE SEGURANÇA
    await verifySuperAdmin(event.headers);

    // 2. EXTRAÇÃO E VALIDAÇÃO DOS DADOS DO CORPO DA REQUISIÇÃO
    const { shopName, ownerEmail, ownerPassword, location } = JSON.parse(event.body);
    if (!shopName || !ownerEmail || !ownerPassword || !location) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados incompletos. Nome, e-mail, senha e localização são obrigatórios." }) };
    }

    // 3. CRIA O USUÁRIO (DONO) NO FIREBASE AUTHENTICATION
    userRecord = await authAdmin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: `Dono(a) da ${shopName}`,
    });

    // 4. CRIA A REFERÊNCIA NO FIRESTORE PARA A NOVA BARBEARIA
    const newShopRef = db.collection('barbershops').doc();

    // 5. DEFINE AS CUSTOM CLAIMS (PERMISSÕES) PARA O NOVO USUÁRIO
    await authAdmin.setCustomUserClaims(userRecord.uid, { 
      role: 'shopOwner',
      barbershopId: newShopRef.id 
    });

    // 6. SALVA OS DADOS DA BARBEARIA NO FIRESTORE (INCLUINDO A LOCALIZAÇÃO)
    await newShopRef.set({
      name: shopName,
      ownerId: userRecord.uid,
      publicUrlSlug: shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g,''),
      status: 'active',
      location: location, // SALVANDO O NOVO CAMPO
      createdAt: new Date().toISOString(),
    });

    // 7. SALVA UM DOCUMENTO PARA O USUÁRIO NA COLEÇÃO 'users'
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

    // ROLLBACK: Se o usuário foi criado no Auth mas algo falhou depois, delete-o.
    if (userRecord && userRecord.uid) {
      await authAdmin.deleteUser(userRecord.uid);
      console.log(`ROLLBACK: Usuário ${userRecord.uid} deletado devido a erro na criação da barbearia.`);
    }

    return { 
      statusCode: error.message.includes("Acesso negado") ? 403 : 500,
      body: JSON.stringify({ message: error.message }) 
    };
  }
};