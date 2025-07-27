import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- Garanta que esta linha existe
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>''
      <App />
    </AuthProvider>
  </React.StrictMode>
);