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
import HomePage from './pages/HomePage'; // Nova importação

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
  return <Outlet />;
};

const SubscriptionRoute = () => {
  const { userRole, subscriptionStatus, loading } = useAuth();
  
  if (loading) return <h1>A carregar...</h1>;

  if (userRole === 'shopOwner' && subscriptionStatus !== 'active') {
    return <Navigate to="/planos" />;
  }

  return <Outlet />;
};

const Layout = () => {
  return (
    <>
      <Navbar />
      {/* Removido o padding para que a HomePage possa controlar o seu próprio espaçamento */}
      <main>
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
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          {/* Rota principal atualizada para usar a HomePage */}
          <Route path="/" element={<HomePage />} />

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>
          
          <Route element={<PrivateRoute allowedRoles={['shopOwner']} />}>
            <Route element={<SubscriptionRoute />}>
              <Route path="/dashboard" element={<ShopOwnerDashboard />} />
              <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
            </Route>
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
