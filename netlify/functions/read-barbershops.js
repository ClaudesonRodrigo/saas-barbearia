// netlify/functions/read-barbershops.js
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// --- Configuração do Firebase Admin ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const authAdmin = getAuth();
// --- Fim da Configuração ---

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
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await verifySuperAdmin(event.headers);

    const shopId = event.queryStringParameters.id;

    // Caso 1: Buscar UMA barbearia específica (Não vamos mexer aqui)
    if (shopId) {
      const shopDoc = await db.collection('barbershops').doc(shopId).get();
      if (!shopDoc.exists) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Barbearia não encontrada.' }) };
      }
      // Aqui também poderíamos enriquecer com o email, se necessário
      return {
        statusCode: 200,
        body: JSON.stringify({ id: shopDoc.id, ...shopDoc.data() })
      };
    }
    
    // Caso 2: Listar TODAS as barbearias (com dados enriquecidos)
    const shopsSnapshot = await db.collection('barbershops').orderBy('createdAt', 'desc').get();
    
    // LÓGICA DE ENRIQUECIMENTO DOS DADOS
    const barbershopsPromises = shopsSnapshot.docs.map(async (doc) => {
      const shopData = doc.data();
      let ownerEmail = 'E-mail não encontrado';

      // Busca o documento do dono na coleção 'users' para pegar o e-mail
      if (shopData.ownerId) {
        try {
          const userDoc = await db.collection('users').doc(shopData.ownerId).get();
          if (userDoc.exists) {
            ownerEmail = userDoc.data().email;
          }
        } catch (e) {
            console.error(`Não foi possível buscar o usuário com ID: ${shopData.ownerId}`, e);
        }
      }
      
      return { 
        id: doc.id, 
        ...shopData,
        ownerEmail: ownerEmail // Adiciona o e-mail do dono ao objeto que será retornado
      };
    });

    // Espera todas as buscas de e-mail terminarem
    const barbershopsWithDetails = await Promise.all(barbershopsPromises);

    return {
      statusCode: 200,
      body: JSON.stringify(barbershopsWithDetails)
    };

  } catch (error) {
    console.error("Erro ao buscar barbearias:", error);
    return { 
      statusCode: error.message.includes("Acesso negado") ? 403 : 500,
      body: JSON.stringify({ message: error.message }) 
    };
  }
};