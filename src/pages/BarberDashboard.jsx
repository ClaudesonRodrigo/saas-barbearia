// src/pages/BarberDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Passo 1: Importar a função de serviço CORRETA que criamos para o dono.
// Lembre-se de ajustar o caminho se você criou um barberService.js separado.
import { getBarbershopAppointments } from '../services/clientService'; 
import styles from './BarberDashboard.module.scss'; // Você pode criar um .scss novo ou reutilizar o do ClientDashboard

const BarberDashboard = () => {
  // Estado para armazenar os agendamentos, agrupados por data.
  const [groupedAppointments, setGroupedAppointments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();

  // Passo 2: Criar a função para buscar e processar os dados.
  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return; // Só executa se o dono estiver logado.

    setIsLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      // Chama a função do backend que busca TODOS os agendamentos da barbearia.
      const appointmentsData = await getBarbershopAppointments(token);

      // Lógica para agrupar os agendamentos por data para uma melhor visualização.
      const grouped = appointmentsData.reduce((acc, appointment) => {
        // Extrai a data no formato AAAA-MM-DD para usar como chave.
        const dateKey = new Date(appointment.startTime).toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = []; // Se a data ainda não existe no acumulador, cria um array para ela.
        }
        acc[dateKey].push(appointment); // Adiciona o agendamento ao array da data correspondente.
        return acc;
      }, {});

      setGroupedAppointments(grouped);

    } catch (err) {
      console.error("Erro detalhado ao buscar agendamentos:", err);
      setError(`Falha ao carregar agendamentos: ${err.message}`);
      setGroupedAppointments({});
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // A função será recriada se o usuário mudar.

  // Passo 3: Chamar a função de busca quando o componente for montado.
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Função placeholder para futuras implementações de cancelamento ou edição.
  const handleAppointmentAction = (appointmentId) => {
    alert(`Ação para o agendamento ${appointmentId} ainda não implementada.`);
  };

  // Passo 4: Renderizar o componente com base nos estados (loading, error, success).
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Painel de Controle</h1>
        <p className={styles.subtitle}>
          Bem-vindo, {currentUser?.displayName}! Visualize todos os agendamentos da sua barbearia.
        </p>
      </header>
      
      {/* Exibe mensagem de erro, se houver */}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section className={styles.appointmentsSection}>
        {isLoading ? (
          <p>Carregando agendamentos...</p>
        ) : Object.keys(groupedAppointments).length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Nenhum Agendamento Encontrado</h2>
            <p>Ainda não há agendamentos futuros ou passados para exibir.</p>
          </div>
        ) : (
          // Renderiza a lista de agendamentos agrupados por data
          Object.keys(groupedAppointments).sort().map(date => (
            <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeader}>
                {new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <ul className={styles.list}>
                {groupedAppointments[date].map(app => (
                  <li key={app.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span>{app.time}</span>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <strong>Cliente: {app.clientName}</strong>
                      <span>Serviço(s): {app.serviceName}</span>
                      {app.barberName && <span>Profissional: {app.barberName}</span>}
                    </div>
                    <div className={styles.appointmentActions}>
                      <button 
                        onClick={() => handleAppointmentAction(app.id)} 
                        className={styles.actionButton}
                      >
                        Detalhes
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default BarberDashboard;