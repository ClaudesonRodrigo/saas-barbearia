// src/services/barberService.js
// VERSÃO MODERNA E REATORADA

// Base da URL para todas as nossas funções Netlify.
const API_BASE_URL = '/.netlify/functions';

/**
 * Função auxiliar que centraliza toda a lógica de chamadas para a API.
 * Ela é responsável por adicionar o token de autorização, definir os cabeçalhos,
 * fazer a chamada e tratar os erros de forma padronizada.
 * @param {string} endpoint - O caminho da função, ex: 'create-barber' ou 'delete-barber/123xyz'.
 * @param {string} token - O token de autenticação do usuário.
 * @param {object} options - As opções do fetch, como method e body.
 * @returns {Promise<any>} - O resultado da chamada da API.
 */
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

    // Retorna a resposta JSON ou um objeto de sucesso se a resposta for vazia.
    return response.status === 204 ? { success: true } : await response.json();

  } catch (error) {
    console.error(`Erro no serviço ao chamar o endpoint ${endpoint}:`, error);
    throw error;
  }
};

// --- FUNÇÕES DE SERVIÇO PARA GERENCIAR BARBEIROS ---

// Cria um novo barbeiro.
export const createBarber = (barberData, token) => {
  return fetchApi('create-barber', token, {
    method: 'POST',
    body: JSON.stringify(barberData),
  });
};

// Busca todos os barbeiros de uma loja.
export const getBarbers = (token) => {
  return fetchApi('get-barbers', token, {
    method: 'GET',
  });
};

// Deleta um barbeiro específico.
export const deleteBarber = (barberId, token) => {
  return fetchApi(`delete-barber/${barberId}`, token, {
    method: 'DELETE',
  });
};

// Atualiza os dados de um barbeiro.
export const updateBarber = (barberId, barberData, token) => {
  return fetchApi(`update-barber/${barberId}`, token, {
    method: 'PUT',
    body: JSON.stringify(barberData),
  });
};

// Busca os agendamentos de um barbeiro para uma data específica.
export const getBarberAppointments = (date, token) => {
  return fetchApi(`get-barber-appointments?date=${date}`, token, {
    method: 'GET',
  });
};