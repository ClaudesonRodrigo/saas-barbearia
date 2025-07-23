// netlify/functions/create-payment-preference.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
// 1. Importamos o SDK do Mercado Pago
const mercadopago = require('mercadopago');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const authAdmin = getAuth();

// 2. Configuramos o Mercado Pago com o nosso Access Token secreto
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId, email } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // 3. Recebemos os dados do plano que o dono da loja escolheu
    const { planId, planName, planPrice } = JSON.parse(event.body);

    if (!planId || !planName || !planPrice) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do plano incompletos." }) };
    }

    // 4. Criamos o objeto de "preferência de pagamento" para o Mercado Pago
    const preference = {
      items: [
        {
          id: planId,
          title: `Assinatura do Plano: ${planName}`,
          quantity: 1,
          currency_id: 'BRL', // Moeda: Real Brasileiro
          unit_price: Number(planPrice),
        },
      ],
      payer: {
        email: email, // E-mail do dono da loja que está a pagar
      },
      back_urls: {
        // URLs para onde o cliente será redirecionado após o pagamento
        success: `${process.env.URL}/payment-success`, // URL do nosso site
        failure: `${process.env.URL}/payment-failure`,
        pending: `${process.env.URL}/payment-pending`,
      },
      auto_return: 'approved', // Redireciona automaticamente após pagamento aprovado
      external_reference: barbershopId, // Guardamos o ID da barbearia para saber quem pagou
    };

    // 5. Usamos o SDK para criar a preferência de pagamento
    const response = await mercadopago.preferences.create(preference);

    // 6. Devolvemos o link de checkout para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify({ checkoutUrl: response.body.init_point }),
    };

  } catch (error) {
    console.error("Erro ao criar preferência de pagamento:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao iniciar o processo de pagamento.' }) 
    };
  }
};
