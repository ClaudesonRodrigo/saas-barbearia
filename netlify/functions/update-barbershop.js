// netlify/functions/update-barbershop.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// --- Configuração do Firebase Admin ---
// Garanta que sua variável de ambiente FIREBASE_SERVICE_ACCOUNT está configurada na Netlify
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const authAdmin = getAuth();
// --- Fim da Configuração ---

// Função Helper para verificar se o chamador é Super Admin
const verifySuperAdmin = async (headers) => {
  if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {
    throw new Error("Token de autorização não fornecido ou mal formatado.");
  }
  const token = headers.authorization.split('Bearer ')[1];
  const decodedToken = await authAdmin.verifyIdToken(token);
  if (decodedToken.role !== 'superAdmin') {
    throw new Error("Acesso negado. Apenas Super Admins podem executar esta ação.");
  }
  return decodedToken;
};

exports.handler = async function(event, context) {
  // Permite apenas o método PUT para atualizações
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    // 1. VERIFICAÇÃO DE SEGURANÇA: Garante que o usuário é Super Admin
    await verifySuperAdmin(event.headers);

    // 2. Extrai os dados do corpo da requisição
    const { shopId, updates } = JSON.parse(event.body);

    if (!shopId || !updates || typeof updates !== 'object') {
        return { statusCode: 400, body: JSON.stringify({ message: 'O ID da barbearia e um objeto com as atualizações são obrigatórios.' }) };
    }

    const shopRef = db.collection('barbershops').doc(shopId);
    
    // 3. MEDIDA DE SEGURANÇA: Remove campos sensíveis que não devem ser alterados por esta via
    delete updates.ownerId;
    delete updates.createdAt;
    delete updates.id; // Evita que o ID seja incluído no objeto de atualização

    // 4. Executa a atualização no Firestore
    await shopRef.update(updates);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Barbearia ${shopId} foi atualizada com sucesso.` })
    };

  } catch (error) {
    console.error("Erro ao atualizar barbearia:", error);
    // Retorna um código de erro específico para falha de autorização
    const statusCode = error.message.includes("Acesso negado") ? 403 : 500;
    return { 
      statusCode: statusCode,
      body: JSON.stringify({ message: `Erro no servidor: ${error.message}` }) 
    };
  }
};