// src/pages/BarberDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBarberAppointments } from '../services/barberService';

const BarberDashboard = () => {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();

  const fetchAppointments = useCallback(async (date) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const data = await getBarberAppointments(date, token);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate, fetchAppointments]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div>
      <h1>Minha Agenda</h1>
      <p>Bem-vindo, {currentUser?.displayName}! Aqui estão os seus agendamentos.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr style={{ margin: '20px 0' }} />

      <section>
        <div>
          <label htmlFor="agenda-date" style={{ marginRight: '10px' }}>Ver agendamentos para o dia:</label>
          <input id="agenda-date" type="date" value={selectedDate} onChange={handleDateChange} />
        </div>

        <div style={{ marginTop: '20px' }}>
          {isLoading ? <p>A carregar agenda...</p> : 
            appointments.length === 0 ? <p>Nenhum agendamento para este dia.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {appointments.map(app => (
                  <li key={app.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', margin: '10px 0' }}>
                    <strong>{app.time}</strong> - {app.clientName}
                    <br />
                    <span>Serviço: {app.serviceName} ({app.serviceDuration} min)</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </section>
    </div>
  );
};

export default BarberDashboard;
