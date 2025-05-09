import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { createTelegramDeepLink, checkAuthStatus } from '../utils/telegramUtils';

const TelegramContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
  max-width: 300px;
`;

const TelegramDirectLink = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #2AABEE;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  margin-top: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(42, 171, 238, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(42, 171, 238, 0.3);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const LoadingIndicator = styled.div`
  margin-top: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--accent-color);
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Компонент для интеграции с Telegram Login
const TelegramLoginButton = () => {
  const { telegramAuth, authError, TELEGRAM_BOT_USERNAME } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState(uuidv4()); // Генерируем токен сразу при загрузке
  const [loading, setLoading] = useState(false);
  
  // Обработка ошибок авторизации
  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }, [authError]);

  // Обновляем токен каждый раз когда компонент монтируется и устанавливаем интервал проверки
  useEffect(() => {
    const newToken = uuidv4();
    setAuthToken(newToken);
    
    // Сохраняем токен в localStorage для проверки позже
    localStorage.setItem('telegram_auth_token', newToken);
    
    // Устанавливаем интервал для проверки авторизации на сервере
    const checkInterval = setInterval(async () => {
      try {
        // Проверяем статус авторизации на сервере
        const userData = await checkAuthStatus(newToken);
        if (userData) {
          console.log('Получены данные авторизации с сервера:', userData);
          setLoading(true);
          
          // Вызываем авторизацию
          const authResult = telegramAuth(userData);
          if (authResult) {
            navigate('/dashboard');
          } else {
            setError('Не удалось выполнить вход. Попробуйте снова.');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Ошибка при проверке статуса авторизации:', err);
        setLoading(false);
      }
    }, 3000);
    
    return () => clearInterval(checkInterval);
  }, [telegramAuth, navigate]);
  
  // Создаем URL для прямой авторизации через Telegram
  const getTelegramAuthUrl = () => {
    return createTelegramDeepLink(TELEGRAM_BOT_USERNAME, authToken);
  };

  return (
    <TelegramContainer>
      {loading && <LoadingIndicator>Выполняется вход...</LoadingIndicator>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <TelegramDirectLink href={getTelegramAuthUrl()} target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
          <path d="M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M17.7,8.3c-0.2,2-1.1,6.8-1.5,9.1c-0.2,1-0.7,1.3-1.1,1.4 c-0.9,0.1-1.6-0.6-2.5-1.2c-1.4-0.9-2.2-1.4-3.5-2.3c-1.6-1-0.5-1.6,0.3-2.5c0.2-0.2,4.2-3.8,4.3-4.1c0-0.1,0-0.2-0.1-0.2 c-0.2-0.1-0.4,0-0.5,0c-0.2,0-3.8,2.4-5.4,3.5c-0.5,0.3-1,0.5-1.7,0.5c-0.6,0-1.6-0.2-2.4-0.6c-1-0.4-1.8-0.6-1.7-1.2 c0-0.3,0.4-0.6,1.1-0.9c4.2-1.8,7-3,8.4-3.6c4-1.5,4.8-1.8,5.4-1.8c0.1,0,0.4,0,0.5,0.1c0.2,0.1,0.3,0.2,0.3,0.3 C17.8,7.8,17.8,8,17.7,8.3z"/>
        </svg>
        Войти через Telegram
      </TelegramDirectLink>
    </TelegramContainer>
  );
};

export default TelegramLoginButton; 