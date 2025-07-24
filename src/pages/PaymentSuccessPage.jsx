// src/pages/PaymentSuccessPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1 style={{ color: 'green' }}>Pagamento Aprovado!</h1>
      <p>A sua assinatura foi ativada com sucesso.</p>
      <p>Obrigado por se juntar à nossa plataforma.</p>
      <Link to="/dashboard">
        <button style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1rem' }}>
          Ir para o Meu Painel
        </button>
      </Link>
    </div>
  );
};

export default PaymentSuccessPage;
