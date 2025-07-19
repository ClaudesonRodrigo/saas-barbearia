// src/services/barbershopService.js

// O endpoint da nossa nova função Netlify
const API_ENDPOINT = '/.netlify/functions/create-barbershop';

export const createBarbershop = async (shopData) => {
  // O shopData será um objeto com { shopName, ownerEmail, ownerPassword }
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shopData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Se a resposta não for 2xx, lança um erro com a mensagem do backend
      throw new Error(data.message || 'Falha ao criar barbearia.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço createBarbershop:", error);
    // Re-lança o erro para que o componente que chamou possa tratá-lo
    throw error;
  }
};