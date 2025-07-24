// netlify/functions/create-stripe-checkout-session.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
// 1. Importamos o SDK da Stripe e passamos a chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Inicialização do Firebase Admin
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
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId, email } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const { planId, planName, planPrice } = JSON.parse(event.body);

    if (!planId || !planName || !planPrice) {
      return { statusCode: 400, body: JSON.stringify({ message: "Dados do plano incompletos." }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';

    // 2. Criamos uma "Sessão de Checkout" na Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      mode: 'payment', // 'payment' para pagamentos únicos, 'subscription' para assinaturas
      line_items: [
        {
          price_data: {
            currency: 'brl', // Moeda: Real Brasileiro
            product_data: {
              name: `Plano: ${planName}`,
            },
            unit_amount: Math.round(planPrice * 100), // O preço deve ser em centavos
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/planos`, // Volta para a página de planos se cancelar
      metadata: {
        barbershopId: barbershopId,
        planId: planId,
      }
    });

    // 3. Devolvemos o ID da sessão para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };

  } catch (error) {
    console.error("Erro ao criar sessão de checkout na Stripe:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao iniciar o processo de pagamento.' }) 
    };
  }
};
