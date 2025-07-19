// src/pages/SuperAdminDashboard.jsx
import React, { useState } from 'react';

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

    // AQUI VAI A LÓGICA PARA CHAMAR NOSSA NETLIFY FUNCTION
    console.log({ shopName, ownerEmail, ownerPassword });
    setError("Função de cadastro ainda não implementada."); // Mensagem temporária
    // FIM DA LÓGICA
    
    setIsLoading(false);
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