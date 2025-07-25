// src/components/DashboardMetrics.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../services/shopService';

const StatCard = ({ title, value, period }) => (
  <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', flex: 1 }}>
    <h3 style={{ margin: 0, color: '#555' }}>{title}</h3>
    <p style={{ fontSize: '2.5rem', margin: '10px 0', fontWeight: 'bold' }}>{value}</p>
    {period && <p style={{ margin: 0, color: '#777' }}>{period}</p>}
  </div>
);

const DashboardMetrics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const data = await getDashboardStats(token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser]);

  if (loading) {
    return <p>A carregar estatísticas...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erro ao carregar estatísticas: {error}</p>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <h2>Resumo dos Últimos 30 Dias</h2>
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
        <p>Ainda não há dados suficientes para mostrar os serviços mais populares.</p>
      )}
    </div>
  );
};

export default DashboardMetrics;
