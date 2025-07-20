// src/pages/SuperAdminDashboard.jsx (VERSÃO CORRIGIDA)

import React, { useState, useEffect } from 'react';
import { createBarbershop, getBarbershops } from '../services/barbershopService';

const SuperAdminDashboard = () => {
  // --- Estados para o formulário de criação ---
  const [shopName, setShopName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Estados para a lista de barbearias ---
  const [shops, setShops] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  const fetchShops = async () => {
    try {
      const data = await getBarbershops();
      setShops(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingShops(false);
    }
  };
  
  useEffect(() => {
    fetchShops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await createBarbershop({ shopName, ownerEmail, ownerPassword });
      setMessage(result.message);
      setShopName('');
      setOwnerEmail('');
      setOwnerPassword('');
      fetchShops();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Painel Super Admin</h1>
      
      <section>
        <h2>Cadastrar Nova Barbearia</h2>
        <form onSubmit={handleSubmit}>
          {/* 👇 ESSA PARTE ESTAVA FALTANDO 👇 */}
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
          {/* --- FIM DA PARTE QUE FALTAVA --- */}
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      <hr />

      <section>
        <h2>Barbearias Cadastradas</h2>
        {isLoadingShops ? (
          <p>Carregando barbearias...</p>
        ) : (
          <ul>
            {shops.map(shop => (
              <li key={shop.id}>
                <strong>{shop.name}</strong> (ID do Dono: {shop.ownerId})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;