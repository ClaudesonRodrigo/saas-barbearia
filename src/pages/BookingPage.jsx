// src/pages/BookingPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPublicBarbershopData, getAvailableSlots, createAppointment } from '../services/publicService';
import styles from './BookingPage.module.scss';
import WhatsAppConsentForm from '../components/WhatsAppConsentForm/WhatsAppConsentForm';

const BookingPage = () => {
  const { slug } = useParams(); 
  const { currentUser } = useAuth();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [barbershopData, setBarbershopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');

  // CORRIGIDO: Garantindo que os valores sejam tratados como números
  const { totalPrice, totalDuration } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalPrice += Number(service.price) || 0;
        acc.totalDuration += Number(service.duration) || 0;
        return acc;
      },
      { totalPrice: 0, totalDuration: 0 }
    );
  }, [selectedServices]);

  useEffect(() => {
    if (currentUser) {
      setClientName(currentUser.displayName || '');
      setClientEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const mapQuery = barbershopData?.shop?.location?.address 
    ? encodeURIComponent(`${barbershopData.shop.location.address}, ${barbershopData.shop.location.cep}`)
    : '';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const handleServiceSelect = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      setSelectedSlot(null);
      return isSelected ? prev.filter(s => s.id !== service.id) : [...prev, service];
    });
  };

  const handleBarberSelect = (barber) => { 
    setSelectedBarber(barber); 
    setSelectedSlot(null); 
  };

  const handleDateChange = (event) => { 
    setSelectedDate(event.target.value); 
    setSelectedSlot(null); 
  };

  const handleSlotSelect = (slot) => { setSelectedSlot(slot); };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (slug) {
          const data = await getPublicBarbershopData(slug);
          setBarbershopData(data);
        }
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    if (selectedServices.length > 0 && selectedDate && selectedBarber) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setError('');
        try {
          const slots = await getAvailableSlots(slug, selectedDate, totalDuration, selectedBarber.id);
          setAvailableSlots(slots);
        } catch (err) { 
          setError(err.message); 
        } finally { 
          setIsLoadingSlots(false); 
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedServices, totalDuration, selectedDate, selectedBarber, slug]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setError('');
    setBookingSuccess('');
    try {
      const startTimeISO = new Date(`${selectedDate}T${selectedSlot}`).toISOString();

      const appointmentData = {
        barbershopId: barbershopData.shop.id,
        clientId: currentUser.uid,
        services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration, imageUrl: s.imageUrl })),
        serviceName: selectedServices.map(s => s.name).join(', '),
        serviceDuration: totalDuration,
        servicePrice: totalPrice,
        barberId: selectedBarber.id,
        startTime: startTimeISO,
        clientName,
        clientEmail,
      };

      await createAppointment(appointmentData);
      setBookingSuccess(`Parabéns, ${clientName}! O seu horário com ${selectedBarber.name} foi confirmado.`);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setIsBooking(false); 
    }
  };

  if (loading) return <div className={styles.pageContainer}><p>A carregar...</p></div>;
  if (error && !bookingSuccess) return <div className={styles.pageContainer}><h1 style={{ color: 'red' }}>Erro: {error}</h1></div>;
  if (!barbershopData) return <div className={styles.pageContainer}><h1>Barbearia não encontrada.</h1></div>;

  const { shop, services, barbers } = barbershopData;

  if (bookingSuccess) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.successMessageContainer}>
          <h1>Agendamento Confirmado!</h1>
          <p>{bookingSuccess}</p>
        </div>
        <WhatsAppConsentForm />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.shopHeader}>
        <h1 className={styles.shopName}>{shop.name}</h1>
        <p className={styles.shopWelcome}>Siga os passos abaixo para agendar o seu horário.</p>
      </header>

      <div className={styles.locationInfo}>
        <p><strong>Endereço:</strong> {shop.location?.address}</p>
        <p><strong>CEP:</strong> {shop.location?.cep}</p>
        <p><strong>Ponto de Referência:</strong> {shop.location?.referencePoint}</p>
        {mapQuery && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapButton}>
            Ver no Mapa
          </a>
        )}
      </div>

      <div className={styles.bookingContainer}>
        <div className={styles.step} style={{ display: 'block' }}>
          <h2 className={styles.stepTitle}>Passo 1: Escolha os seus serviços</h2>
          <div className={styles.selectionGrid}>
            {services.map(service => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <div 
                  key={`service-${service.id}`} 
                  onClick={() => handleServiceSelect(service)} 
                  className={`${styles.selectionButton} ${isSelected ? styles.selected : ''}`}
                >
                  <div className={styles.serviceImageContainer}>
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.name} className={styles.serviceImage} />
                    ) : (
                      <span>✂️</span>
                    )}
                  </div>
                  <div className={styles.serviceInfo}>
                    <strong>{service.name}</strong>
                    <span>R$ {Number(service.price).toFixed(2)} ({service.duration} min)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: selectedServices.length > 0 ? 'block' : 'none' }}>
          <h2 className={styles.stepTitle}>Passo 2: Escolha o seu profissional</h2>
          <div className={styles.selectionGrid}>
            {barbers.map(barber => (
              <button 
                key={`barber-${barber.id}`} 
                onClick={() => handleBarberSelect(barber)} 
                className={`${styles.selectionButton} ${selectedBarber?.id === barber.id ? styles.selected : ''}`}
              >
                {barber.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: selectedBarber ? 'block' : 'none' }}>
          <h2 className={styles.stepTitle}>Passo 3: Escolha a data</h2>
          <input type="date" onChange={handleDateChange} value={selectedDate} min={getTodayString()} className={styles.dateInput} />
        </div>

        <div style={{ display: selectedDate && selectedBarber && selectedServices.length > 0 ? 'block' : 'none' }}>
          <h2 className={styles.stepTitle}>Passo 4: Escolha o horário</h2>
          {isLoadingSlots ? <p>A procurar horários disponíveis...</p> : 
            availableSlots.length > 0 ? (
              <div className={styles.selectionGrid}>
                {availableSlots.map((slot, index) => (
                  <button 
                    key={`slot-${slot}-${selectedBarber?.id || 'no-barber'}-${index}`} 
                    onClick={() => handleSlotSelect(slot)} 
                    className={`${styles.selectionButton} ${selectedSlot === slot ? styles.selected : ''}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : <p>Nenhum horário disponível para este profissional neste dia.</p>
          }
        </div>

        <div style={{ display: selectedSlot ? 'block' : 'none' }}>
          <h2 className={styles.stepTitle}>Passo 5: Os seus Dados</h2>
          <p className={styles.confirmationSummary}>
            A agendar <strong>{selectedServices.map(s => s.name).join(' + ')}</strong> 
            com <strong>{selectedBarber?.name}</strong> para <strong>{new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong> às <strong>{selectedSlot}</strong>.
            <br/>
            <strong>Total: R$ {totalPrice.toFixed(2)} ({totalDuration} min)</strong>
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
            <button type="submit" disabled={isBooking} className={styles.button}>
              {isBooking ? 'A confirmar...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
