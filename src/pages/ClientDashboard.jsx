// src/pages/ClientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// PASSO 1: Importamos a nova função de cancelamento que criamos no service.
import { getClientAppointments, cancelClientAppointment } from '../services/clientService'; 
import styles from './ClientDashboard.module.scss';

const ClientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Novo estado para dar feedback visual durante o cancelamento
  const [cancellingId, setCancellingId] = useState(null);
  
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

  // PASSO 2: Preenchendo a lógica da função de cancelamento.
  const handleCancel = async (appointmentId) => {
    // Usamos window.confirm para o usuário ter certeza da ação.
    if (!window.confirm("Tem a certeza que deseja cancelar este agendamento?")) {
      return;
    }

    setCancellingId(appointmentId); // Ativa o estado de 'cancelando' para este item
    setMessage('');
    setError('');

    try {
      // Pegamos o token do usuário logado.
      const token = await currentUser.getIdToken();
      
      // Chamamos nossa função de serviço, que vai chamar o backend.
      const result = await cancelClientAppointment(appointmentId, token);
      
      // Mostramos a mensagem de sucesso que veio do backend.
      setMessage(result.message);
      
      // ATUALIZAÇÃO INSTANTÂNEA: Removemos o agendamento da lista na tela.
      setAppointments(prevAppointments => 
        prevAppointments.filter(app => app.id !== appointmentId)
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null); // Desativa o estado de 'cancelando'
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Os Meus Agendamentos</h1>
        <p className={styles.subtitle}>Bem-vindo, {currentUser?.displayName}! Aqui está o seu histórico de agendamentos.</p>
      </header>
      
      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section>
        {isLoading ? <p>A carregar o seu histórico...</p> : 
          appointments.length === 0 ? <p>Você ainda não tem agendamentos.</p> : (
            <ul className={styles.list}>
              {appointments.map(app => (
                <li key={app.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentInfo}>
                    <strong>{app.formattedDate} às {app.time}</strong>
                    <span>Serviço: {app.serviceName}</span>
                    <span className={styles.shopName}>Barbearia: {app.barbershopName}</span> 
                  </div>
                  {/* PASSO 3: Atualizamos o botão para dar feedback de loading */}
                  <button 
                    onClick={() => handleCancel(app.id)} 
                    className={styles.cancelButton}
                    disabled={cancellingId === app.id} // Desativa o botão durante o cancelamento
                  >
                    {cancellingId === app.id ? 'A cancelar...' : 'Cancelar Agendamento'}
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