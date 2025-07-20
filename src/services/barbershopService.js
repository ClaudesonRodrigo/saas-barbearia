// src/services/barbershopService.js

// Endpoints das nossas funções
const CREATE_API_ENDPOINT = '/.netlify/functions/create-barbershop';
const GET_API_ENDPOINT = '/.netlify/functions/get-barbershops';


export const createBarbershop = async (shopData) => {
  // O shopData será um objeto com { shopName, ownerEmail, ownerPassword }
  try {
    const response = await fetch(CREATE_API_ENDPOINT, {
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
}; // Fim da função createBarbershop


export const getBarbershops = async () => {
  try {
    // Como é uma busca (GET), não precisamos de 'headers' ou 'body'
    const response = await fetch(GET_API_ENDPOINT);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar as barbearias.');
    }

    return data; // Retorna a lista de barbearias

  } catch (error) {
    console.error("Erro no serviço getBarbershops:", error);
    throw error;
  }
}; // Fim da função getBarbershops