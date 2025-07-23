// src/components/Navbar.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redireciona para o login após o logout
    } catch (error) {
      console.error("Falha ao fazer logout", error);
    }
  };

  // Estilos simples para a barra de navegação
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  };

  const linkStyle = {
    margin: '0 10px',
    textDecoration: 'none',
    color: '#007bff',
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const renderLinks = () => {
    if (!currentUser) {
      // Links para visitantes não autenticados
      return (
        <div>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/register" style={linkStyle}>Registar</Link>
        </div>
      );
    }

    // Links baseados na permissão (role) do utilizador
    return (
      <div style={userInfoStyle}>
        <span style={{ marginRight: '20px' }}>Olá, {currentUser.displayName || currentUser.email}!</span>
        
        {userRole === 'client' && (
          <>
            <Link to="/barbearias" style={linkStyle}>Barbearias</Link>
            <Link to="/meus-agendamentos" style={linkStyle}>Os Meus Agendamentos</Link>
          </>
        )}
        {userRole === 'shopOwner' && (
          <>
            <Link to="/dashboard" style={linkStyle}>O Meu Painel</Link>
          </>
        )}
        {userRole === 'barber' && (
          <>
            <Link to="/minha-agenda" style={linkStyle}>A Minha Agenda</Link>
          </>
        )}
        {userRole === 'superAdmin' && (
          <>
            <Link to="/super-admin" style={linkStyle}>Painel Admin</Link>
          </>
        )}
        
        <button onClick={handleLogout} style={{ marginLeft: '20px' }}>Logout</button>
      </div>
    );
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={{ ...linkStyle, fontWeight: 'bold' }}>
        Agenda Barber
      </Link>
      {renderLinks()}
    </nav>
  );
};

export default Navbar;
