// src/services/publicService.js

const GET_SHOP_ENDPOINT = '/.netlify/functions/get-public-barbershop-data';
const GET_SLOTS_ENDPOINT = '/.netlify/functions/get-available-slots';
const CREATE_APPOINTMENT_ENDPOINT = '/.netlify/functions/create-appointment';
const REGISTER_CLIENT_ENDPOINT = '/.netlify/functions/register-client';
const GET_CLIENT_APPOINTMENTS_ENDPOINT = '/.netlify/functions/get-client-appointments';
const GET_ALL_BARBERSHOPS_ENDPOINT = '/.netlify/functions/get-all-barbershops'; // Endpoint que faltava

export const getPublicBarbershopData = async (slug) => {
  try {
    const response = await fetch(`${GET_SHOP_ENDPOINT}/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar dados da barbearia.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço getPublicBarbershopData:", error);
    throw error;
  }
};

export const getAvailableSlots = async (slug, date, duration, barberId) => {
  try {
    let url = `${GET_SLOTS_ENDPOINT}?slug=${slug}&date=${date}&duration=${duration}`;
    if (barberId) {
      url += `&barberId=${barberId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar horários.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço getAvailableSlots:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await fetch(CREATE_APPOINTMENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao confirmar o agendamento.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço createAppointment:", error);
    throw error;
  }
};

export const registerClient = async (clientData) => {
  try {
    const response = await fetch(REGISTER_CLIENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao criar a conta.');
    }

    return data;

  } catch (error) {
    console.error("Erro no serviço registerClient:", error);
    throw error;
  }
};

export const getClientAppointments = async (token) => {
  try {
    const response = await fetch(GET_CLIENT_APPOINTMENTS_ENDPOINT, {
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
    console.error("Erro no serviço getClientAppointments:", error);
    throw error;
  }
};

export const getAllBarbershops = async () => {
  try {
    const response = await fetch(GET_ALL_BARBERSHOPS_ENDPOINT);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar as barbearias.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço getAllBarbershops:", error);
    throw error;
  }
};
