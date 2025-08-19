// src/pages/BarberDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Importamos as duas funções de serviço que nosso painel precisa
import { getDashboardStats, getDailyAppointments } from '../services/shopService'; // NOTA: Criei um novo shopService para organizar
import styles from './BarberDashboard.module.scss';
import { subDays, format } from 'date-fns';

// Função para formatar a data para o input type="date"
const getYYYYMMDD = (date) => format(date, 'yyyy-MM-dd');

const BarberDashboard = () => {
  const { currentUser } = useAuth();
  
  // --- Estados para o Resumo do Período ---
  const [statsData, setStatsData] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [startDate, setStartDate] = useState(getYYYYMMDD(subDays(new Date(), 29)));
  const [endDate, setEndDate] = useState(getYYYYMMDD(new Date()));

  // --- Estados para a Agenda do Dia ---
  const [dailyAppointments, setDailyAppointments] = useState([]);
  const [isDailyLoading, setIsDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState('');
  const [selectedDailyDate, setSelectedDailyDate] = useState(getYYYYMMDD(new Date()));

  // --- Função para buscar os dados do Resumo do Período ---
  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    setIsStatsLoading(true);
    setStatsError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getDashboardStats(token, startDate, endDate);
      setStatsData(data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setIsStatsLoading(false);
    }
  }, [currentUser, startDate, endDate]);

  // --- Função para buscar os dados da Agenda do Dia ---
  const fetchDailyAppointments = useCallback(async () => {
    if (!currentUser) return;
    setIsDailyLoading(true);
    setDailyError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getDailyAppointments(selectedDailyDate, token);
      setDailyAppointments(data);
    } catch (err) {
      setDailyError(err.message);
    } finally {
      setIsDailyLoading(false);
    }
  }, [currentUser, selectedDailyDate]);

  // --- Effects para chamar as funções de busca quando as datas mudam ---
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchDailyAppointments();
  }, [fetchDailyAppointments]);


  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Painel do Dono da Barbearia</h1>
        <p className={styles.subtitle}>Bem-vindo, {currentUser?.displayName}! Gerencie sua agenda, serviços e barbeiros.</p>
      </header>

      {/* SEÇÃO 1: RESUMO DO PERÍODO */}
      <section className={styles.summarySection}>
        <div className={styles.periodHeader}>
          <h2>Resumo do Período</h2>
          <div className={styles.datePickers}>
            <label>De: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label>Até: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          </div>
        </div>
        
        {isStatsLoading ? <p>Calculando estatísticas...</p> : statsError ? <p style={{color: 'red'}}>{statsError}</p> : statsData && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Faturamento Total</span>
                <strong>R$ {statsData.totalRevenue.toFixed(2)}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Total de Agendamentos (Clientes)</span>
                <strong>{statsData.totalAppointments}</strong>
              </div>
              {/* NOSSO NOVO CARD */}
              <div className={styles.statCard}>
                <span>Total de Serviços Prestados</span>
                <strong>{statsData.totalServicesSold}</strong>
              </div>
            </div>

            <div className={styles.popularServices}>
              <h3>Serviços Mais Populares</h3>
              {statsData.popularServices.length > 0 ? (
                <ul>
                  {statsData.popularServices.map(service => (
                    <li key={service.name}>
                      <span>{service.name}</span>
                      <strong>{service.count} agendamentos</strong>
                    </li>
                  ))}
                </ul>
              ) : <p>Não há dados de serviços para este período.</p>}
            </div>
          </>
        )}
      </section>

      {/* SEÇÃO 2: AGENDA DO DIA */}
      <section className={styles.dailyAgendaSection}>
        <h2>Agenda do Dia</h2>
        <div className={styles.datePickers}>
          <label>Veja agendamentos para o dia: <input type="date" value={selectedDailyDate} onChange={(e) => setSelectedDailyDate(e.target.value)} /></label>
        </div>

        {isDailyLoading ? <p>Carregando agenda...</p> : dailyError ? <p style={{color: 'red'}}>{dailyError}</p> : (
          dailyAppointments.length > 0 ? (
            <ul className={styles.list}>
              {dailyAppointments.map(app => (
                <li key={app.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span>{app.time}</span>
                  </div>
                  <div className={styles.appointmentInfo}>
                    <strong>Cliente: {app.clientName}</strong>
                    <span>Serviço(s): {app.serviceName} ({app.serviceDuration} min)</span>
                  </div>
                  <div className={styles.appointmentActions}>
                    <button className={styles.actionButton}>Cancelar</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p>Nenhum agendamento para o dia selecionado.</p>
        )}
      </section>
    </div>
  );
};

export default BarberDashboard;