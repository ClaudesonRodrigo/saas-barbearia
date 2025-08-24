// src/pages/ShopOwnerDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getDailyAppointments, cancelAppointment } from '../services/shopService';
import DashboardMetrics from '../components/DashboardMetrics';
import styles from './ShopOwnerDashboard.module.scss';

const ShopOwnerDashboard = () => {
  // --- Estados e Lógica para BARBEIROS foram REMOVIDOS ---

  // Estados para a AGENDA (permanecem)
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(getTodayString());
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Lógica para a AGENDA (permanece)
  const fetchAppointments = useCallback(async (date) => { if (!currentUser) return; setIsLoadingAppointments(true); setMessage(''); setError(''); try { const token = await currentUser.getIdToken(); const data = await getDailyAppointments(date, token); setAppointments(data); } catch (err) { setError(err.message); setAppointments([]); } finally { setIsLoadingAppointments(false); } }, [currentUser]);
  useEffect(() => { fetchAppointments(selectedAgendaDate); }, [selectedAgendaDate, fetchAppointments]);
  const handleAgendaDateChange = (e) => { setSelectedAgendaDate(e.target.value); };
  const handleCancelAppointment = async (appointmentId) => { if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) { return; } try { setMessage(''); setError(''); const token = await currentUser.getIdToken(); await cancelAppointment(appointmentId, token); setMessage("Agendamento cancelado com sucesso!"); fetchAppointments(selectedAgendaDate); } catch (err) { setError(err.message); } };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Painel do Dono da Barbearia</h1>
        <p>Bem-vindo! Acompanhe as métricas e a agenda da sua barbearia.</p>
      </header>

      <div className={styles.managementLinks}>
        <Link to="/dashboard/services" className={styles.managementButton}>Gerenciar Serviços</Link>
        <Link to="/dashboard/barbers" className={styles.managementButton}>Gerenciar Barbeiros</Link> 
        <Link to="/dashboard/settings" className={styles.managementButton}>Configurações da Loja ⚙️</Link>
      </div>
      
      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}
      
      <section className={styles.section}>
        <DashboardMetrics />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Agenda do Dia</h2>
        <div className={styles.formGroup}>
          <label htmlFor="agenda-date" className={styles.label}>Ver agendamentos para o dia:</label>
          <input id="agenda-date" type="date" value={selectedAgendaDate} onChange={handleAgendaDateChange} className={styles.input} />
        </div>
        <div>
          {isLoadingAppointments ? <p>A carregar agenda...</p> : 
            appointments.length === 0 ? (
              <div><p>Nenhum agendamento para este dia.</p></div>
            ) : (
              <ul className={styles.list}>
                {appointments.map(app => (
                  <li key={app.id} className={styles.listItem}>
                    <div className={styles.itemInfo}>
                      <strong>{app.time}</strong> - {app.clientName}
                      <br />
                      <span style={{color: '#9ca3af'}}>Serviço: {app.serviceName} ({app.serviceDuration} min)</span>
                    </div>
                    <div className={styles.listItemActions}>
                      <button onClick={() => handleCancelAppointment(app.id)} className={`${styles.button} ${styles.secondaryButton}`}>
                        Cancelar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </section>

      {/* A seção de GERENCIAR BARBEIROS foi removida deste arquivo */}
    </div>
  );
};

export default ShopOwnerDashboard;