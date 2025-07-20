// src/services/publicService.js

const GET_SHOP_ENDPOINT = '/.netlify/functions/get-public-barbershop-data';
const GET_SLOTS_ENDPOINT = '/.netlify/functions/get-available-slots';

export const getPublicBarbershopData = async (slug) => {
  try {
    // O slug (ex: "barbearia-do-ze") é adicionado na URL
    const response = await fetch(`${GET_SHOP_ENDPOINT}/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar dados da barbearia.');
    }

    return data; // Retorna { shop, services, barbers }

  } catch (error) {
    console.error("Erro no serviço getPublicBarbershopData:", error);
    throw error;
  }
};

export const getAvailableSlots = async (slug, date, duration) => {
  try {
    // Agora passamos os dados como "query parameters" na URL
    const response = await fetch(`${GET_SLOTS_ENDPOINT}?slug=${slug}&date=${date}&duration=${duration}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao buscar horários.');
    }

    return data; // Retorna a lista de horários ["09:00", "09:30", ...]

  } catch (error) {
    console.error("Erro no serviço getAvailableSlots:", error);
    throw error;
  }
};