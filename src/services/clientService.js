// src/services/clientService.js

const API_BASE_URL = '/.netlify/functions';

// Sua função helper, que é uma ótima prática!
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
    // Se o status for 204 (No Content), o backend pode não retornar um corpo JSON.
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

export const getClientAppointments = (token) => {
  return fetchApi('get-client-appointments', token, {
    method: 'GET',
  });
};

// Esta função não é usada pelo cliente, mas a mantemos aqui por organização.
export const getBarbershopAppointments = (token) => {
  return fetchApi('get-barbershop-appointments', token, {
    method: 'GET',
  });
};

// --- NOVA FUNÇÃO PARA CANCELAR AGENDAMENTO ---

export const cancelClientAppointment = (appointmentId, token) => {
  // 1. O endpoint agora inclui o ID do agendamento
  const endpoint = `cancel-client-appointment/${appointmentId}`;
  
  // 2. Usamos o método 'DELETE' para apagar o recurso
  const options = {
    method: 'DELETE',
  };

  // 3. Chamamos nossa função helper para fazer a requisição
  return fetchApi(endpoint, token, options);
};