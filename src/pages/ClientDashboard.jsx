// src/pages/ClientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Importamos a nova função de cancelamento
import { getClientAppointments, cancelClientAppointment } from '../services/publicService';

const ClientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Estado para mensagens de sucesso
  
  const { currentUser } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getClientAppointments(token);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 👇 NOVA FUNÇÃO PARA CANCELAR AGENDAMENTO 👇
  const handleCancel = async (barbershopId, appointmentId) => {
    if (!window.confirm("Tem a certeza que deseja cancelar este agendamento?")) {
      return;
    }
    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await cancelClientAppointment(barbershopId, appointmentId, token);
      setMessage("Agendamento cancelado com sucesso!");
      // Atualiza a lista para remover o item cancelado
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Os Meus Agendamentos</h1>
      <p>Bem-vindo, {currentUser?.displayName}! Aqui está o seu histórico de agendamentos.</p>
      
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr style={{ margin: '20px 0' }} />

      <section>
        {isLoading ? <p>A carregar o seu histórico...</p> : 
          appointments.length === 0 ? <p>Você ainda não tem agendamentos.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {appointments.map(app => (
                <li key={app.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', margin: '10px 0' }}>
                  <strong>{app.formattedDate} às {app.time}</strong>
                  <br />
                  <span>Serviço: {app.serviceName}</span>
                  <br />
                  {/* 👇 BOTÃO DE CANCELAR ADICIONADO 👇 */}
                  <button 
                    onClick={() => handleCancel(app.barbershopId, app.id)} 
                    style={{ marginTop: '10px' }}
                  >
                    Cancelar Agendamento
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </section>
    </div>
  );
};

export default ClientDashboard;
