// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerClient } from '../services/publicService';
import styles from './RegisterPage.module.scss'; // Importamos os nossos novos estilos

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await registerClient({ name, email, password });
      await login(email, password);
      navigate('/barbearias');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Criar Nova Conta</h1>
        
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>O seu Nome:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>O seu E-mail:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>A sua Senha:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
            />
          </div>
          <button disabled={loading} type="submit" className={styles.button}>
            {loading ? 'A registar...' : 'Registar e Entrar'}
          </button>
        </form>

        <div className={styles.switchPageLink}>
          <Link to="/login">Já tem uma conta? Faça login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
