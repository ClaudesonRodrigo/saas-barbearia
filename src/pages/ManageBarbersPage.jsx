// src/pages/ManageBarbersPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createBarber, getBarbers, deleteBarber, updateBarber } from '../services/barberService';
import styles from './ShopOwnerDashboard.module.scss'; // Reutilizando o estilo do painel principal

const ManageBarbersPage = () => {
  const { currentUser } = useAuth();

  const [barberName, setBarberName] = useState('');
  const [barberEmail, setBarberEmail] = useState('');
  const [editingBarber, setEditingBarber] = useState(null);
  const [isLoadingBarbersForm, setIsLoadingBarbersForm] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBarbers = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingBarbers(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getBarbers(token);
      setBarbers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingBarbers(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const cancelBarberEdit = () => {
    setEditingBarber(null);
    setBarberName('');
    setBarberEmail('');
  };

  const handleBarberEditClick = (barber) => {
    setEditingBarber(barber);
    setBarberName(barber.name);
    setBarberEmail(barber.email);
    window.scrollTo(0, 0);
  };

  const handleBarberSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingBarbersForm(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const barberData = { name: barberName, email: barberEmail };
      if (editingBarber) {
        await updateBarber(editingBarber.id, barberData, token);
        setMessage("Dados do barbeiro atualizados com sucesso!");
      } else {
        const result = await createBarber(barberData, token);
        setMessage(`${result.message} Senha provisória: ${result.temporaryPassword}`);
      }
      cancelBarberEdit();
      fetchBarbers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingBarbersForm(false);
    }
  };

  const handleDeleteBarber = async (barberId) => {
    if (!window.confirm("Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await deleteBarber(barberId, token);
      setMessage("Barbeiro excluído com sucesso!");
      fetchBarbers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Link to="/dashboard" className={styles.settingsLink} style={{ marginBottom: '2rem' }}>← Voltar ao Painel</Link>
      <header className={styles.header}>
        <h1>Gerenciar Barbeiros</h1>
        <p>Adicione, edite ou remova os profissionais da sua equipe.</p>
      </header>
      
      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingBarber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}</h2>
        <form onSubmit={handleBarberSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome do Barbeiro:</label>
            <input type="text" value={barberName} onChange={(e) => setBarberName(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail do Barbeiro (para login):</label>
            <input type="email" value={barberEmail} onChange={(e) => setBarberEmail(e.target.value)} required className={styles.input} />
          </div>
          <div>
            <button type="submit" disabled={isLoadingBarbersForm} className={styles.button}>{isLoadingBarbersForm ? 'Salvando...' : (editingBarber ? 'Salvar Alterações' : 'Adicionar Barbeiro')}</button>
            {editingBarber && (<button type="button" onClick={cancelBarberEdit} disabled={isLoadingBarbersForm} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginLeft: '10px' }}>Cancelar Edição</button>)}
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Barbeiros Cadastrados</h2>
        {isLoadingBarbers ? (<p>Carregando barbeiros...</p>) : (
          <ul className={styles.list}>
            {barbers.map(barber => (
              <li key={barber.id} className={styles.listItem}>
                <div className={styles.itemInfo}><strong>{barber.name}</strong> - {barber.email}</div>
                <div className={styles.listItemActions}>
                  <button onClick={() => handleBarberEditClick(barber)} className={`${styles.button} ${styles.secondaryButton}`}>Editar</button>
                  <button onClick={() => handleDeleteBarber(barber.id)} className={`${styles.button} ${styles.secondaryButton}`}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ManageBarbersPage;