// src/pages/BookingPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicBarbershopData, getAvailableSlots, createAppointment } from '../services/publicService';

const BookingPage = () => {
  const { slug } = useParams(); 
  
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const [barbershopData, setBarbershopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  
  const handleServiceSelect = (service) => { setSelectedService(service); setSelectedSlot(null); };
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
    if (selectedService && selectedDate && new Date(selectedDate) >= new Date(getTodayString())) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setError('');
        try {
          const slots = await getAvailableSlots(slug, selectedDate, selectedService.duration);
          setAvailableSlots(slots);
        } catch (err) { setError(err.message); } finally { setIsLoadingSlots(false); }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, selectedDate, slug]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setError('');
    setBookingSuccess('');
    try {
      // Montamos o objeto completo com todos os dados necessários para o back-end
      const appointmentData = {
        barbershopId: barbershopData.shop.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.duration,
        date: selectedDate,
        slot: selectedSlot,
        clientName,
        clientEmail,
      };

      // Chamamos a função de serviço real
      await createAppointment(appointmentData);

      setBookingSuccess(`Parabéns, ${clientName}! Seu horário para ${selectedService.name} foi confirmado. Um e-mail de confirmação foi enviado para ${clientEmail}.`);
      
      setSelectedService(null);
      setSelectedDate(getTodayString());
      setSelectedSlot(null);
      setClientName('');
      setClientEmail('');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) return <h1>Carregando...</h1>;
  if (error && !bookingSuccess) return <h1 style={{ color: 'red' }}>Erro: {error}</h1>;
  if (!barbershopData) return <h1>Barbearia não encontrada.</h1>;

  const { shop, services, barbers } = barbershopData;

  if (bookingSuccess) {
    return (
      <div>
        <h1>Agendamento Confirmado!</h1>
        <p style={{ color: 'green' }}>{bookingSuccess}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{shop.name}</h1>
      <p>Bem-vindo! Siga os passos abaixo para agendar seu horário.</p>
      <hr />
      <section>
        <h2>Passo 1: Escolha o seu serviço</h2>
        <div>
          {services.map(service => (
            <button key={service.id} onClick={() => handleServiceSelect(service)} style={{ margin: '5px', padding: '10px', cursor: 'pointer', border: selectedService?.id === service.id ? '2px solid #007bff' : '1px solid #ccc', borderRadius: '5px' }}>
              <strong>{service.name}</strong> <br />
              R$ {Number(service.price).toFixed(2)} ({service.duration} min)
            </button>
          ))}
        </div>
      </section>

      <hr />

      {selectedService && (
        <section>
          <h2>Passo 2: Escolha a data</h2>
          <input 
            type="date"
            onChange={handleDateChange}
            value={selectedDate}
            min={getTodayString()}
            style={{ padding: '8px', fontSize: '1rem' }}
          />
        </section>
      )}

      <hr />
      
      {selectedService && selectedDate && (
        <section>
          <h2>Passo 3: Escolha o horário</h2>
          {isLoadingSlots ? <p>Buscando horários disponíveis...</p> : 
            availableSlots.length > 0 ? (
              <div>
                {availableSlots.map(slot => (
                  <button key={slot} onClick={() => handleSlotSelect(slot)} style={{ margin: '5px', padding: '10px', cursor: 'pointer', border: selectedSlot === slot ? '2px solid #007bff' : '1px solid #ccc', borderRadius: '5px' }}>
                    {slot}
                  </button>
                ))}
              </div>
            ) : <p>Nenhum horário disponível para este dia. Por favor, escolha outra data.</p>
          }
        </section>
      )}

      <hr />
      
      {selectedSlot && (
        <section>
          <h2>Passo 4: Seus Dados</h2>
          <p>
            Agendando <strong>{selectedService.name}</strong> para <strong>{new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong> às <strong>{selectedSlot}</strong>.
          </p>
          <form onSubmit={handleBookingSubmit}>
            <div>
              <label>Seu Nome:</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div>
              <label>Seu E-mail:</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={isBooking}>
              {isBooking ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </section>
      )}

      <hr />
      <section>
        <h2>Nossa Equipe</h2>
        <ul>
          {barbers.map(barber => (
            <li key={barber.id}>{barber.name}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default BookingPage;
