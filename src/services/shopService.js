// src/services/shopService.js

const CREATE_SERVICE_ENDPOINT = '/.netlify/functions/create-service';
const GET_SERVICES_ENDPOINT = '/.netlify/functions/get-services';
export const createService = async (serviceData, token) => {
  try {
    const response = await fetch(CREATE_SERVICE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aqui enviamos o token para o backend saber quem somos
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(serviceData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao criar o serviço.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço createService:", error);
    throw error;
  }
};

export const getServices = async (token) => {
  try {
    const response = await fetch(GET_SERVICES_ENDPOINT, {
      method: 'GET', // Embora GET seja o padrão, é bom ser explícito
      headers: {
        // Enviamos o token para o backend saber quem somos
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar os serviços.');
    }

    return data; // Retorna a lista de serviços

  } catch (error) {
    console.error("Erro no serviço getServices:", error);
    throw error;
  }
};