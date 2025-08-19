// src/pages/ClientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// INSTRUÇÃO 1: A importação de 'cancelClientAppointment' foi removida da linha abaixo,
// pois não está sendo utilizada no momento.
import { getClientAppointments } from '../services/clientService'; 
import styles from './ClientDashboard.module.scss';

const ClientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { currentUser } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      // Esta variável 'token' é mantida, pois é usada na linha seguinte.
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

  // NOTA: A função de cancelar ainda não existe no backend,
  // precisaremos criá-la depois.
  const handleCancel = async (barbershopId, appointmentId) => {
    if (!window.confirm("Tem a certeza que deseja cancelar este agendamento?")) {
      return;
    }
    try {
      setMessage('');
      setError('');
      // INSTRUÇÃO 2: A variável 'token' abaixo foi comentada, pois não estava
      // sendo utilizada dentro desta função.
      // const token = await currentUser.getIdToken();
      
      // Esta função 'cancelClientAppointment' precisará ser criada no backend
      // e no clientService.js
      // await cancelClientAppointment(barbershopId, appointmentId, token);
      setMessage("Função de cancelamento ainda não implementada.");
      // fetchAppointments(); // Descomentar quando a função estiver pronta
    } catch (err) {
      setError(err.message);
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
                    {/* Adicionado para mostrar o nome da barbearia */}
                    <span className={styles.shopName}>Barbearia: {app.barbershopName}</span> 
                  </div>
                  <button 
                    onClick={() => handleCancel(app.barbershopId, app.id)} 
                    className={styles.cancelButton}
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