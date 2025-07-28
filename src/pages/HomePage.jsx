// src/pages/HomePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.scss';
import PlansPage from './PlansPage'; // Vamos reutilizar a nossa página de planos

const HomePage = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Secção Hero */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div>
          <h1 className={styles.title}>
            Modernize a sua Barbearia. <br />
            <span className={styles.highlight}>Simples, Rápido e Profissional.</span>
          </h1>
          <p className={styles.subtitle}>
            A nossa plataforma de agendamento ajuda-o a gerir os seus horários, clientes e equipa, tudo num só lugar. Dedique mais tempo ao que você faz de melhor: cortar cabelo.
          </p>
          <Link to="/register" className={styles.ctaButton}>
            Comece Agora (Grátis por 14 dias)
          </Link>
        </div>
      </section>

      {/* Secção de Funcionalidades */}
      <section className={`${styles.section} ${styles.features}`}>
        <h2 className={styles.sectionTitle}>Tudo o que precisa para crescer</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📅</div>
            <h3 className={styles.featureTitle}>Agenda Inteligente</h3>
            <p className={styles.featureText}>Gestão de horários por profissional, evitando agendamentos duplicados e otimizando o seu tempo.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💳</div>
            <h3 className={styles.featureTitle}>Gestão de Planos</h3>
            <p className={styles.featureText}>Integração de pagamentos com a Stripe para gerir as suas assinaturas de forma segura e automática.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Relatórios Simples</h3>
            <p className={styles.featureText}>Acompanhe o seu faturamento, total de agendamentos e serviços mais populares para tomar as melhores decisões.</p>
          </div>
        </div>
      </section>

      {/* Secção de Planos (Reutilizamos a página de planos) */}
      <section className={styles.section}>
        <PlansPage />
      </section>

      {/* Secção de Garantia */}
      <section className={`${styles.section} ${styles.guarantee}`}>
        <div className={styles.guaranteeCard}>
          <h2 className={styles.sectionTitle}>A sua Satisfação é a nossa Prioridade</h2>
          <p className={styles.subtitle}>
            Acreditamos tanto na nossa plataforma que oferecemos uma garantia especial. Se nos primeiros 30 dias você não estiver 100% satisfeito, pode cancelar a sua assinatura e receber 80% do seu dinheiro de volta, sem perguntas.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
