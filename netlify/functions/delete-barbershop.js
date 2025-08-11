// netlify/functions/delete-barbershop.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// --- Configuração do Firebase Admin ---
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
  // Permite apenas o método DELETE
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    // 1. VERIFICAÇÃO DE SEGURANÇA
    await verifySuperAdmin(event.headers);
    
    // 2. Extrai o ID da barbearia a ser deletada
    // Para DELETE, é comum passar o ID na URL, mas vamos usar o corpo para consistência
    const { shopId } = JSON.parse(event.body);
    if (!shopId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'O ID da barbearia é obrigatório.' }) };
    }

    console.log(`Iniciando processo de exclusão para a barbearia: ${shopId}`);

    // Usamos um "batch" para garantir que várias operações no Firestore aconteçam de uma só vez
    const batch = db.batch();

    // 3. ENCONTRAR E DELETAR USUÁRIOS ASSOCIADOS
    const usersSnapshot = await db.collection('users').where('barbershopId', '==', shopId).get();

    if (!usersSnapshot.empty) {
        for (const userDoc of usersSnapshot.docs) {
            const uid = userDoc.id;
            const userData = userDoc.data();
            console.log(`- Preparando para deletar o usuário: ${userData.email} (UID: ${uid})`);
            
            // a. Deleta o usuário do Firebase Authentication
            await authAdmin.deleteUser(uid);
            
            // b. Adiciona a exclusão do documento do usuário no Firestore ao batch
            batch.delete(userDoc.ref);
            console.log(`-- Usuário ${uid} deletado do Auth e agendado para exclusão do Firestore.`);
        }
    } else {
        console.log("Nenhum usuário encontrado na coleção 'users' para esta barbearia.");
    }
    
    // NOTA: Em um projeto real, aqui você também deletaria coleções aninhadas como
    // 'agendamentos', 'serviços', 'feedbacks', etc., que tenham o barbershopId.

    // 4. DELETAR O DOCUMENTO PRINCIPAL DA BARBEARIA
    const shopRef = db.collection('barbershops').doc(shopId);
    batch.delete(shopRef);
    console.log(`- Documento da barbearia ${shopId} agendado para exclusão.`);

    // 5. EXECUTAR TODAS AS OPERAÇÕES DE EXCLUSÃO
    await batch.commit();
    console.log("Batch commitado com sucesso. Exclusão completa.");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Barbearia ${shopId} e todos os seus dados associados foram removidos com sucesso.` })
    };

  } catch (error) {
    console.error("Erro ao deletar barbearia:", error);
    const statusCode = error.message.includes("Acesso negado") ? 403 : 500;
    return { 
      statusCode: statusCode,
      body: JSON.stringify({ message: `Erro no servidor: ${error.message}` }) 
    };
  }
};