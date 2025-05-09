import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
  background: var(--background);
`;

const Card = styled(motion.div)`
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.h1`
  font-size: 2rem;
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
        
        if (!token) {
          setError('Отсутствует токен авторизации');
          setLoading(false);
          return;
        }
        
        // Если пользователь уже авторизован, просто перенаправляем
        if (isAuthenticated) {
          navigate(redirectPath);
          return;
        }
        
        // Отправляем запрос к API для получения данных пользователя
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/${token}`);
        const data = await response.json();
        
        if (!data.success) {
          setError(data.message || 'Ошибка авторизации');
          setLoading(false);
          return;
        }
        
        // Авторизуем пользователя в системе
        const authResult = telegramAuth(data.user);
        
        if (authResult) {
          // Перенаправляем на указанную страницу
          navigate(redirectPath);
        } else {
          setError('Не удалось выполнить вход. Попробуйте снова.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при обработке авторизации:', err);
        setError('Произошла ошибка при обработке авторизации');
        setLoading(false);
      }
    };
    
    processAuth();
  }, [location.search, navigate, telegramAuth, isAuthenticated]);
  
  return (
    <Container>
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