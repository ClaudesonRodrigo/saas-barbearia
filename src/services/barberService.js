// src/services/barberService.js

const CREATE_BARBER_ENDPOINT = '/.netlify/functions/create-barber';
const GET_BARBERS_ENDPOINT = '/.netlify/functions/get-barbers';
const DELETE_BARBER_ENDPOINT = '/.netlify/functions/delete-barber';
const UPDATE_BARBER_ENDPOINT = '/.netlify/functions/update-barber'; // Novo endpoint

export const createBarber = async (barberData, token) => {
  try {
    const response = await fetch(CREATE_BARBER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(barberData),
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

    return data;

  } catch (error)
 {
    console.error("Erro no serviço getBarbers:", error);
    throw error;
  }
};

export const deleteBarber = async (barberId, token) => {
  try {
    const response = await fetch(`${DELETE_BARBER_ENDPOINT}/${barberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao excluir o barbeiro.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço deleteBarber:", error);
    throw error;
  }
};

// 👇 NOVA FUNÇÃO ADICIONADA 👇
export const updateBarber = async (barberId, barberData, token) => {
  try {
    const response = await fetch(`${UPDATE_BARBER_ENDPOINT}/${barberId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(barberData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao atualizar o barbeiro.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço updateBarber:", error);
    throw error;
  }
};
