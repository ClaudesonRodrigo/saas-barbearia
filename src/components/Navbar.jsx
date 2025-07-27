// src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.scss';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar o menu móvel

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Falha ao fazer logout", error);
    }
  };

  const renderLinks = (isMobile = false) => {
    const linkClass = isMobile ? `${styles.link} ${styles.mobileLink}` : styles.link;

    if (!currentUser) {
      return (
        <>
          <Link to="/login" className={linkClass}>Login</Link>
          <Link to="/register" className={isMobile ? linkClass : `${styles.button} ${styles.primaryButton}`}>Registar</Link>
        </>
      );
    }

    return (
      <>
        <span className={styles.welcomeText}>Olá, {currentUser.displayName || currentUser.email}!</span>
        
        {userRole === 'client' && (
          <>
            <Link to="/barbearias" className={linkClass}>Barbearias</Link>
            <Link to="/meus-agendamentos" className={linkClass}>Os Meus Agendamentos</Link>
          </>
        )}
        {userRole === 'shopOwner' && (
          <>
            <Link to="/dashboard" className={linkClass}>O Meu Painel</Link>
          </>
        )}
        {userRole === 'barber' && (
          <>
            <Link to="/minha-agenda" className={linkClass}>A Minha Agenda</Link>
          </>
        )}
        {userRole === 'superAdmin' && (
          <>
            <Link to="/super-admin" className={linkClass}>Painel Admin</Link>
          </>
        )}
        
        <button onClick={handleLogout} className={isMobile ? linkClass : styles.button}>Logout</button>
      </>
    );
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          Agenda Barber
        </Link>
        
        {/* Menu para Desktop */}
        <div className={styles.linksDesktop}>
          {renderLinks()}
        </div>

        {/* Botão Hambúrguer para Mobile */}
        <button className={styles.hamburgerButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* Menu Dropdown para Mobile */}
      {isMenuOpen && (
        <div className={styles.linksMobile}>
          {renderLinks(true)}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
