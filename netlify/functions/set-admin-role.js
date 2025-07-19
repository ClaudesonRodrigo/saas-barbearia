// netlify/functions/set-admin-role.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Esta variável de ambiente já está configurada no seu painel do Netlify
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Evita reinicializações múltiplas
if (getAuth().app) {
  // já inicializado
} else {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const authAdmin = getAuth();

exports.handler = async function(event, context) {
  // Por segurança, só permitimos que esta função seja chamada com um método POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ message: 'E-mail não fornecido.' }) };
    }

    // Encontra o usuário pelo e-mail
    const user = await authAdmin.getUserByEmail(email);

    // Define a permissão (custom claim) para este usuário
    await authAdmin.setCustomUserClaims(user.uid, { role: 'superAdmin' });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Sucesso! O usuário ${email} agora é Super Admin.` })
    };

  } catch (error) {
    console.error("Erro ao definir permissão:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};