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
import PlansPage from './pages/PlansPage'; // Nova importação

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
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

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
          </Route>
          
          <Route element={<PrivateRoute allowedRoles={['shopOwner']} />}>
            <Route path="/dashboard" element={<ShopOwnerDashboard />} />
            <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
            <Route path="/planos" element={<PlansPage />} /> {/* Nova rota */}
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
