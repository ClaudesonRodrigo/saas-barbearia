// src/pages/ShopSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShopSettings, updateShopSettings } from '../services/shopService';
import { getUploadSignature, uploadToCloudinary } from '../services/cloudinaryService';
import { Link } from 'react-router-dom';
import styles from './ShopSettingsPage.module.scss';

const ShopSettingsPage = () => {
  const [shopData, setShopData] = useState(null);
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
      setShopData(data);
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
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setShopData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: value
        }
      }));
    } else {
      setShopData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {

    if (!imageFile || !currentUser) return;
    setIsUploading(true);
    setError('');
    setMessage('');
    try {
      const token = await currentUser.getIdToken();
      const signatureData = await getUploadSignature(token);
      const downloadURL = await uploadToCloudinary(imageFile, signatureData, (progress) => setUploadProgress(progress));
      setShopData(prev => ({ ...prev, logoUrl: downloadURL }));
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
      await updateShopSettings(shopData, token);
      setMessage('Configurações guardadas com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !shopData) {
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
          <h3 className={styles.formSectionTitle}>Logo da Barbearia</h3>
          <div className={styles.logoUploadContainer}>
            <div className={styles.logoPreview}>
              {shopData.logoUrl && (
                <img src={shopData.logoUrl} alt="Logo da barbearia" className={styles.logoImage} />
              )}
            </div>
            <div className={styles.formGroup} style={{ width: '100%', maxWidth: '300px' }}>
              <label htmlFor="logo" className={styles.label}>
                {shopData.logoUrl ? "Alterar logo:" : "Adicionar logo:"}
              </label>
              <input type="file" id="logo" onChange={handleImageChange} accept="image/*" className={styles.input} />
              {isUploading && (
                <progress value={uploadProgress} max="100" style={{ width: '100%', marginTop: '0.5rem' }} />
              )}
              <button type="button" onClick={handleImageUpload} disabled={!imageFile || isUploading} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginTop: '0.5rem', width: '100%' }}>
                {isUploading ? `A enviar... ${Math.round(uploadProgress)}%` : 'Enviar Imagem'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Informações de Contacto e Localização</h3>
          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.label}>Endereço:</label>
            <input type="text" id="address" name="location.address" value={shopData.location?.address || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cep" className={styles.label}>CEP:</label>
            <input type="text" id="cep" name="location.cep" value={shopData.location?.cep || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="referencePoint" className={styles.label}>Ponto de Referência:</label>
            <input type="text" id="referencePoint" name="location.referencePoint" value={shopData.location?.referencePoint || ''} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>Telefone:</label>
            <input type="tel" id="phone" name="phone" value={shopData.phone || ''} onChange={handleChange} className={styles.input} />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Horário de Funcionamento</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="startTime" className={styles.label}>Abre às:</label>
              <input type="time" id="startTime" name="businessHours.start" value={shopData.businessHours?.start || '09:00'} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endTime" className={styles.label}>Fecha às:</label>
              <input type="time" id="endTime" name="businessHours.end" value={shopData.businessHours?.end || '18:00'} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Intervalo de Almoço</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="lunchStart" className={styles.label}>Início do Almoço:</label>
              <input type="time" id="lunchStart" name="lunchBreak.start" value={shopData.lunchBreak?.start || '12:00'} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lunchEnd" className={styles.label}>Fim do Almoço:</label>
              <input type="time" id="lunchEnd" name="lunchBreak.end" value={shopData.lunchBreak?.end || '13:00'} onChange={handleChange} className={styles.input} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving || isUploading} className={styles.button}>
          {saving ? 'A guardar...' : 'Guardar Todas as Configurações'}
        </button>
      </form>
    </div>
  );
};

export default ShopSettingsPage;