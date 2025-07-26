// src/components/DashboardMetrics.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../services/shopService';
import { subDays, format } from 'date-fns';

const StatCard = ({ title, value }) => (
  <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', flex: 1 }}>
    <h3 style={{ margin: 0, color: '#555' }}>{title}</h3>
    <p style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight: 'bold' }}>{value}</p>
  </div>
);

const DashboardMetrics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para controlar o intervalo de datas
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
  }, [currentUser, startDate, endDate]); // A busca agora depende das datas

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Resumo do Período</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div>
            <label htmlFor="startDate">De:</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
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
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <StatCard 
              title="Faturação Total" 
              value={`R$ ${stats.totalRevenue.toFixed(2)}`} 
            />
            <StatCard 
              title="Total de Agendamentos" 
              value={stats.totalAppointments} 
            />
          </div>
          
          <h3>Serviços Mais Populares</h3>
          {stats.popularServices.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {stats.popularServices.map(service => (
                <li key={service.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
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
