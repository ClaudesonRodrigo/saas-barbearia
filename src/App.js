import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Já criamos este

// Importe suas páginas
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LoginPage from './pages/LoginPage'; // (Precisamos criar uma LoginPage básica)

// Componente para proteger rotas
const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    // Se não está logado, manda para o login
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Se está logado mas não tem a permissão, manda para uma página de "não autorizado" ou para a home
    return <Navigate to="/" />; // Ou uma página <NotAuthorized />
  }

  // Se passou em tudo, renderiza a página filha
  return <Outlet />;
};


function App() {
  return (
    // Envolvemos tudo no AuthProvider
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<h1>Página Inicial Pública</h1>} /> {/* Página de marketing, por exemplo */}

          {/* Rotas de Super Admin */}
          <Route element={<PrivateRoute allowedRoles={['superAdmin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            {/* Outras rotas de super admin aqui dentro */}
          </Route>
          
          {/* Aqui entrarão as rotas do Dono da Barbearia e do Cliente no futuro */}

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
