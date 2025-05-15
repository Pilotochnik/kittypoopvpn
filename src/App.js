import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Подключаем новый контекст аутентификации
import { useAuth } from './context/AuthContext';

// Страницы
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyKeysPage from './pages/MyKeysPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import PaymentPage from './pages/PaymentPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';

// Компоненты
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './auth/components/ProtectedRoute';
import FloatingElements from './components/FloatingElements';

import './App.css';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  // Отслеживаем изменения в авторизации
  useEffect(() => {
    console.log('[App] Статус авторизации:', isAuthenticated ? 'Авторизован' : 'Не авторизован');
    if (isAuthenticated && user) {
      console.log('[App] Данные пользователя загружены:', user);
    }
  }, [isAuthenticated, user]);
  
  // Обработчик открытия/закрытия сайдбара
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="app">
      <FloatingElements />
      
      {/* Отладочная информация */}
      {/* <AuthDebugger /> */}
      
      {/* Шапка сайта */}
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Боковое меню */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Переключатель темы */}
      {/* <ThemeToggle /> */}
      
      {/* Основное содержимое */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/telegram" element={<LoginPage />} />
            <Route path="/auth-success" element={<AuthSuccessPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/faq" element={<FAQPage />} />
            
            {/* Защищенные маршруты */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-keys" element={<MyKeysPage />} />
              
              {/* Административный маршрут */}
              <Route 
                path="/admin" 
                element={
                  user && user.isAdmin 
                    ? <AdminPage /> 
                    : <Navigate to="/" replace />
                } 
              />
            </Route>
            
            {/* Перенаправление на login для неавторизованных пользователей */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      {/* Контейнер для уведомлений */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default App;