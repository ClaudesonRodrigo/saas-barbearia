// netlify/functions/generate-upload-signature.js

const cloudinary = require('cloudinary').v2;
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Configuração do Cloudinary com as nossas chaves secretas
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Inicialização do Firebase Admin para segurança
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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
    // Verificamos se o utilizador está autenticado antes de permitir o upload
    const token = event.headers.authorization.split("Bearer ")[1];
    await authAdmin.verifyIdToken(token);

    const timestamp = Math.round((new Date).getTime() / 1000);

    // Geramos uma "assinatura" segura no back-end
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
      },
      cloudinary.config().api_secret
    );

    // Devolvemos a assinatura, o timestamp e a API key para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify({
        signature: signature,
        timestamp: timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      }),
    };
  } catch (error) {
    console.error("Erro ao gerar assinatura:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Falha ao preparar o upload." }),
    };
  }
};
