// src/services/paymentService.js

const CREATE_PREFERENCE_ENDPOINT = '/.netlify/functions/create-payment-preference';

export const createPaymentPreference = async (planData, token) => {
  try {
    const response = await fetch(CREATE_PREFERENCE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(planData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao criar a preferência de pagamento.');
    }

    return data; // Deve devolver { checkoutUrl: '...' }

  } catch (error) {
    console.error("Erro no serviço createPaymentPreference:", error);
    throw error;
  }
};
