import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from './context/AuthContext';

// Импорт компонентов
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import FAQPage from './pages/FAQPage';
import PaymentPage from './pages/PaymentPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import FloatingElements from './components/FloatingElements';
import MockTelegramBot from './components/MockTelegramBot';
import MyKeysPage from './pages/MyKeysPage';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background-color);
  position: relative;
`;

const Footer = styled.footer`
  background-color: var(--card-background);
  padding: 40px 0;
  margin-top: 60px;
`;

const FooterContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const FooterColumn = styled.div`
  flex: 1;
  min-width: 200px;
  margin-right: 20px;
  
  h3 {
    color: var(--text-color);
    margin-bottom: 20px;
    font-size: 1.2rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 10px;
      
      a {
        color: var(--text-secondary);
        text-decoration: none;
        transition: color 0.3s ease;
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
  
  p {
    color: var(--text-secondary);
    line-height: 1.6;
  }
`;

const Copyright = styled.div`
  text-align: center;
  padding-top: 40px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 40px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 20px;
  padding-right: 20px;
`;

// Компонент для отображения состояния авторизации - для отладки
const AuthDebugger = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Показываем только в режиме разработки
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '150px',
      overflow: 'auto'
    }}>
      <div><strong>Auth Debug:</strong></div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      {user && (
        <div>
          User: {user.name} (ID: {user.id})
          {user.telegramAuth && <div>via Telegram</div>}
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AppContainer>
      <FloatingElements />
      <Header />
      <AuthDebugger />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" />} />
        <Route path="/auth/telegram" element={<LoginPage />} />
        <Route path="/auth-success" element={<AuthSuccessPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<MyKeysPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      
      {/* Эмулятор Telegram-бота для тестирования авторизации по QR-коду */}
      <MockTelegramBot />
      
      <Footer>
        <FooterContent>
          <FooterColumn>
            <h3>Kitty Poop VPN</h3>
            <p>
              Безопасное и анонимное подключение к интернету с помощью нашего сервиса VPN.
              Мы обеспечиваем высокую скорость и защиту ваших данных.
            </p>
          </FooterColumn>
          
          <FooterColumn>
            <h3>Информация</h3>
            <ul>
              <li><a href="/about">О нас</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/blog">Блог</a></li>
              <li><a href="/support">Поддержка</a></li>
            </ul>
          </FooterColumn>
          
          <FooterColumn>
            <h3>Правовая информация</h3>
            <ul>
              <li><a href="/terms">Условия использования</a></li>
              <li><a href="/privacy">Политика конфиденциальности</a></li>
              <li><a href="/refund">Политика возврата</a></li>
            </ul>
          </FooterColumn>
          
          <FooterColumn>
            <h3>Свяжитесь с нами</h3>
            <ul>
              <li><a href="mailto:support@kittypoop.vpn">support@kittypoop.vpn</a></li>
              <li><a href="https://t.me/kittypoop_vpn">Telegram</a></li>
            </ul>
          </FooterColumn>
        </FooterContent>
        
        <Copyright>
          &copy; {new Date().getFullYear()} Kitty Poop VPN. Все права защищены.
        </Copyright>
      </Footer>
    </AppContainer>
  );
}

export default App;