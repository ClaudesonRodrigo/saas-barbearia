// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Nosso hook para acessar a função de login
import { useNavigate } from 'react-router-dom'; // Para redirecionar após o login

const LoginPage = () => {
  // Estados para guardar os dados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pegando a função de login do nosso Contexto
  const { login } = useAuth();
  const navigate = useNavigate();

 // Dentro do componente LoginPage.jsx

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      // A função login retorna o 'UserCredential'
      const userCredential = await login(email, password);

      // A partir do userCredential, podemos pegar o token e as permissões (claims)
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const userRole = idTokenResult.claims.role;

      // Agora, redirecionamos com base na role
      if (userRole === 'superAdmin') {
        navigate('/super-admin');
      } else if (userRole === 'shopOwner') {
        navigate('/dashboard');
      } else {
        // Se não tiver uma role definida, vai para a página inicial
        navigate('/');
      }

    } catch (err) {
      setError('Falha ao fazer login. Verifique seu e-mail e senha.');
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Login</h1>
      {/* Mostra uma mensagem de erro, se houver */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* O botão fica desabilitado enquanto a requisição está em andamento */}
        <button disabled={loading} type="submit">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;