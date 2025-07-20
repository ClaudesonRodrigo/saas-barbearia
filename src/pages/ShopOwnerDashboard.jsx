// src/pages/ShopOwnerDashboard.jsx (VERSÃO FINAL COM CRUD COMPLETO)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Importamos TODAS as funções do nosso serviço
import { createService, getServices, deleteService, updateService } from '../services/shopService';

const ShopOwnerDashboard = () => {
  // --- Estados para o formulário (agora multi-uso) ---
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  
  // --- Estados para controle da edição ---
  const [editingService, setEditingService] = useState(null); // Guarda o serviço que estamos editando

  // --- Outros estados de UI ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const { currentUser } = useAuth();

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
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- Lógica de Edição ---
  const handleEditClick = (service) => {
    setEditingService(service); // Define qual serviço estamos editando
    // Preenche o formulário com os dados atuais do serviço
    setName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    window.scrollTo(0, 0); // Rola a página para o topo para ver o formulário
  };

  const cancelEdit = () => {
    setEditingService(null); // Limpa o estado de edição
    // Limpa o formulário
    setName('');
    setPrice('');
    setDuration('');
  };

  // --- Lógica de Submissão (Criar ou Atualizar) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const serviceData = { name, price, duration };

      if (editingService) {
        // Se estamos editando, chamamos a função de UPDATE
        await updateService(editingService.id, serviceData, token);
        setMessage("Serviço atualizado com sucesso!");
      } else {
        // Se não, chamamos a função de CREATE
        await createService(serviceData, token);
        setMessage("Serviço criado com sucesso!");
      }
      
      cancelEdit(); // Limpa o formulário e o modo de edição
      fetchServices(); // Atualiza a lista na tela

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Lógica para Deletar ---
  const handleDelete = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) {
      return;
    }

    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await deleteService(serviceId, token);
      
      fetchServices();
      setMessage("Serviço deletado com sucesso!");

    } catch (err)      {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Painel do Dono da Barbearia</h1>
      <p>Bem-vindo! Aqui você gerenciará seus serviços.</p>
      
      <hr />

      <section>
        {/* O TÍTULO DO FORMULÁRIO MUDA DE ACORDO COM A AÇÃO */}
        <h2>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
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
          
          {/* O TEXTO DO BOTÃO MUDA E ADICIONAMOS UM BOTÃO DE CANCELAR */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : (editingService ? 'Salvar Alterações' : 'Adicionar Serviço')}
          </button>
          
          {editingService && (
            <button type="button" onClick={cancelEdit} disabled={isLoading} style={{ marginLeft: '10px' }}>
              Cancelar
            </button>
          )}
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
                
                {/* BOTÕES DE AÇÃO PARA CADA ITEM */}
                <button onClick={() => handleEditClick(service)} style={{ marginLeft: '10px' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(service.id)} style={{ marginLeft: '10px' }}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ShopOwnerDashboard;