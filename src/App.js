// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importe as páginas UMA VEZ CADA:
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';

// O "porteiro" que protege as rotas
const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <h1>Carregando...</h1>;
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
        <Route path="/" element={<h1>Página Inicial Pública</h1>} />
        <Route path="/agendar/:slug" element={<BookingPage />} />

        {/* Rota Protegida do Super Admin */}
        <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
        </Route>
        
        {/* Rota Protegida do Dono da Barbearia */}
        <Route element={<PrivateRoute allowedRoles={['shopOwner']} />}>
          <Route path="/dashboard" element={<ShopOwnerDashboard />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;