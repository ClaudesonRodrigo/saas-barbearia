// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// --- SUAS IMPORTAÇÕES DE PÁGINA (sem alterações) ---
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

// --- COMPONENTES DE PROTEÇÃO DE ROTA (sem alterações) ---
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
          {/* Rotas Públicas (sem alterações) */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/agendar/:slug" element={<BookingPage />} />
          <Route path="/barbearias" element={<BarbershopListPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/" element={<HomePage />} />

          {/* --- ROTAS PROTEGIDAS --- */}

          {/* Rota do Super Admin */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>
          
          {/* ROTA DO DONO DA BARBEARIA (CORRIGIDA DE VOLTA PARA /dashboard) */}
          <Route element={<ShopOwnerProtectedRoute />}>
            <Route path="/dashboard" element={<ShopOwnerDashboard />} /> 
            <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
          </Route>
          <Route path="/planos" element={<PlansPage />} />

          {/* Rota do Barbeiro */}
          <Route element={<PrivateRoute allowedRoles={['barber']} />}>
            <Route path="/minha-agenda" element={<IndividualBarberDashboard />} />
          </Route>

          {/* Rota do Cliente */}
          <Route element={<PrivateRoute allowedRoles={['client']} />}>
            <Route path="/meus-agendamentos" element={<ClientDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;