// src/services/barbershopService.js

// O endpoint da nossa função Netlify
const API_ENDPOINT = '/.netlify/functions/create-barbershop';

export const createBarbershop = async (shopData) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Futuramente, enviaremos o token de autenticação aqui
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shopData),
    });

    if (!response.ok) {
      // Tenta extrair a mensagem de erro do backend
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao criar barbearia.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no serviço createBarbershop:", error);
    // Re-lança o erro para que o componente que chamou possa tratá-lo
    throw error;
  }
};