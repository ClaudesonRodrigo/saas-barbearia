// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.scss'; // Importamos os nossos novos estilos

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const userRole = idTokenResult.claims.role;

      if (userRole === 'superAdmin') {
        navigate('/super-admin');
      } else if (userRole === 'shopOwner') {
        navigate('/dashboard');
      } else if (userRole === 'barber') {
        navigate('/minha-agenda');
      } else if (userRole === 'client') {
        navigate('/barbearias');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Falha ao fazer login. Verifique o seu e-mail e senha.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Aceda à sua conta</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
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
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div>
            <button 
              disabled={loading} 
              type="submit"
              className={styles.button}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </div>
        </form>
        <div className={styles.switchPageLink}>
          <Link to="/register">Não tem uma conta? Registe-se</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
