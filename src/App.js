// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import ShopSettingsPage from './pages/ShopSettingsPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import BarbershopListPage from './pages/BarbershopListPage';
import PlansPage from './pages/PlansPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import HomePage from './pages/HomePage';
import IndividualBarberDashboard from './pages/IndividualBarberDashboard';
import ManageServicesPage from './pages/ManageServicesPage';
import ManageBarbersPage from './pages/ManageBarbersPage';

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
  return <Outlet />;
};

const ShopOwnerProtectedRoute = () => {
  const { currentUser, userRole, subscriptionStatus, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (userRole !== 'shopOwner') return <Navigate to="/" />;
  if (subscriptionStatus !== 'active') return <Navigate to="/planos" />;
  return <Outlet />;
};

const Layout = () => {
  return (
    <>
      <Navbar />
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
          <Route path="/" element={<HomePage />} />

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>
          
          <Route element={<ShopOwnerProtectedRoute />}>
            <Route path="/dashboard" element={<ShopOwnerDashboard />} /> 
            <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
            {/* 2. ADICIONAMOS A NOVA ROTA DE SERVIÇOS */}
            <Route path="/dashboard/services" element={<ManageServicesPage />} />
            <Route path="/dashboard/barbers" element={<ManageBarbersPage />} />
          </Route>
          <Route path="/planos" element={<PlansPage />} />

          <Route element={<PrivateRoute allowedRoles={['barber']} />}>
            <Route path="/minha-agenda" element={<IndividualBarberDashboard />} />
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