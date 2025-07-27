// src/pages/ClientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientAppointments, cancelClientAppointment } from '../services/publicService';
import styles from './ClientDashboard.module.scss'; // Importamos os nossos novos estilos

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
      fetchAppointments();
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
