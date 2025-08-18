// src/pages/ShopSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShopSettings, updateShopSettings } from '../services/shopService';
import { uploadImage } from '../services/storageService'; // 1. Importamos o nosso serviço de upload
import { Link } from 'react-router-dom';
import styles from './ShopSettingsPage.module.scss';

const ShopSettingsPage = () => {
  const [settings, setSettings] = useState({
    address: '',
    phone: '',
    startTime: '09:00',
    endTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    logoUrl: '', // Adicionamos o logoUrl ao estado
  });
  
  // --- Novos estados para o upload ---
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
        logoUrl: data.logoUrl || '', // Carregamos o logoUrl existente
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

  // --- Nova lógica para lidar com o upload da imagem ---
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    setError('');
    try {
      const downloadURL = await uploadImage(
        imageFile, 
        currentUser.uid, 
        (progress) => setUploadProgress(progress)
      );
      // Atualizamos o estado das configurações com a nova URL do logo
      setSettings(prev => ({ ...prev, logoUrl: downloadURL }));
      setMessage("Upload da imagem concluído com sucesso!");
    } catch (err) {
      setError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = await currentUser.getIdToken();
      // O objeto 'settings' já contém o 'logoUrl' atualizado
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
        {/* Secção do Logo */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Logo da Barbearia</h3>
          <div className={styles.formGroup}>
            <label htmlFor="logo" className={styles.label}>
              {settings.logoUrl ? "Alterar logo:" : "Adicionar logo:"}
            </label>
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo da barbearia" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
            )}
            <input type="file" id="logo" onChange={handleImageChange} accept="image/*" className={styles.input} />
            {isUploading && (
              <progress value={uploadProgress} max="100" style={{ width: '100%', marginTop: '0.5rem' }} />
            )}
            <button type="button" onClick={handleImageUpload} disabled={!imageFile || isUploading} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginTop: '0.5rem' }}>
              {isUploading ? `A enviar... ${Math.round(uploadProgress)}%` : 'Enviar Imagem'}
            </button>
          </div>
        </div>

        {/* Outras secções do formulário */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Informações de Contacto</h3>
          {/* ... inputs de endereço e telefone ... */}
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Horário de Funcionamento</h3>
          {/* ... inputs de horários ... */}
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Intervalo de Almoço</h3>
          {/* ... inputs de almoço ... */}
        </div>

        <button type="submit" disabled={saving || isUploading} className={styles.button}>
          {saving ? 'A guardar...' : 'Guardar Todas as Configurações'}
        </button>
      </form>
    </div>
  );
};

export default ShopSettingsPage;
