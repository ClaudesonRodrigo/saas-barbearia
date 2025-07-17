// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// A LINHA QUE PROVAVELMENTE FALTOU:
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 👇 Para esta linha funcionar... */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
