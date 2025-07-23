// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importe as páginas
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import BarberDashboard from './pages/BarberDashboard';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import ShopSettingsPage from './pages/ShopSettingsPage'; // A importação que já tinha

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>A carregar...</h1>;
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/agendar/:slug" element={<BookingPage />} />
        <Route path="/" element={<h1>Página Inicial Pública</h1>} />

        {/* Rotas Protegidas */}
        <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
        </Route>
        
        <Route element={<PrivateRoute allowedRoles={['shopOwner']} />}>
          <Route path="/dashboard" element={<ShopOwnerDashboard />} />
          {/* 👇 A ROTA QUE FALTAVA 👇 */}
          <Route path="/dashboard/settings" element={<ShopSettingsPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['barber']} />}>
          <Route path="/minha-agenda" element={<BarberDashboard />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
