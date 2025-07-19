// netlify/functions/set-admin-role.js (VERSÃO MELHORADA)

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Esta variável de ambiente DEVE estar configurada no painel do Netlify
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Forma mais robusta de garantir a inicialização
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const authAdmin = getAuth();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ message: 'E-mail não fornecido.' }) };
    }

    const user = await authAdmin.getUserByEmail(email);
    await authAdmin.setCustomUserClaims(user.uid, { role: 'superAdmin' });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Sucesso! O usuário ${email} agora é Super Admin.` })
    };

  } catch (error) {
    console.error("Erro ao definir permissão:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, errorType: error.constructor.name })
    };
  }
};