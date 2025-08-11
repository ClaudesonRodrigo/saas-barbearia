// src/services/barbershopService.js

// LÓGICA CENTRALIZADA: Uma única base para a URL da nossa API
const API_BASE_URL = '/.netlify/functions';

/**
 * Função genérica e centralizada para fazer chamadas à nossa API Netlify.
 * Ela cuida de adicionar o token de autorização e tratar as respostas.
 * @param {string} endpoint - O nome da função a ser chamada (ex: 'create-barbershop').
 * @param {string} token - O token JWT do usuário logado.
 * @param {object} options - Opções da requisição fetch (method, body, etc.).
 * @returns {Promise<any>} - A resposta da API em formato JSON.
 */
const fetchApi = async (endpoint, token, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        // ESSENCIAL: Envia o token para o backend validar a permissão
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Se a resposta do servidor não for "ok", lança um erro com a mensagem do backend.
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ocorreu um erro na solicitação à API.');
    }

    // Se a resposta for bem-sucedida, mas vazia (como em um DELETE), retorna sucesso.
    if (response.status === 204) {
      return { success: true };
    }
    
    // Retorna os dados da resposta em JSON.
    return await response.json();

  } catch (error) {
    console.error(`Erro no serviço ao chamar o endpoint ${endpoint}:`, error);
    // Re-lança o erro para que o componente possa capturá-lo.
    throw error;
  }
};

// --- FUNÇÕES DE SERVIÇO PARA O SUPER ADMIN ---

export const createBarbershop = (data, token) => {
  return fetchApi('create-barbershop', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getBarbershops = (token) => {
  return fetchApi('read-barbershops', token, {
    method: 'GET',
  });
};

export const updateBarbershop = (shopId, updates, token) => {
  return fetchApi('update-barbershop', token, {
    method: 'PUT',
    body: JSON.stringify({ shopId, updates }),
  });
};

export const deleteBarbershop = (shopId, token) => {
  return fetchApi('delete-barbershop', token, {
    method: 'DELETE',
    body: JSON.stringify({ shopId }),
  });
};