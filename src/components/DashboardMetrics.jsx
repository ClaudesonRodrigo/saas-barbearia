// src/components/DashboardMetrics.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../services/shopService';
import { subDays, format } from 'date-fns';
import styles from './DashboardMetrics.module.scss'; // Importamos os novos estilos

const StatCard = ({ title, value }) => (
  <div className={styles.statCard}>
    <h3 className={styles.statTitle}>{title}</h3>
    <p className={styles.statValue}>{value}</p>
  </div>
);

const DashboardMetrics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { currentUser } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getDashboardStats(token, startDate, endDate);
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Resumo do Período</h2>
        <div className={styles.dateFilters}>
          <div className={styles.filterGroup}>
            <label htmlFor="startDate">De:</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="endDate">Até:</label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <p>A carregar estatísticas...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Erro ao carregar estatísticas: {error}</p>
      ) : stats && (
        <>
          <div className={styles.statsGrid}>
            <StatCard 
              title="Faturação Total" 
              // Adicionando a verificação de segurança que tínhamos discutido
              value={`R$ ${stats.totalRevenue?.toFixed(2) ?? '0.00'}`} 
            />
            <StatCard 
              // Título mais claro para evitar confusão
              title="Total de Agendamentos (Clientes)" 
              value={stats.totalAppointments} 
            />
            {/* --- ADICIONE ESTE NOVO CARD AQUI --- */}
            <StatCard 
              title="Total de Serviços Prestados" 
              value={stats.totalServicesSold} 
            />
          </div>
          
          <h3 className={styles.title} style={{ fontSize: '1.25rem' }}>Serviços Mais Populares</h3>
          {stats.popularServices.length > 0 ? (
            <ul className={styles.popularList}>
              {stats.popularServices.map(service => (
                <li key={service.name} className={styles.popularListItem}>
                  <span>{service.name}</span>
                  <strong>{service.count} agendamentos</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Não há dados de serviços para este período.</p>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardMetrics;
