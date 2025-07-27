// src/pages/PlansPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createStripeCheckoutSession } from '../services/paymentService';
import { loadStripe } from '@stripe/stripe-js';
import styles from './PlansPage.module.scss'; // Importamos os nossos novos estilos

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const plans = [
  { id: 'monthly_plan', name: 'Plano Mensal', price: 49.90, description: 'Acesso completo e até 4 barbeiros.' },
  { id: 'semestral_plan', name: 'Plano Semestral', price: 249.90, description: 'Acesso por 6 meses e até 10 barbeiros.' },
  { id: 'yearly_plan', name: 'Plano Anual', price: 499.90, description: 'Acesso por 1 ano e barbeiros ilimitados.' },
];

const PlansPage = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleChoosePlan = async (plan) => {
    if (!currentUser) {
      setError("Você precisa de estar autenticado para escolher um plano.");
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
            <h2 className={styles.planName}>{plan.name}</h2>
            <p className={styles.planPrice}>
              R$ {plan.price.toFixed(2)}
              {plan.id === 'monthly_plan' && <span>/mês</span>}
            </p>
            <p className={styles.planDescription}>{plan.description}</p>
            <button 
              onClick={() => handleChoosePlan(plan)} 
              disabled={loadingPlan === plan.id}
              className={styles.button}
            >
              {loadingPlan === plan.id ? 'A redirecionar...' : 'Escolher Plano'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansPage;
