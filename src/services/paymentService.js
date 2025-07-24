// src/services/paymentService.js

const CREATE_STRIPE_SESSION_ENDPOINT = '/.netlify/functions/create-stripe-checkout-session';

export const createStripeCheckoutSession = async (planData, token) => {
  try {
    const response = await fetch(CREATE_STRIPE_SESSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(planData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao criar a sessão de checkout.');
    }

    return data; // Deve devolver { sessionId: '...' }

  } catch (error) {
    console.error("Erro no serviço createStripeCheckoutSession:", error);
    throw error;
  }
};
