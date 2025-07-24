// netlify/functions/stripe-webhook.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

// Chave secreta para verificar se o pedido veio mesmo da Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async function(event, context) {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // 1. Verificamos a assinatura para garantir que o evento é legítimo
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Erro na verificação da assinatura do webhook: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 2. Lidamos com o evento específico de 'checkout.session.completed'
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    console.log('Sessão de checkout concluída!', session.id);

    // 3. Extraímos o ID da barbearia que guardámos nos metadados
    const barbershopId = session.metadata.barbershopId;
    const planId = session.metadata.planId;

    if (barbershopId) {
      try {
        // 4. Atualizamos o documento da barbearia no Firestore para ativar o plano
        const shopRef = db.collection('barbershops').doc(barbershopId);
        await shopRef.update({
          subscriptionStatus: 'active',
          planId: planId,
          stripeCustomerId: session.customer, // Guardamos o ID do cliente da Stripe
          paidAt: new Date(),
        });
        console.log(`Plano '${planId}' ativado para a barbearia ${barbershopId}.`);
      } catch (dbError) {
        console.error("Erro ao atualizar o estado da assinatura no Firestore:", dbError);
        // Retornamos um erro 500 para que a Stripe tente enviar o evento novamente
        return { statusCode: 500, body: 'Erro interno do servidor.' };
      }
    }
  }

  // 5. Retornamos uma resposta de sucesso para a Stripe saber que recebemos o evento
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
