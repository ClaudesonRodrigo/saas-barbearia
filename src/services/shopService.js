// src/services/shopService.js

const CREATE_SERVICE_ENDPOINT = '/.netlify/functions/create-service';
const GET_SERVICES_ENDPOINT = '/.netlify/functions/get-services';
const UPDATE_SERVICE_ENDPOINT = '/.netlify/functions/update-service';
const DELETE_SERVICE_ENDPOINT = '/.netlify/functions/delete-service';
const GET_APPOINTMENTS_ENDPOINT = '/.netlify/functions/get-daily-appointments';
const CANCEL_APPOINTMENT_ENDPOINT = '/.netlify/functions/cancel-appointment'; // Novo endpoint

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

export const deleteService = async (serviceId, token) => {
  try {
    // Note que o ID do serviço é adicionado diretamente na URL
    const response = await fetch(`${DELETE_SERVICE_ENDPOINT}/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao deletar o serviço.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço deleteService:", error);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData, token) => {
  try {
    const response = await fetch(`${UPDATE_SERVICE_ENDPOINT}/${serviceId}`, {
      method: 'PUT', // Usamos o método PUT para atualização
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao atualizar o serviço.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço updateService:", error);
    throw error;
  }
};

export const getDailyAppointments = async (date, token) => {
  try {
    // Passamos a data como um "query parameter"
    const response = await fetch(`${GET_APPOINTMENTS_ENDPOINT}?date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar agendamentos.');
    }

    return data; // Retorna a lista de agendamentos

  } catch (error) {
    console.error("Erro no serviço getDailyAppointments:", error);
    throw error;
  }
};

// 👇 NOVA FUNÇÃO ADICIONADA 👇
export const cancelAppointment = async (appointmentId, token) => {
  try {
    const response = await fetch(`${CANCEL_APPOINTMENT_ENDPOINT}/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao cancelar o agendamento.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço cancelAppointment:", error);
    throw error;
  }
};
