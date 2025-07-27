// src/pages/HomePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.scss';

const HomePage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Modernize a sua Barbearia. <br />
          <span className={styles.highlight}>Simples, Rápido e Profissional.</span>
        </h1>
        <p className={styles.subtitle}>
          A nossa plataforma de agendamento ajuda-o a gerir os seus horários, clientes e equipa, tudo num só lugar. Dedique mais tempo ao que você faz de melhor: cortar cabelo.
        </p>
        <Link to="/register" className={styles.ctaButton}>
          Registe a sua Barbearia Agora
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
