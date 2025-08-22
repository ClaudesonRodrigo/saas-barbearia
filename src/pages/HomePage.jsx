// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.scss';
import PlansPage from './PlansPage';
// 1. Importamos nosso novo serviço
import { getLatestBarbershops } from '../services/publicService';

const HomePage = () => {
  // 2. Criamos estados para armazenar as barbearias
  const [latestShops, setLatestShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Buscamos os dados quando a página carrega
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await getLatestBarbershops();
        setLatestShops(data);
      } catch (error) {
        console.error("Erro ao carregar últimas barbearias:", error);
        // Não definimos um erro de UI para não quebrar a página principal
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Seção Hero (sem alterações) */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div>
          <h1 className={styles.title}>
            Modernize a sua Barbearia. <br />
            <span className={styles.highlight}>Simples, Rápido e Profissional.</span>
          </h1>
          <p className={styles.subtitle}>
            Nossa plataforma de agendamento ajuda a gerir seus horários, clientes e equipe, tudo num só lugar. Dedique mais tempo ao que você faz de melhor: cortar cabelo.
          </p>
          <Link to="/register" className={styles.ctaButton}>
            Comece Agora (Grátis por 14 dias)
          </Link>
        </div>
      </section>

      {/* NOVA SEÇÃO: Últimas Barbearias */}
      <section className={`${styles.section} ${styles.latestShopsSection}`}>
        <h2 className={styles.sectionTitle}>Junte-se às barbearias que já estão inovando</h2>
        <div className={styles.shopsGrid}>
          {isLoading ? <p>Carregando...</p> : latestShops.map(shop => (
            <div key={shop.id} className={styles.shopCard}>
              <div className={styles.logoContainer}>
                {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className={styles.shopLogo} /> : <span>✂️</span>}
              </div>
              <h3 className={styles.shopName}>{shop.name}</h3>
              <p className={styles.shopAddress}>{shop.address}</p>
              <Link to={`/agendar/${shop.slug}`} className={styles.shopButton}>
                Ver Agenda
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de Funcionalidades (Melhorada) */}
      <section className={`${styles.section} ${styles.features}`}>
        <h2 className={styles.sectionTitle}>Tudo o que você precisa para crescer</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📅</div>
            <h3 className={styles.featureTitle}>Agenda Inteligente</h3>
            <p className={styles.featureText}>Gestão de horários por profissional, evitando agendamentos duplicados e otimizando o seu tempo.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💳</div>
            <h3 className={styles.featureTitle}>Gestão de Planos</h3>
            <p className={styles.featureText}>Integração de pagamentos com a Stripe para gerir suas assinaturas de forma segura e automática.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Relatórios Simples</h3>
            <p className={styles.featureText}>Acompanhe seu faturamento, total de agendamentos e serviços mais populares para tomar as melhores decisões.</p>
          </div>
        </div>
      </section>
      
      {/* Seção de Planos */}
      <section className={styles.section}>
        <PlansPage />
      </section>
    </div>
  );
};

export default HomePage;