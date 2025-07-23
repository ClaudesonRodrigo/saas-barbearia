// src/pages/ShopSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShopSettings, updateShopSettings } from '../services/shopService';
import { Link } from 'react-router-dom';

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
      // Preenche o formulário com os dados existentes, se houver
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
    return <h1>A carregar configurações...</h1>;
  }

  return (
    <div>
      <Link to="/dashboard">← Voltar para o Painel</Link>
      <h1>Configurações da Loja</h1>
      <p>Defina aqui as informações e o horário de funcionamento da sua barbearia.</p>
      
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <h3>Informações de Contacto</h3>
        <div>
          <label htmlFor="address">Endereço:</label>
          <input type="text" id="address" name="address" value={settings.address} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="phone">Telefone:</label>
          <input type="tel" id="phone" name="phone" value={settings.phone} onChange={handleChange} />
        </div>

        <h3 style={{ marginTop: '30px' }}>Horário de Funcionamento</h3>
        <div>
          <label htmlFor="startTime">Abre às:</label>
          <input type="time" id="startTime" name="startTime" value={settings.startTime} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="endTime">Fecha às:</label>
          <input type="time" id="endTime" name="endTime" value={settings.endTime} onChange={handleChange} />
        </div>

        <h3 style={{ marginTop: '30px' }}>Intervalo de Almoço</h3>
        <div>
          <label htmlFor="lunchStart">Início do Almoço:</label>
          <input type="time" id="lunchStart" name="lunchStart" value={settings.lunchStart} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="lunchEnd">Fim do Almoço:</label>
          <input type="time" id="lunchEnd" name="lunchEnd" value={settings.lunchEnd} onChange={handleChange} />
        </div>

        <button type="submit" disabled={saving} style={{ marginTop: '20px' }}>
          {saving ? 'A guardar...' : 'Guardar Configurações'}
        </button>
      </form>
    </div>
  );
};

export default ShopSettingsPage;
