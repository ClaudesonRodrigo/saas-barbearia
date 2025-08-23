// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.scss';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth(); // Pegamos a nova função
  const navigate = useNavigate();

  // Função helper para centralizar o redirecionamento
  const handleRedirect = (role) => {
    switch (role) {
      case 'superAdmin': navigate('/super-admin'); break;
      case 'shopOwner': navigate('/dashboard'); break;
      case 'barber': navigate('/minha-agenda'); break;
      case 'client': navigate('/meus-agendamentos'); break;
      default: navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { role } = await login(email, password);
      handleRedirect(role);
    } catch (err) {
      setError('Falha ao fazer login. Verifique o seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  // Nova função para o botão do Google
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { role } = await signInWithGoogle();
      handleRedirect(role);
    } catch (err) {
      setError('Falha ao fazer login com o Google.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Aceda à sua conta</h1>
        
        {/* Botão de Login com Google */}
        <div className={styles.socialLogin}>
          <button onClick={handleGoogleLogin} disabled={loading} className={`${styles.button} ${styles.googleButton}`}>
            Entrar com Google
          </button>
        </div>
        
        <div className={styles.divider}>ou entre com e-mail</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
          </div>
          <div>
            <button disabled={loading} type="submit" className={styles.button}>
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