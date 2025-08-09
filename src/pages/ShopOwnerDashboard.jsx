// src/pages/ShopOwnerDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createService, getServices, deleteService, updateService, getDailyAppointments, cancelAppointment } from '../services/shopService';
import { createBarber, getBarbers, deleteBarber, updateBarber } from '../services/barberService';
import { getUploadSignature, uploadToCloudinary } from '../services/cloudinaryService'; // Importamos os serviços do Cloudinary
import DashboardMetrics from '../components/DashboardMetrics';
import styles from './ShopOwnerDashboard.module.scss';

const ShopOwnerDashboard = () => {
  // --- Estados para SERVIÇOS ---
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceImageFile, setServiceImageFile] = useState(null); // Novo estado para o ficheiro da imagem
  const [serviceImageUrl, setServiceImageUrl] = useState(''); // Novo estado para a URL da imagem
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- Estados para BARBEIROS ---
  const [barberName, setBarberName] = useState('');
  const [barberEmail, setBarberEmail] = useState('');
  const [editingBarber, setEditingBarber] = useState(null);
  const [isLoadingBarbersForm, setIsLoadingBarbersForm] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);

  // --- Estados para a AGENDA ---
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(getTodayString());
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  // --- Estados de UI ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const { currentUser } = useAuth();

  // --- Lógica para SERVIÇOS (com upload de imagem) ---
  const fetchServices = useCallback(async () => { if (!currentUser) return; setIsLoadingServices(true); try { const token = await currentUser.getIdToken(); const data = await getServices(token); setServices(data); } catch (err) { setError(err.message); } finally { setIsLoadingServices(false); } }, [currentUser]);
  useEffect(() => { fetchServices(); }, [fetchServices]);
  
  const handleEditClick = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    setServiceImageUrl(service.imageUrl || ''); // Preenche a URL da imagem atual
  };

  const cancelEdit = () => {
    setEditingService(null);
    setServiceName('');
    setPrice('');
    setDuration('');
    setServiceImageFile(null);
    setServiceImageUrl('');
  };

  const handleServiceImageChange = (e) => {
    if (e.target.files[0]) {
      setServiceImageFile(e.target.files[0]);
      // Cria uma URL local para a pré-visualização
      setServiceImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setIsServiceLoading(true);
    setMessage('');
    setError('');
    try {
      let finalImageUrl = editingService ? editingService.imageUrl : '';

      // 1. Se uma nova imagem foi selecionada, faz o upload primeiro
      if (serviceImageFile) {
        setIsUploading(true);
        const token = await currentUser.getIdToken();
        const signatureData = await getUploadSignature(token);
        finalImageUrl = await uploadToCloudinary(serviceImageFile, signatureData, setUploadProgress);
        setIsUploading(false);
      }
      
      const token = await currentUser.getIdToken();
      const serviceData = { name: serviceName, price, duration, imageUrl: finalImageUrl };

      if (editingService) {
        await updateService(editingService.id, serviceData, token);
        setMessage("Serviço atualizado com sucesso!");
      } else {
        await createService(serviceData, token);
        setMessage("Serviço criado com sucesso!");
      }
      cancelEdit();
      fetchServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsServiceLoading(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (serviceId) => { if (!window.confirm("Tem certeza que deseja excluir este serviço?")) { return; } try { setMessage(''); setError(''); const token = await currentUser.getIdToken(); await deleteService(serviceId, token); fetchServices(); setMessage("Serviço deletado com sucesso!"); } catch (err) { setError(err.message); } };

  // --- Lógica para BARBEIROS ---
  const fetchBarbers = useCallback(async () => { if (!currentUser) return; setIsLoadingBarbers(true); try { const token = await currentUser.getIdToken(); const data = await getBarbers(token); setBarbers(data); } catch (err) { setError(err.message); } finally { setIsLoadingBarbers(false); } }, [currentUser]);
  useEffect(() => { fetchBarbers(); }, [fetchBarbers]);
  const handleBarberEditClick = (barber) => { setEditingBarber(barber); setBarberName(barber.name); setBarberEmail(barber.email); };
  const cancelBarberEdit = () => { setEditingBarber(null); setBarberName(''); setBarberEmail(''); };
  const handleBarberSubmit = async (e) => { e.preventDefault(); setIsLoadingBarbersForm(true); setMessage(''); setError(''); try { const token = await currentUser.getIdToken(); const barberData = { name: barberName, email: barberEmail }; if (editingBarber) { await updateBarber(editingBarber.id, barberData, token); setMessage("Dados do barbeiro atualizados com sucesso!"); } else { const result = await createBarber(barberData, token); setMessage(`${result.message} Senha provisória: ${result.temporaryPassword}`); } cancelBarberEdit(); fetchBarbers(); } catch (err) { setError(err.message); } finally { setIsLoadingBarbersForm(false); } };
  const handleDeleteBarber = async (barberId) => { if (!window.confirm("Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.")) { return; } try { setMessage(''); setError(''); const token = await currentUser.getIdToken(); await deleteBarber(barberId, token); setMessage("Barbeiro excluído com sucesso!"); fetchBarbers(); } catch (err) { setError(err.message); } };

  // --- Lógica para a AGENDA ---
  const fetchAppointments = useCallback(async (date) => { if (!currentUser) return; setIsLoadingAppointments(true); setMessage(''); setError(''); try { const token = await currentUser.getIdToken(); const data = await getDailyAppointments(date, token); setAppointments(data); } catch (err) { setError(err.message); setAppointments([]); } finally { setIsLoadingAppointments(false); } }, [currentUser]);
  useEffect(() => { fetchAppointments(selectedAgendaDate); }, [selectedAgendaDate, fetchAppointments]);
  const handleAgendaDateChange = (e) => { setSelectedAgendaDate(e.target.value); };
  const handleCancelAppointment = async (appointmentId) => { if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) { return; } try { setMessage(''); setError(''); const token = await currentUser.getIdToken(); await cancelAppointment(appointmentId, token); setMessage("Agendamento cancelado com sucesso!"); fetchAppointments(selectedAgendaDate); } catch (err) { setError(err.message); } };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Painel do Dono da Barbearia</h1>
        <p>Bem-vindo! Gerencie sua agenda, serviços e barbeiros.</p>
      </header>
      <Link to="/dashboard/settings" className={styles.settingsLink}>
        Ir para Configurações da Loja ⚙️
      </Link>
      
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
            appointments.length === 0 ? <p>Nenhum agendamento para este dia.</p> : (
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingService ? 'Editar Serviço' : 'Gerir Serviços'}</h2>
        <form onSubmit={handleServiceSubmit} className={styles.form}>
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
            <button type="submit" disabled={isServiceLoading || isUploading} className={styles.button}>{isServiceLoading ? 'A guardar...' : (editingService ? 'Guardar Alterações' : 'Adicionar Serviço')}</button>
            {editingService && (<button type="button" onClick={cancelEdit} disabled={isServiceLoading || isUploading} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginLeft: '10px' }}>Cancelar</button>)}
          </div>
        </form>
        <h3 style={{ marginTop: '30px' }}>Os seus Serviços</h3>
        {isLoadingServices ? ( <p>A carregar serviços...</p> ) : (
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingBarber ? 'Editar Barbeiro' : 'Gerir Barbeiros'}</h2>
        <form onSubmit={handleBarberSubmit} className={styles.form}>
          <div className={styles.formGroup}><label className={styles.label}>Nome do Barbeiro:</label><input type="text" value={barberName} onChange={(e) => setBarberName(e.target.value)} required className={styles.input} /></div>
          <div className={styles.formGroup}><label className={styles.label}>E-mail do Barbeiro:</label><input type="email" value={barberEmail} onChange={(e) => setBarberEmail(e.target.value)} required className={styles.input} /></div>
          <div>
            <button type="submit" disabled={isLoadingBarbersForm} className={styles.button}>{isLoadingBarbersForm ? 'A guardar...' : (editingBarber ? 'Guardar Alterações' : 'Adicionar Barbeiro')}</button>
            {editingBarber && (<button type="button" onClick={cancelBarberEdit} disabled={isLoadingBarbersForm} className={`${styles.button} ${styles.secondaryButton}`} style={{ marginLeft: '10px' }}>Cancelar</button>)}
          </div>
        </form>
        <h3 style={{ marginTop: '30px' }}>Barbeiros Registados</h3>
        {isLoadingBarbers ? (<p>A carregar barbeiros...</p>) : (
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
        )}''
      </section>
    </div>
  );
};

export default ShopOwnerDashboard;
