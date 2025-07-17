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

  // Função que é chamada quando o formulário é enviado
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede que a página recarregue

    try {
      setError(''); // Limpa erros antigos
      setLoading(true); // Ativa o estado de carregamento (para o botão)
      await login(email, password);
      // Se o login for bem-sucedido, o onAuthStateChanged do nosso context
      // vai detectar o usuário e o PrivateRoute fará o resto.
      // Apenas navegamos para a rota que queremos acessar.
      navigate('/super-admin'); 
    } catch (err) {
      // Se o Firebase retornar um erro (senha errada, usuário não existe)
      setError('Falha ao fazer login. Verifique seu e-mail e senha.');
      console.error(err);
    }

    setLoading(false); // Desativa o estado de carregamento
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