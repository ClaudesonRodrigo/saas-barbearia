// src/pages/ShopOwnerDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createService, getServices, deleteService, updateService } from '../services/shopService';
// Importamos as duas funções do nosso serviço de barbeiros
import { createBarber, getBarbers } from '../services/barberService';

const ShopOwnerDashboard = () => {
  // --- Estados para o formulário de SERVIÇOS ---
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [editingService, setEditingService] = useState(null);
  
  // --- Estados para a lista de SERVIÇOS ---
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // --- Estados para o formulário de BARBEIROS ---
  const [barberName, setBarberName] = useState('');
  const [barberEmail, setBarberEmail] = useState('');
  const [isLoadingBarbersForm, setIsLoadingBarbersForm] = useState(false); // Renomeado para clareza
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  
  // --- Estados de UI ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const { currentUser } = useAuth();

  // --- LÓGICA PARA SERVIÇOS (sem alterações) ---
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

  const handleEditClick = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setServiceName('');
    setPrice('');
    setDuration('');
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setIsServiceLoading(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const serviceData = { name: serviceName, price, duration };
      if (editingService) {
        await updateService(editingService.id, serviceData, token);
        setMessage("Serviço atualizado com sucesso!");
      } else {
        await createService(serviceData, token);
        setMessage("Serviço criado com sucesso!");
      }
      cancelEdit();
      fetchServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsServiceLoading(false);
    }
  };

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
    } catch (err) {
      setError(err.message);
    }
  };

  // --- LÓGICA ATUALIZADA PARA BARBEIROS (INCLUINDO A BUSCA) ---
  const fetchBarbers = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingBarbers(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getBarbers(token);
      setBarbers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingBarbers(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const handleBarberSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingBarbersForm(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const barberData = { name: barberName, email: barberEmail };
      const result = await createBarber(barberData, token);
      setMessage(`${result.message} Senha provisória: ${result.temporaryPassword}`);
      setBarberName('');
      setBarberEmail('');
      fetchBarbers(); // ATUALIZA A LISTA APÓS CRIAR UM NOVO BARBEIRO
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingBarbersForm(false);
    }
  };

  return (
    <div>
      <h1>Painel do Dono da Barbearia</h1>
      <p>Bem-vindo! Aqui você gerenciará seus serviços e barbeiros.</p>
      
      {message && <p style={{ color: 'green', marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '20px', fontWeight: 'bold' }}>{error}</p>}
      
      <hr style={{ margin: '40px 0' }} />

      {/* SEÇÃO DE SERVIÇOS (COMPLETA E SEM ALTERAÇÕES) */}
      <section>
        <h2>{editingService ? 'Editar Serviço' : 'Gerenciar Serviços'}</h2>
        <form onSubmit={handleServiceSubmit}>
          <div>
            <label>Nome do Serviço:</label>
            <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex: Corte Masculino" required />
          </div>
          <div>
            <label>Preço (R$):</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 40.00" step="0.01" required />
          </div>
          <div>
            <label>Duração (minutos):</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 30" required />
          </div>
          <button type="submit" disabled={isServiceLoading}>
            {isServiceLoading ? 'Salvando...' : (editingService ? 'Salvar Alterações' : 'Adicionar Serviço')}
          </button>
          {editingService && (
            <button type="button" onClick={cancelEdit} disabled={isServiceLoading} style={{ marginLeft: '10px' }}>
              Cancelar
            </button>
          )}
        </form>

        <h3 style={{ marginTop: '30px' }}>Seus Serviços</h3>
        {isLoadingServices ? ( <p>Carregando serviços...</p> ) : services.length === 0 ? ( <p>Você ainda não cadastrou nenhum serviço.</p> ) : (
          <ul>
            {services.map(service => (
              <li key={service.id}>
                <strong>{service.name}</strong> - R$ {Number(service.price).toFixed(2)} - {service.duration} min
                <button onClick={() => handleEditClick(service)} style={{ marginLeft: '10px' }}>Editar</button>
                <button onClick={() => handleDelete(service.id)} style={{ marginLeft: '10px' }}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr style={{ margin: '40px 0' }} />

      {/* SEÇÃO DE BARBEIROS (AGORA COM A LISTA FUNCIONAL) */}
      <section>
        <h2>Gerenciar Barbeiros</h2>
        <form onSubmit={handleBarberSubmit}>
          <h3>Adicionar Novo Barbeiro</h3>
          <div>
            <label>Nome do Barbeiro:</label>
            <input type="text" value={barberName} onChange={(e) => setBarberName(e.target.value)} placeholder="Nome completo" required />
          </div>
          <div>
            <label>E-mail do Barbeiro:</label>
            <input type="email" value={barberEmail} onChange={(e) => setBarberEmail(e.target.value)} placeholder="email@exemplo.com" required />
          </div>
          <button type="submit" disabled={isLoadingBarbersForm}>
            {isLoadingBarbersForm ? 'Adicionando...' : 'Adicionar Barbeiro'}
          </button>
        </form>

        <h3 style={{ marginTop: '30px' }}>Barbeiros Cadastrados</h3>
        {isLoadingBarbers ? (
          <p>Carregando barbeiros...</p>
        ) : barbers.length === 0 ? (
          <p>Você ainda não cadastrou nenhum barbeiro.</p>
        ) : (
          <ul>
            {barbers.map(barber => (
              <li key={barber.id}>
                <strong>{barber.name}</strong> - {barber.email}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ShopOwnerDashboard;