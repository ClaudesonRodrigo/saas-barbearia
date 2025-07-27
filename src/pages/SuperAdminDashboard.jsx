// src/pages/SuperAdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBarbershop, getBarbershops } from '../services/barbershopService';
import styles from './SuperAdminDashboard.module.scss';

const SuperAdminDashboard = () => {
  const [shopName, setShopName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [shops, setShops] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  const { currentUser } = useAuth();

  const fetchShops = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingShops(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getBarbershops(token);
      setShops(data);
    } catch (err) {
      setError("Falha ao carregar as barbearias.");
    } finally {
      setIsLoadingShops(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchShops();
    }
  }, [fetchShops, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      await createBarbershop({ shopName, ownerEmail, ownerPassword }, token);
      
      setMessage(`Barbearia "${shopName}" registada com sucesso!`);
      setShopName('');
      setOwnerEmail('');
      setOwnerPassword('');
      fetchShops();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Painel Super Admin</h1>
      </header>

      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Registar Nova Barbearia</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="shopName" className={styles.label}>Nome da Barbearia:</label>
            <input 
              id="shopName"
              type="text" 
              value={shopName} 
              onChange={(e) => setShopName(e.target.value)}
              required 
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ownerEmail" className={styles.label}>E-mail do Dono:</label>
            <input 
              id="ownerEmail"
              type="email" 
              value={ownerEmail} 
              onChange={(e) => setOwnerEmail(e.target.value)}
              required 
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ownerPassword" className={styles.label}>Senha Provisória do Dono:</label>
            <input 
              id="ownerPassword"
              type="password" 
              value={ownerPassword} 
              onChange={(e) => setOwnerPassword(e.target.value)}
              required 
              className={styles.input}
            />
          </div>
          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? 'A registar...' : 'Registar Barbearia'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Barbearias Registadas</h2>
        {isLoadingShops ? (
          <p>A carregar barbearias...</p>
        ) : (
          <ul className={styles.list}>
            {shops.length > 0 ? shops.map(shop => (
              <li key={shop.id} className={styles.listItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{shop.name}</span>
                  <span className={styles.itemId}>(ID do Dono: {shop.ownerId})</span>
                </div>
              </li>
            )) : <p>Nenhuma barbearia registada.</p>}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
