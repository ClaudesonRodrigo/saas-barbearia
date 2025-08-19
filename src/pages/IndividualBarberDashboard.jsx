// src/pages/IndividualBarberDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// 1. Importamos a nossa nova função de serviço para o barbeiro
import { getBarberAppointments } from '../services/shopService'; 
// Reutilizaremos os estilos do painel do dono para manter a consistência visual
import styles from './BarberDashboard.module.scss';
import { format } from 'date-fns';

// Helper para formatar a data para o input e para a API
const getYYYYMMDD = (date) => format(date, 'yyyy-MM-dd');

const IndividualBarberDashboard = () => {
  const { currentUser } = useAuth();
  
  // 2. Estados para controlar a data, agendamentos, loading e erros
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getYYYYMMDD(new Date()));

  // 3. Função para buscar os agendamentos do barbeiro
  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError('');
    try {
      const token = await currentUser.getIdToken();
      // Chamamos o serviço que criamos, passando o token e a data selecionada
      const data = await getBarberAppointments(token, selectedDate);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedDate]); // Roda novamente se o usuário ou a data mudar

  // 4. useEffect para chamar a busca de dados
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Minha Agenda</h1>
        <p className={styles.subtitle}>Olá, {currentUser?.displayName}! Aqui estão os seus agendamentos.</p>
      </header>

      {/* 5. Seletor de data para o barbeiro escolher o dia */}
      <section className={styles.dailyAgendaSection}>
        <div className={styles.datePickers}>
          <label>Ver agendamentos para o dia: 
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </label>
        </div>

        {error && <p style={{color: 'red'}}>{error}</p>}

        {isLoading ? <p>Carregando sua agenda...</p> : (
          appointments.length > 0 ? (
            <ul className={styles.list}>
              {appointments.map(app => (
                <li key={app.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span>{app.time}</span>
                  </div>
                  <div className={styles.appointmentInfo}>
                    <strong>Cliente: {app.clientName}</strong>
                    <span>Serviço(s): {app.serviceName} ({app.serviceDuration} min)</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p>Você não tem nenhum agendamento para o dia selecionado.</p>
        )}
      </section>
    </div>
  );
};

export default IndividualBarberDashboard;