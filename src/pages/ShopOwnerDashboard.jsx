// src/pages/ShopOwnerDashboard.jsx (VERSÃO CORRIGIDA E COMPLETA)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createService, getServices } from '../services/shopService';

const ShopOwnerDashboard = () => {
  // --- Estados para o formulário ---
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Estados para a lista de serviços ---
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const { currentUser } = useAuth();

  // Função para buscar os serviços, agora "memorizada" com useCallback
  const fetchServices = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingServices(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getServices(token);
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingServices(false);
    }
  }, [currentUser]);
  
  // useEffect agora depende da função "memorizada" fetchServices
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Lógica para enviar o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const serviceData = { name, price, duration };
      const result = await createService(serviceData, token);

      setMessage(result.message);
      setName('');
      setPrice('');
      setDuration('');
      
      fetchServices(); 

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Painel do Dono da Barbearia</h1>
      <p>Bem-vindo! Aqui você gerenciará seus serviços.</p>
      <hr />
      <section>
        <h2>Adicionar Novo Serviço</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nome do Serviço:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corte Masculino"
              required 
            />
          </div>
          <div>
            <label>Preço (R$):</label>
            <input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 40.00"
              step="0.01"
              required 
            />
          </div>
          <div>
            <label>Duração (minutos):</label>
            <input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 30"
              required 
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar Serviço'}
          </button>
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      <hr />

      <section>
        <h2>Seus Serviços</h2>
        {isLoadingServices ? (
          <p>Carregando serviços...</p>
        ) : services.length === 0 ? (
          <p>Você ainda não cadastrou nenhum serviço.</p>
        ) : (
          <ul>
            {services.map(service => (
              <li key={service.id}>
                <strong>{service.name}</strong> - R$ {Number(service.price).toFixed(2)} - {service.duration} min
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ShopOwnerDashboard;