// src/services/barberService.js

const CREATE_BARBER_ENDPOINT = '/.netlify/functions/create-barber';
const GET_BARBERS_ENDPOINT = '/.netlify/functions/get-barbers';

export const createBarber = async (barberData, token) => {
  try {
    const response = await fetch(CREATE_BARBER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(barberData), // Ex: { name: '...', email: '...' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao criar o barbeiro.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço createBarber:", error);
    throw error;
  }
};
export const getBarbers = async (token) => {
  try {
    const response = await fetch(GET_BARBERS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar os barbeiros.');
    }

    return data; // Retorna a lista de barbeiros

  } catch (error) {
    console.error("Erro no serviço getBarbers:", error);
    throw error;
  }
};