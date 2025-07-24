// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import BarberDashboard from './pages/BarberDashboard';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import ShopSettingsPage from './pages/ShopSettingsPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import BarbershopListPage from './pages/BarbershopListPage';
import PlansPage from './pages/PlansPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
  return <Outlet />;
};

// 👇 NOVO COMPONENTE DE ROTA PROTEGIDA POR ASSINATURA 👇
const SubscriptionRoute = () => {
  const { userRole, subscriptionStatus, loading } = useAuth();
  
  if (loading) return <h1>A carregar...</h1>;

  // Se for um dono de loja e a sua assinatura não estiver ativa, redireciona para os planos
  if (userRole === 'shopOwner' && subscriptionStatus !== 'active') {
    return <Navigate to="/planos" />;
  }

  // Se a assinatura estiver ativa, permite o acesso às páginas filhas (dashboard, etc.)
  return <Outlet />;
};

const Layout = () => {
  return (
    <>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Rotas Públicas */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/agendar/:slug" element={<BookingPage />} />
          <Route path="/barbearias" element={<BarbershopListPage />} />
          <Route path="/" element={<h1>Página Inicial Pública</h1>} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>
          
          {/* 👇 A ROTA DO DONO AGORA TEM UMA DUPLA CAMADA DE SEGURANÇA 👇 */}
          <Route element={<PrivateRoute allowedRoles={['shopOwner']} />}>
            {/* Primeiro, verifica se a assinatura está ativa */}
            <Route element={<SubscriptionRoute />}>
              {/* Estas rotas só são acessíveis se a assinatura estiver ativa */}
              <Route path="/dashboard" element={<ShopOwnerDashboard />} />
              <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
            </Route>
            {/* A página de planos é sempre acessível para o dono poder pagar */}
            <Route path="/planos" element={<PlansPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['barber']} />}>
            <Route path="/minha-agenda" element={<BarberDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['client']} />}>
            <Route path="/meus-agendamentos" element={<ClientDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
