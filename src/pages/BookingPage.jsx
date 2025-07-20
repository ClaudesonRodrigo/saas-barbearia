// src/pages/BookingPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicBarbershopData, getAvailableSlots } from '../services/publicService';

const BookingPage = () => {
  const { slug } = useParams(); 
  
  // Estados para os dados da barbearia
  const [barbershopData, setBarbershopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para o processo de agendamento
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Novos estados para os horários disponíveis
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Funções para lidar com as seleções do cliente
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedSlot(null); // Reseta o horário ao trocar de serviço
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedSlot(null); // Reseta o horário ao trocar de data
  };
  
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // Efeito para buscar os dados iniciais da barbearia
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

  // Efeito para buscar os HORÁRIOS DISPONÍVEIS
  useEffect(() => {
    if (selectedService && selectedDate) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setError('');
        try {
          const slots = await getAvailableSlots(slug, selectedDate, selectedService.duration);
          setAvailableSlots(slots);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [selectedService, selectedDate, slug]);

  if (loading) {
    return <h1>Carregando informações da barbearia...</h1>;
  }

  if (error) {
    return <h1 style={{ color: 'red' }}>Erro: {error}</h1>;
  }

  if (!barbershopData) {
    return <h1>Barbearia não encontrada.</h1>;
  }

  const { shop, services, barbers } = barbershopData;

  return (
    <div>
      <h1>{shop.name}</h1>
      <p>Bem-vindo! Siga os passos abaixo para agendar seu horário.</p>

      <hr />

      <section>
        <h2>Passo 1: Escolha o seu serviço</h2>
        <div>
          {services.map(service => (
            <button 
              key={service.id} 
              onClick={() => handleServiceSelect(service)}
              style={{ 
                margin: '5px', 
                padding: '10px',
                cursor: 'pointer',
                border: selectedService?.id === service.id ? '2px solid #007bff' : '1px solid #ccc',
                borderRadius: '5px'
              }}
            >
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
                  <button 
                    key={slot} 
                    onClick={() => handleSlotSelect(slot)}
                    style={{ 
                      margin: '5px',
                      padding: '10px',
                      cursor: 'pointer',
                      border: selectedSlot === slot ? '2px solid #007bff' : '1px solid #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : <p>Nenhum horário disponível para este dia. Por favor, escolha outra data.</p>
          }
        </section>
      )}

      {selectedSlot && (
        <section>
          <hr />
          <h2>Passo 4: Confirmar Agendamento</h2>
          <p>
            Você selecionou o serviço <strong>{selectedService.name}</strong> no dia <strong>{new Date(selectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong> às <strong>{selectedSlot}</strong>.
          </p>
          {/* Aqui entrará o formulário para nome, email e o botão de confirmar */}
          <p>O formulário de confirmação aparecerá aqui no próximo passo.</p>
        </section>
      )}
    </div>
  );
};

export default BookingPage;