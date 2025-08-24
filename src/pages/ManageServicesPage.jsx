// src/pages/ManageServicesPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createService, getServices, deleteService, updateService } from '../services/shopService';
import { getUploadSignature, uploadToCloudinary } from '../services/cloudinaryService';
import styles from './ShopOwnerDashboard.module.scss'; // Reutilizando o estilo do painel principal

const ManageServicesPage = () => {
  const { currentUser } = useAuth();

  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [serviceImageFile, setServiceImageFile] = useState(null);
  const [serviceImageUrl, setServiceImageUrl] = useState('');
  
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchServices = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingServices(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getServices(token);
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingServices(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setEditingService(null);
    setServiceName('');
    setPrice('');
    setDuration('');
    setServiceImageFile(null);
    setServiceImageUrl('');
  };

  const handleEditClick = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    setServiceImageUrl(service.imageUrl || '');
    window.scrollTo(0, 0);
  };

  const handleServiceImageChange = (e) => {
    if (e.target.files[0]) {
      setServiceImageFile(e.target.files[0]);
      setServiceImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      let finalImageUrl = editingService ? editingService.imageUrl : '';
      const token = await currentUser.getIdToken();

      if (serviceImageFile) {
        setIsUploading(true);
        const signatureData = await getUploadSignature(token);
        finalImageUrl = await uploadToCloudinary(serviceImageFile, signatureData, setUploadProgress);
        setIsUploading(false);
      }
      
      const serviceData = { name: serviceName, price, duration, imageUrl: finalImageUrl };

      if (editingService) {
        await updateService(editingService.id, serviceData, token);
        setMessage("Serviço atualizado com sucesso!");
      } else {
        await createService(serviceData, token);
        setMessage("Serviço criado com sucesso!");
      }
      resetForm();
      fetchServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja excluir este serviço?")) return;
    try {
      setMessage('');
      setError('');
      const token = await currentUser.getIdToken();
      await deleteService(serviceId, token);
      fetchServices();
      setMessage("Serviço deletado com sucesso!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Link to="/dashboard" className={styles.settingsLink} style={{marginBottom: '2rem'}}>← Voltar ao Painel</Link>
      <header className={styles.header}>
        <h1>Gerenciar Serviços</h1>
        <p>Adicione, edite ou remova os serviços oferecidos na sua barbearia.</p>
      </header>

      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome do Serviço:</label>
            <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Preço (R$):</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Duração (minutos):</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Imagem do Serviço:</label>
            {serviceImageUrl && <img src={serviceImageUrl} alt="Pré-visualização" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />}
            <input type="file" onChange={handleServiceImageChange} accept="image/*" className={styles.input} />
            {isUploading && <progress value={uploadProgress} max="100" style={{ width: '100%', marginTop: '0.5rem' }} />}
          </div>
          <div>
            <button type="submit" disabled={isSubmitting || isUploading} className={styles.button}>{isSubmitting ? 'Salvando...' : (editingService ? 'Salvar Alterações' : 'Adicionar Serviço')}</button>
            {editingService && (<button type="button" onClick={resetForm} disabled={isSubmitting || isUploading} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginLeft: '10px' }}>Cancelar Edição</button>)}
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Seus Serviços Cadastrados</h2>
        {isLoadingServices ? <p>Carregando serviços...</p> : (
          <ul className={styles.list}>
            {services.map(service => (
              <li key={service.id} className={styles.listItem}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  {service.imageUrl && <img src={service.imageUrl} alt={service.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />}
                  <div className={styles.itemInfo}><strong>{service.name}</strong> - R$ {Number(service.price).toFixed(2)} - {service.duration} min</div>
                </div>
                <div className={styles.listItemActions}>
                  <button onClick={() => handleEditClick(service)} className={`${styles.button} ${styles.secondaryButton}`}>Editar</button>
                  <button onClick={() => handleDelete(service.id)} className={`${styles.button} ${styles.secondaryButton}`}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ManageServicesPage;