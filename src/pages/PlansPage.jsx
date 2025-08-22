// src/pages/PlansPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createStripeCheckoutSession } from '../services/paymentService';
import { loadStripe } from '@stripe/stripe-js';
import styles from './PlansPage.module.scss';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// --- NOVOS PLANOS E VALORES ATUALIZADOS ---
const plans = [
  { 
    id: 'monthly_plan', 
    name: 'Plano Mensal', 
    price: 49.90, 
    description: 'Acesso completo e até 1 barbeiro (ideal para autônomos).' 
  },
  { 
    id: 'semestral_plan', 
    name: 'Plano Semestral', 
    price: 249.90, 
    description: 'Acesso por 6 meses e até 5 barbeiros.' 
  },
  { 
    id: 'yearly_plan', 
    name: 'Plano Anual', 
    price: 419.90, 
    description: 'Acesso por 1 ano e barbeiros ilimitados.' 
  },
];

const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.47" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const PlansPage = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleChoosePlan = async (plan) => {
    if (!currentUser) {
      setError("Você precisa estar autenticado para escolher um plano.");
      return;
    }

    setLoadingPlan(plan.id);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const planData = {
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
      };
      
      const { sessionId } = await createStripeCheckoutSession(planData, token);

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        setError(error.message);
        setLoadingPlan(null);
      }

    } catch (err) {
      setError(err.message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Planos e Assinaturas</h1>
      <p className={styles.subtitle}>Escolha o plano que melhor se adapta à sua barbearia.</p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.plansGrid}>
        {plans.map(plan => (
          <div key={plan.id} className={styles.planCard}>
            <div className={styles.planIcon}>
              <ScissorsIcon />
            </div>
            <h2 className={styles.planName}>{plan.name}</h2>
            <p className={styles.planPrice}>
              R$ {plan.price.toFixed(2)}
            </p>
            <p className={styles.planDescription}>{plan.description}</p>
            <button 
              onClick={() => handleChoosePlan(plan)} 
              disabled={loadingPlan === plan.id}
              className={styles.button}
            >
              {loadingPlan === plan.id ? 'A redirecionar...' : 'Escolher Plano'}
            </button>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
              <p>Garantia de 30 dias: {`R$ ${(plan.price * 0.8).toFixed(2)}`} de volta se não ficar satisfeito.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansPage;