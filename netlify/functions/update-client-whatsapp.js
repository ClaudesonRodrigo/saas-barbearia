// netlify/functions/update-client-whatsapp.js

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

/**
 * Função de segurança que verifica o token de autenticação do cliente.
 * Retorna os dados do usuário se o token for válido.
 */
const verifyUserToken = async (headers) => {
  if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {
    throw new Error("Token de autorização não fornecido ou mal formatado.");
  }
  const token = headers.authorization.split('Bearer ')[1];
  const decodedToken = await authAdmin.verifyIdToken(token);
  // Garante que o usuário tem a permissão de 'client'
  if (decodedToken.role !== 'client') {
      throw new Error("Acesso negado. Esta ação é permitida apenas para clientes.");
  }
  return decodedToken;
};


exports.handler = async function(event, context) {
  // Esta função só aceita requisições PUT (padrão para atualização)
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    // 1. SEGURANÇA: Verifica se o usuário está logado e é um cliente válido
    const decodedToken = await verifyUserToken(event.headers);
    const userId = decodedToken.uid; // Pegamos o ID do usuário diretamente do token, não do body. Isso é mais seguro!

    // 2. EXTRAI E VALIDA OS DADOS
    const { whatsappNumber, wantsWhatsappReminders } = JSON.parse(event.body);

    if (!whatsappNumber || typeof wantsWhatsappReminders !== 'boolean') {
      return { statusCode: 400, body: JSON.stringify({ message: "O número de WhatsApp e o consentimento são obrigatórios." }) };
    }

    // 3. ATUALIZA O DOCUMENTO DO USUÁRIO NO FIRESTORE
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      whatsappNumber: whatsappNumber,
      wantsWhatsappReminders: wantsWhatsappReminders,
      updatedAt: new Date(), // Um bom campo para registrar a última atualização
    });

    return { 
      statusCode: 200, // 200 OK para atualização bem-sucedida
      body: JSON.stringify({ message: "Seus dados de contato foram atualizados com sucesso!" }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar contato do cliente:", error);
    if (error.message.includes("Acesso negado") || error.message.includes("Token")) {
        return { statusCode: 401, body: JSON.stringify({ message: "Não autorizado: " + error.message }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao atualizar seus dados.' }) 
    };
  }
};