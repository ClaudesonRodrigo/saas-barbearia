// src/pages/PlansPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createStripeCheckoutSession } from '../services/paymentService';
import { loadStripe } from '@stripe/stripe-js';

// Carregamos a instância da Stripe fora do componente para evitar recarregá-la a cada renderização
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const plans = [
  { id: 'monthly_plan', name: 'Plano Mensal', price: 49.90, description: 'Acesso completo por 30 dias.' },
  { id: 'yearly_plan', name: 'Plano Anual', price: 499.90, description: 'Acesso por 1 ano com desconto.' },
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
      // 1. Obtemos o token do utilizador
      const token = await currentUser.getIdToken();
      const planData = {
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
      };
      
      // 2. Chamamos o nosso back-end para criar a sessão de checkout
      const { sessionId } = await createStripeCheckoutSession(planData, token);

      // 3. Usamos a biblioteca da Stripe para redirecionar para o checkout
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
    <div>
      <h1>Planos e Assinaturas</h1>
      <p>Escolha o plano que melhor se adapta à sua barbearia.</p>

      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', width: '300px' }}>
            <h2>{plan.name}</h2>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>R$ {plan.price.toFixed(2)}</p>
            <p>{plan.description}</p>
            <button 
              onClick={() => handleChoosePlan(plan)} 
              disabled={loadingPlan === plan.id}
              style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
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
