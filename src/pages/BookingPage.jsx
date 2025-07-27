// src/pages/BookingPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPublicBarbershopData, getAvailableSlots, createAppointment } from '../services/publicService';
import styles from './BookingPage.module.scss'; // Importamos os nossos novos estilos

const BookingPage = () => {
  const { slug } = useParams(); 
  const { currentUser } = useAuth();
  
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const [barbershopData, setBarbershopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      setClientName(currentUser.displayName || '');
      setClientEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleServiceSelect = (service) => { setSelectedService(service); setSelectedBarber(null); setSelectedSlot(null); };
  const handleBarberSelect = (barber) => { setSelectedBarber(barber); setSelectedSlot(null); };
  const handleDateChange = (event) => { setSelectedDate(event.target.value); setSelectedSlot(null); };
  const handleSlotSelect = (slot) => { setSelectedSlot(slot); };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (slug) {
          const data = await getPublicBarbershopData(slug);
          setBarbershopData(data);
        }
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate && selectedBarber) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setError('');
        try {
          const slots = await getAvailableSlots(slug, selectedDate, selectedService.duration, selectedBarber.id);
          setAvailableSlots(slots);
        } catch (err) { setError(err.message); } finally { setIsLoadingSlots(false); }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, selectedDate, selectedBarber, slug]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setError('');
    setBookingSuccess('');
    try {
      const appointmentData = {
        barbershopId: barbershopData.shop.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.duration,
        servicePrice: selectedService.price,
        barberId: selectedBarber.id,
        date: selectedDate,
        slot: selectedSlot,
        clientName,
        clientEmail,
      };
      await createAppointment(appointmentData);
      setBookingSuccess(`Parabéns, ${clientName}! O seu horário com ${selectedBarber.name} foi confirmado.`);
    } catch (err) { setError(err.message); } finally { setIsBooking(false); }
  };

  if (loading) return <div className={styles.pageContainer}><p>A carregar...</p></div>;
  if (error && !bookingSuccess) return <div className={styles.pageContainer}><h1 style={{ color: 'red' }}>Erro: {error}</h1></div>;
  if (!barbershopData) return <div className={styles.pageContainer}><h1>Barbearia não encontrada.</h1></div>;

  const { shop, services, barbers } = barbershopData;

  if (bookingSuccess) {
    return (
      <div className={`${styles.pageContainer} ${styles.successMessage}`}>
        <h1>Agendamento Confirmado!</h1>
        <p>{bookingSuccess}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.shopHeader}>
        <h1 className={styles.shopName}>{shop.name}</h1>
        <p className={styles.shopWelcome}>Siga os passos abaixo para agendar o seu horário.</p>
      </header>

      <div className={styles.bookingContainer}>
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>Passo 1: Escolha o seu serviço</h2>
          <div className={styles.selectionGrid}>
            {services.map(service => (
              <button key={service.id} onClick={() => handleServiceSelect(service)} className={`${styles.selectionButton} ${selectedService?.id === service.id ? styles.selected : ''}`}>
                <strong>{service.name}</strong>
                <span>R$ {Number(service.price).toFixed(2)} ({service.duration} min)</span>
              </button>
            ))}
          </div>
        </div>

        {selectedService && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Passo 2: Escolha o seu profissional</h2>
            <div className={styles.selectionGrid}>
              {barbers.map(barber => (
                <button key={barber.id} onClick={() => handleBarberSelect(barber)} className={`${styles.selectionButton} ${selectedBarber?.id === barber.id ? styles.selected : ''}`}>
                  {barber.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedBarber && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Passo 3: Escolha a data</h2>
            <input type="date" onChange={handleDateChange} value={selectedDate} min={getTodayString()} className={styles.dateInput} />
          </div>
        )}
        
        {selectedDate && selectedBarber && selectedService && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Passo 4: Escolha o horário</h2>
            {isLoadingSlots ? <p>A procurar horários disponíveis...</p> : 
              availableSlots.length > 0 ? (
                <div className={styles.selectionGrid}>
                  {availableSlots.map(slot => (
                    <button key={slot} onClick={() => handleSlotSelect(slot)} className={`${styles.selectionButton} ${selectedSlot === slot ? styles.selected : ''}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              ) : <p>Nenhum horário disponível para este profissional neste dia. Por favor, escolha outra data ou profissional.</p>
            }
          </div>
        )}
        
        {selectedSlot && (
          <div className={`${styles.step} ${styles.confirmationSection}`}>
            <h2 className={styles.stepTitle}>Passo 5: Os seus Dados</h2>
            <p className={styles.confirmationSummary}>
              A agendar <strong>{selectedService.name}</strong> com <strong>{selectedBarber.name}</strong> para <strong>{new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong> às <strong>{selectedSlot}</strong>.
            </p>
            <form onSubmit={handleBookingSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>O seu Nome:</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required readOnly={!!currentUser} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>O seu E-mail:</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required readOnly={!!currentUser} className={styles.input} />
              </div>
              <button type="submit" disabled={isBooking} className={styles.button}>{isBooking ? 'A confirmar...' : 'Confirmar Agendamento'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
