// src/services/shopService.js

const CREATE_SERVICE_ENDPOINT = '/.netlify/functions/create-service';
const GET_SERVICES_ENDPOINT = '/.netlify/functions/get-services';
const UPDATE_SERVICE_ENDPOINT = '/.netlify/functions/update-service';
const DELETE_SERVICE_ENDPOINT = '/.netlify/functions/delete-service';
const GET_APPOINTMENTS_ENDPOINT = '/.netlify/functions/get-daily-appointments';
const CANCEL_APPOINTMENT_ENDPOINT = '/.netlify/functions/cancel-appointment';
const GET_SETTINGS_ENDPOINT = '/.netlify/functions/get-shop-settings'; 
const UPDATE_SETTINGS_ENDPOINT = '/.netlify/functions/update-shop-settings'; 
const GET_DASHBOARD_STATS_ENDPOINT = '/.netlify/functions/get-dashboard-stats';
// NOVO ENDPOINT PARA O PAINEL DO BARBEIRO
const GET_BARBER_APPOINTMENTS_ENDPOINT = '/.netlify/functions/get-barber-appointments';

export const createService = async (serviceData, token) => {
  // ... (código existente sem alterações)
  try {
    const response = await fetch(CREATE_SERVICE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
  // ... (código existente sem alterações)
  try {
    const response = await fetch(GET_SERVICES_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar os serviços.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço getServices:", error);
    throw error;
  }
};

export const deleteService = async (serviceId, token) => {
  // ... (código existente sem alterações)
  try {
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
  // ... (código existente sem alterações)
  try {
    const response = await fetch(`${UPDATE_SERVICE_ENDPOINT}/${serviceId}`, {
      method: 'PUT',
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
  // ... (código existente sem alterações)
  try {
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
    return data;
  } catch (error) {
    console.error("Erro no serviço getDailyAppointments:", error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId, token) => {
  // ... (código existente sem alterações)
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

export const getShopSettings = async (token) => {
  // ... (código existente sem alterações)
  try {
    const response = await fetch(GET_SETTINGS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar as configurações.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço getShopSettings:", error);
    throw error;
  }
};

export const updateShopSettings = async (settingsData, token) => {
  // ... (código existente sem alterações)
  try {
    const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao atualizar as configurações.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço updateShopSettings:", error);
    throw error;
  }
};

export const getDashboardStats = async (token, startDate, endDate) => {
  // ... (código existente sem alterações)
  try {
    let url = GET_DASHBOARD_STATS_ENDPOINT;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar as estatísticas.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço getDashboardStats:", error);
    throw error;
  }
};

// --- NOVA FUNÇÃO PARA O PAINEL DO BARBEIRO ---

export const getBarberAppointments = async (token, date) => {
  try {
    const url = `${GET_BARBER_APPOINTMENTS_ENDPOINT}?date=${date}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar os seus agendamentos.');
    }

    return data; 

  } catch (error) {
    console.error("Erro no serviço getBarberAppointments:", error);
    throw error;
  }
};