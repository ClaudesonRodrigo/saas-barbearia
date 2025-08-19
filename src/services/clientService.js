// src/services/clientService.js

const API_BASE_URL = '/.netlify/functions';

const fetchApi = async (endpoint, token, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ocorreu um erro na solicitação.');
    }
    return response.status === 204 ? { success: true } : await response.json();

  } catch (error) {
    console.error(`Erro no serviço ao chamar o endpoint ${endpoint}:`, error);
    throw error;
  }
};

export const registerClient = async (clientData) => {
    const response = await fetch(`${API_BASE_URL}/register-client`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Falha ao registrar.');
    }
    return data;
};

export const updateClientWhatsappInfo = (contactData, token) => {
  return fetchApi('update-client-whatsapp', token, {
    method: 'PUT',
    body: JSON.stringify(contactData),
  });
};

// CORRIGIDO: Adicionando a função que faltava
export const getClientAppointments = (token) => {
  return fetchApi('get-client-appointments', token, {
    method: 'GET',
  });
};

// Função para o dono da barbearia buscar seus agendamentos
export const getBarbershopAppointments = (token) => {
  return fetchApi('get-barbershop-appointments', token, {
    method: 'GET',
  });
};