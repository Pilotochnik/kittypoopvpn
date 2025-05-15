import React from 'react';
import ReactDOM from 'react-dom/client';
import './setupPolyfills';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GlobalStyle from './styles/GlobalStyle';

// Мок-сервер для тестирования ОТКЛЮЧЁН. Все запросы идут на реальный backend.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GlobalStyle />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
); 