// netlify/functions/update-shop-settings.js

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

exports.handler = async function(event, context) {
  // Esta função só aceita requisições PUT (padrão para atualização)
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    // Apenas um 'shopOwner' pode atualizar as configurações da sua própria loja
    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const settingsData = JSON.parse(event.body);

    if (!settingsData) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados de configuração não fornecidos." }) };
    }

    // Montamos a referência para o documento da barbearia que queremos atualizar
    const shopRef = db.collection('barbershops').doc(barbershopId);
    
    // Atualizamos o documento com os novos dados de configuração
    // O método 'update' altera apenas os campos que enviamos
    await shopRef.update({
      address: settingsData.address,
      phone: settingsData.phone,
      // Guardamos os horários como um objeto para fácil acesso
      businessHours: {
        start: settingsData.startTime, // ex: "09:00"
        end: settingsData.endTime,     // ex: "18:00"
      },
      lunchBreak: {
        start: settingsData.lunchStart, // ex: "12:00"
        end: settingsData.lunchEnd,     // ex: "13:00"
      }
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Configurações da loja atualizadas com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao atualizar as configurações.' }) 
    };
  }
};
