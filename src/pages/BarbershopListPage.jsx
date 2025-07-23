// src/pages/BarbershopListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBarbershops } from '../services/publicService';

const BarbershopListPage = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBarbershops = async () => {
      try {
        const data = await getAllBarbershops();
        setBarbershops(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBarbershops();
  }, []);

  return (
    <div>
      <h1>Barbearias Disponíveis</h1>
      <p>Escolha uma barbearia abaixo para começar o seu agendamento.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <hr style={{ margin: '20px 0' }} />

      {isLoading ? (
        <p>A carregar barbearias...</p>
      ) : barbershops.length === 0 ? (
        <p>Nenhuma barbearia disponível no momento.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {barbershops.map(shop => (
            <div key={shop.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
              <h2>{shop.name}</h2>
              <p>{shop.address}</p>
              <Link to={`/agendar/${shop.slug}`}>
                <button>Agendar Agora</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BarbershopListPage;
