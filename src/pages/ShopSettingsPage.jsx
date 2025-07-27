// src/pages/ShopSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShopSettings, updateShopSettings } from '../services/shopService';
import { Link } from 'react-router-dom';
import styles from './ShopSettingsPage.module.scss'; // Importamos os nossos novos estilos

const ShopSettingsPage = () => {
  const [settings, setSettings] = useState({
    address: '',
    phone: '',
    startTime: '09:00',
    endTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { currentUser } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const data = await getShopSettings(token);
      setSettings({
        address: data.address || '',
        phone: data.phone || '',
        startTime: data.businessHours?.start || '09:00',
        endTime: data.businessHours?.end || '18:00',
        lunchStart: data.lunchBreak?.start || '12:00',
        lunchEnd: data.lunchBreak?.end || '13:00',
      });
    } catch (err) {
      setError('Falha ao carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      await updateShopSettings(settings, token);
      setMessage('Configurações guardadas com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.pageContainer}><h1>A carregar configurações...</h1></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <Link to="/dashboard" className={styles.backLink}>← Voltar para o Painel</Link>
      <h1 className={styles.title}>Configurações da Loja</h1>
      <p className={styles.subtitle}>Defina aqui as informações e o horário de funcionamento da sua barbearia.</p>
      
      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Informações de Contacto</h3>
          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.label}>Endereço:</label>
            <input type="text" id="address" name="address" value={settings.address} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>Telefone:</label>
            <input type="tel" id="phone" name="phone" value={settings.phone} onChange={handleChange} className={styles.input} />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Horário de Funcionamento</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="startTime" className={styles.label}>Abre às:</label>
              <input type="time" id="startTime" name="startTime" value={settings.startTime} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endTime" className={styles.label}>Fecha às:</label>
              <input type="time" id="endTime" name="endTime" value={settings.endTime} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Intervalo de Almoço</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="lunchStart" className={styles.label}>Início do Almoço:</label>
              <input type="time" id="lunchStart" name="lunchStart" value={settings.lunchStart} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lunchEnd" className={styles.label}>Fim do Almoço:</label>
              <input type="time" id="lunchEnd" name="lunchEnd" value={settings.lunchEnd} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className={styles.button}>
          {saving ? 'A guardar...' : 'Guardar Configurações'}
        </button>
      </form>
    </div>
  );
};

export default ShopSettingsPage;
