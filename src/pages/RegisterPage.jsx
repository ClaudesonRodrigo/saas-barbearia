// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // 1. Importamos o useAuth
import { registerClient } from '../services/publicService';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // 2. Obtemos a função de login do nosso contexto
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Primeiro, registamos o cliente no back-end
      await registerClient({ name, email, password });
      
      // 3. Se o registo for bem-sucedido, fazemos o login automaticamente
      await login(email, password);

      // 4. E redirecionamos diretamente para a página de barbearias
      navigate('/barbearias');

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
    // O setLoading(false) não é mais necessário aqui, pois a página irá navegar
  };

  return (
    <div>
      <h1>Criar Nova Conta</h1>
      <p>Registe-se para agendar os seus serviços de forma mais rápida.</p>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>O seu Nome:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>O seu E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>A sua Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button disabled={loading} type="submit">
          {loading ? 'A registar...' : 'Registar e Entrar'}
        </button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <Link to="/login">Já tem uma conta? Faça login</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
