import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  position: relative;
`;

const Card = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 50px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Message = styled.p`
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  font-size: 0.95rem;
`;

const AnimatedEmoji = styled(motion.div)`
  position: absolute;
  font-size: 3.5rem;
  z-index: 10;
  pointer-events: none;
`;

const AuthSuccessPage = () => {
  const { telegramAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // Получаем параметры из URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const redirectPath = params.get('redirect') || '/profile';
        
        console.log('Процесс авторизации. Токен:', token, 'Redirect:', redirectPath);
        
        if (!token) {
          setError('Отсутствует токен авторизации');
          setLoading(false);
          return;
        }
        
        // Если пользователь уже авторизован, просто перенаправляем
        if (isAuthenticated) {
          console.log('Пользователь уже авторизован, перенаправление на:', redirectPath);
          navigate(redirectPath);
          return;
        }
        
        // Отправляем запрос к API для получения данных пользователя
        const apiUrl = `${process.env.REACT_APP_API_URL || 'http://134.209.91.29/api'}/auth/${token}`;
        console.log('Отправка запроса к API:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        console.log('Ответ API:', data);
        
        if (!data.success) {
          setError(data.message || 'Ошибка авторизации');
          setLoading(false);
          return;
        }
        
        // Авторизуем пользователя в системе
        console.log('Вызов telegramAuth с данными пользователя:', data.user);
        const authResult = telegramAuth(data.user);
        
        if (authResult) {
          console.log('Авторизация успешна, перенаправление на:', redirectPath);
          // Перенаправляем на указанную страницу
          navigate(redirectPath);
        } else {
          console.error('telegramAuth вернул falsy значение');
          setError('Не удалось выполнить вход. Попробуйте снова.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при обработке авторизации:', err);
        setError(`Произошла ошибка при обработке авторизации: ${err.message || 'Неизвестная ошибка'}`);
        setLoading(false);
      }
    };
    
    processAuth();
  }, [location.search, navigate, telegramAuth, isAuthenticated]);
  
  return (
    <Container>
      {/* Анимированные emoji вокруг блока */}
      <AnimatedEmoji
        initial={{ x: -120, y: -60, rotate: -20 }}
        animate={{ x: 0, y: 0, rotate: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ top: 30, left: 30 }}
      >😺</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ x: 120, y: -40, rotate: 20 }}
        animate={{ x: 0, y: 0, rotate: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ top: 40, right: 40 }}
      >💩</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ y: 80, scale: 1 }}
        animate={{ y: 100, scale: 1.2 }}
        transition={{ duration: 1.7, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ bottom: 60, left: 80 }}
      >🔒</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ y: 120, scale: 1 }}
        animate={{ y: 80, scale: 1.1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ bottom: 40, right: 100 }}
      >🐾</AnimatedEmoji>
      {/* Дополнительные emoji для большего интерактива */}
      <AnimatedEmoji
        initial={{ x: -80, y: 0, rotate: 0 }}
        animate={{ x: 20, y: 20, rotate: 10 }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ top: 120, left: 10 }}
      >😻</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ x: 80, y: 0, rotate: 0 }}
        animate={{ x: -20, y: 20, rotate: -10 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ top: 120, right: 10 }}
      >💩</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ x: 0, y: 30, scale: 1.2 }}
        transition={{ duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ bottom: 10, left: 180 }}
      >🐱</AnimatedEmoji>
      <AnimatedEmoji
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{ x: 0, y: -30, scale: 1.1 }}
        transition={{ duration: 2.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ bottom: 10, right: 180 }}
      >💩</AnimatedEmoji>
      {/* Основной блок авторизации */}
      <Card
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Авторизация через Telegram</Title>
        {loading ? (
          <>
            <Message>Обрабатываем данные авторизации...</Message>
            <LoadingSpinner />
          </>
        ) : error ? (
          <>
            <Message>Не удалось завершить авторизацию</Message>
            <ErrorMessage>{error}</ErrorMessage>
          </>
        ) : null}
      </Card>
    </Container>
  );
};

export default AuthSuccessPage; 