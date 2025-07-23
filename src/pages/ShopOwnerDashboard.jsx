// src/pages/ShopOwnerDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Importamos a nova função para buscar a agenda
import { createService, getServices, deleteService, updateService, getDailyAppointments, cancelAppointment } from '../services/shopService';
import { createBarber, getBarbers, deleteBarber, updateBarber } from '../services/barberService';
import { Link } from 'react-router-dom';

const ShopOwnerDashboard = () => {
  // --- Estados para SERVIÇOS ---
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // --- Estados para BARBEIROS ---
  const [barberName, setBarberName] = useState('');
  const [barberEmail, setBarberEmail] = useState('');
  const [isLoadingBarbersForm, setIsLoadingBarbersForm] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [editingBarber, setEditingBarber] = useState(null);

  // --- Estados para a AGENDA ---
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(getTodayString());
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  // --- Estados de UI ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const { currentUser } = useAuth();

  // --- Lógica para SERVIÇOS (sem alterações) ---
  const fetchServices = useCallback(async () => { if (!currentUser) return; setIsLoadingServices(true); try { const token = await currentUser.getIdToken(); const data = await getServices(token); setServices(data); } catch (err) { setError(err.message); } finally { setIsLoadingServices(false); } }, [currentUser]);
  useEffect(() => { fetchServices(); }, [fetchServices]);
  const handleEditClick = (service) => { setEditingService(service); setServiceName(service.name); setPrice(service.price); setDuration(service.duration); window.scrollTo(0, 0); };
  const cancelEdit = () => { setEditingService(null); setServiceName(''); setPrice(''); setDuration(''); };
  const handleServiceSubmit = async (e) => { e.preventDefault(); setIsServiceLoading(true); setMessage(''); setError(''); try { const token = await currentUser.getIdToken(); const serviceData = { name: serviceName, price, duration }; if (editingService) { await updateService(editingService.id, serviceData, token); setMessage("Serviço atualizado com sucesso!"); } else { await createService(serviceData, token); setMessage("Serviço criado com sucesso!"); } cancelEdit(); fetchServices(); } catch (err) { setError(err.message); } finally { setIsServiceLoading(false); } };
  const handleDelete = async (serviceId) => { if (!window.confirm("Tem certeza que deseja excluir este serviço?")) { return; } try { setMessage(''); setError(''); const token = await currentUser.getIdToken(); await deleteService(serviceId, token); fetchServices(); setMessage("Serviço deletado com sucesso!"); } catch (err) { setError(err.message); } };

  // --- Lógica para BARBEIROS (sem alterações) ---
  const fetchBarbers = useCallback(async () => { if (!currentUser) return; setIsLoadingBarbers(true); try { const token = await currentUser.getIdToken(); const data = await getBarbers(token); setBarbers(data); } catch (err) { setError(err.message); } finally { setIsLoadingBarbers(false); } }, [currentUser]);
  useEffect(() => { fetchBarbers(); }, [fetchBarbers]);
  const handleBarberEditClick = (barber) => {
    setEditingBarber(barber);
    setBarberName(barber.name);
    setBarberEmail(barber.email);
  };

  const cancelBarberEdit = () => {
    setEditingBarber(null);
    setBarberName('');
    setBarberEmail('');
  };

  const handleBarberSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingBarbersForm(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const barberData = { name: barberName, email: barberEmail };
      if (editingBarber) {
        await updateBarber(editingBarber.id, barberData, token);
        setMessage("Dados do barbeiro atualizados com sucesso!");
      } else {
        const result = await createBarber(barberData, token);
        setMessage(`${result.message} Senha provisória: ${result.temporaryPassword}`);
      }
      cancelBarberEdit();
      fetchBarbers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingBarbersForm(false);
    }
  };

  // --- NOVA LÓGICA PARA A AGENDA ---
  const fetchAppointments = useCallback(async (date) => {
    if (!currentUser) return;
    setIsLoadingAppointments(true);
    setMessage(''); // Limpa mensagens antigas ao buscar
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getDailyAppointments(date, token);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
      setAppointments([]); // Limpa a lista em caso de erro
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAppointments(selectedAgendaDate);
  }, [selectedAgendaDate, fetchAppointments]);

  const handleAgendaDateChange = (e) => {
    setSelectedAgendaDate(e.target.value);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }
    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await cancelAppointment(appointmentId, token);
      setMessage("Agendamento cancelado com sucesso!");
      // Atualiza a lista da agenda para remover o item cancelado
      fetchAppointments(selectedAgendaDate);
    } catch (err) {
      setError(err.message);
    }
  };
  const handleDeleteBarber = async (barberId) => {
    if (!window.confirm("Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await deleteBarber(barberId, token);
      setMessage("Barbeiro excluído com sucesso!");
      fetchBarbers(); // Atualiza a lista
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Painel do Dono da Barbearia</h1>
      <Link to="/dashboard/settings" style={{ display: 'inline-block', marginBottom: '20px' }}>
        Ir para Configurações da Loja ⚙️
      </Link>
      <p>Bem-vindo! Gerencie sua agenda, serviços e barbeiros.</p>
      
      {message && <p style={{ color: 'green', marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '20px', fontWeight: 'bold' }}>{error}</p>}
      
      <hr style={{ margin: '40px 0' }} />

      {/* NOVA SEÇÃO DE AGENDA */}
      <section>
        <h2>Agenda do Dia</h2>
        <div>
          <label htmlFor="agenda-date" style={{ marginRight: '10px' }}>Ver agendamentos para o dia:</label>
          <input id="agenda-date" type="date" value={selectedAgendaDate} onChange={handleAgendaDateChange} />
        </div>

        <div style={{ marginTop: '20px' }}>
          {isLoadingAppointments ? <p>Carregando agenda...</p> : 
            appointments.length === 0 ? <p>Nenhum agendamento para este dia.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {appointments.map(app => (
                  <li key={app.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', margin: '10px 0' }}>
                    <strong>{app.time}</strong> - {app.clientName} ({app.clientEmail})
                    <br />
                    <span>Serviço: {app.serviceName} ({app.serviceDuration} min)</span>
                    <button onClick={() => handleCancelAppointment(app.id)} style={{ marginTop: '10px' }}>
                            Cancelar Agendamento
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </section>

      <hr style={{ margin: '40px 0' }} />

      {/* SEÇÃO DE SERVIÇOS */}
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

      {/* SEÇÃO DE BARBEIROS */}
      <section>
        <h2>Gerenciar Barbeiros</h2>
        <form onSubmit={handleBarberSubmit}>
          <h3>{editingBarber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}</h3>
          <div><label>Nome do Barbeiro:</label><input type="text" value={barberName} onChange={(e) => setBarberName(e.target.value)} placeholder="Nome completo" required /></div>
          <div><label>E-mail do Barbeiro:</label><input type="email" value={barberEmail} onChange={(e) => setBarberEmail(e.target.value)} placeholder="email@exemplo.com" required /></div>
          <button type="submit" disabled={isLoadingBarbersForm}>{isLoadingBarbersForm ? 'A guardar...' : (editingBarber ? 'Guardar Alterações' : 'Adicionar Barbeiro')}</button>
          {editingBarber && (<button type="button" onClick={cancelBarberEdit} disabled={isLoadingBarbersForm} style={{ marginLeft: '10px' }}>Cancelar</button>)}
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
                <button onClick={() => handleBarberEditClick(barber)} style={{ marginLeft: '10px' }}>Editar</button>
                <button onClick={() => handleDeleteBarber(barber.id)} style={{ marginLeft: '10px' }}>Excluir</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ShopOwnerDashboard;
