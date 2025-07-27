// src/pages/BarbershopListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBarbershops } from '../services/publicService';
import styles from './BarbershopListPage.module.scss'; // Importamos os nossos novos estilos

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
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Barbearias Disponíveis</h1>
      <p className={styles.subtitle}>Escolha uma barbearia abaixo para começar o seu agendamento.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {isLoading ? (
        <p>A carregar barbearias...</p>
      ) : barbershops.length === 0 ? (
        <p>Nenhuma barbearia disponível no momento.</p>
      ) : (
        <div className={styles.listContainer}>
          {barbershops.map(shop => (
            <div key={shop.id} className={styles.shopCard}>
              <h2 className={styles.shopName}>{shop.name}</h2>
              <p className={styles.shopAddress}>{shop.address}</p>
              <Link to={`/agendar/${shop.slug}`} className={styles.button}>
                Agendar Agora
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BarbershopListPage;
