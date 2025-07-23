// src/services/publicService.js

const GET_SHOP_ENDPOINT = '/.netlify/functions/get-public-barbershop-data';
const GET_SLOTS_ENDPOINT = '/.netlify/functions/get-available-slots';
const CREATE_APPOINTMENT_ENDPOINT = '/.netlify/functions/create-appointment';

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

// 👇 FUNÇÃO ATUALIZADA 👇
export const getAvailableSlots = async (slug, date, duration, barberId) => {
  try {
    // Construímos a URL com todos os parâmetros
    let url = `${GET_SLOTS_ENDPOINT}?slug=${slug}&date=${date}&duration=${duration}`;
    // Se um barbeiro foi selecionado, adicionamos o seu ID
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
