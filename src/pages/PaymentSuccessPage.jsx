// src/pages/PaymentSuccessPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PaymentSuccessPage.module.scss'; // Importamos os nossos novos estilos

const PaymentSuccessPage = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h1 className={styles.title}>Pagamento Aprovado!</h1>
        <p className={styles.subtitle}>
          A sua assinatura foi ativada com sucesso. Obrigado por se juntar à nossa plataforma.
        </p>
        <Link to="/dashboard" className={styles.button}>
          Ir para o Meu Painel
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
