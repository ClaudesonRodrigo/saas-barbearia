// src/pages/SuperAdminDashboard.jsx (VERSÃO FINAL)

import React, { useState } from 'react';
// Importamos nossa nova função de serviço
import { createBarbershop } from '../services/barbershopService';

const SuperAdminDashboard = () => {
  const [shopName, setShopName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // AQUI ESTÁ A MÁGICA: Chamamos nossa função de serviço com os dados do formulário
      const result = await createBarbershop({ shopName, ownerEmail, ownerPassword });
      
      setMessage(result.message); // Exibe a mensagem de sucesso do backend

      // Limpa o formulário após o sucesso
      setShopName('');
      setOwnerEmail('');
      setOwnerPassword('');

    } catch (err) {
      // Se o serviço lançar um erro, nós o capturamos e exibimos
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Painel Super Admin</h1>
      <h2>Cadastrar Nova Barbearia</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome da Barbearia:</label>
          <input 
            type="text" 
            value={shopName} 
            onChange={(e) => setShopName(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>E-mail do Dono:</label>
          <input 
            type="email" 
            value={ownerEmail} 
            onChange={(e) => setOwnerEmail(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>Senha Provisória do Dono:</label>
          <input 
            type="password" 
            value={ownerPassword} 
            onChange={(e) => setOwnerPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar Barbearia'}
        </button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SuperAdminDashboard;