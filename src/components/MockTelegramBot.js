import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { extractAuthToken, formatTelegramUserData, handleQRAuthCallback } from '../utils/telegramUtils';

const BotContainer = styled(motion.div)`
  position: fixed;
  bottom: 70px;
  right: 20px;
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 20px;
  width: 350px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 1000;
  overflow: hidden;
`;

const BotHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
  }
  
  .info {
    flex: 1;
    
    h3 {
      margin: 0;
      font-size: 16px;
    }
    
    span {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
  
  .close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    
    &:hover {
      color: var(--text-color);
    }
  }
`;

const BotContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--accent-color);
    border-radius: 5px;
  }
  
  .message {
    padding: 10px 15px;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    color: var(--text-color);
    font-size: 14px;
    align-self: flex-start;
    max-width: 85%;
  }
  
  .user-message {
    align-self: flex-end;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    color: white;
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  
  input {
    flex: 1;
    padding: 10px 15px;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
  
  button {
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    border: none;
    border-radius: 20px;
    color: white;
    padding: 10px 15px;
    cursor: pointer;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ToggleButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  border: none;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const AuthButton = styled.button`
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background: linear-gradient(45deg, #0088cc, #00aaff);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.4);
  }
`;

// Демонстрационный компонент для имитации Telegram-бота
const MockTelegramBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Привет! Я бот KittyPoopVPN. Отправь мне команду или QR-код для авторизации.', isUser: false }
  ]);
  const [processingAuth, setProcessingAuth] = useState(false);
  
  // Эмуляция пользователя Telegram
  const mockUser = {
    id: 12345678,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    photo_url: 'https://telegram.org/img/t_logo.png',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'mock_hash_for_testing_purposes_only_123456789abcdef'
  };
  
  // Обработка входящих сообщений
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Добавляем сообщение пользователя
    const userMessage = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Обработка команды
    processCommand(input);
    
    // Очищаем поле ввода
    setInput('');
  };
  
  // Обработка команд
  const processCommand = (command) => {
    // Проверяем, является ли это командой авторизации
    const authToken = extractAuthToken(command);
    
    if (authToken) {
      // Это команда авторизации, обрабатываем токен
      setProcessingAuth(true);
      
      // Добавляем сообщение от бота
      setTimeout(() => {
        const botResponse = { 
          id: Date.now(), 
          text: 'Выполняю авторизацию...', 
          isUser: false 
        };
        setMessages(prev => [...prev, botResponse]);
        
        // Эмулируем задержку обработки
        setTimeout(() => {
          // Обновляем метку времени для auth_date
          const updatedUser = {
            ...mockUser,
            auth_date: Math.floor(Date.now() / 1000)
          };
          
          // Вызываем функцию обработки авторизации
          const success = handleQRAuthCallback(authToken, updatedUser);
          
          // Добавляем сообщение об успехе или неудаче
          const resultMessage = { 
            id: Date.now() + 1, 
            text: success 
              ? 'Авторизация успешна! Вы можете вернуться в приложение.' 
              : 'Не удалось выполнить авторизацию. Возможно, токен устарел или недействителен.',
            isUser: false 
          };
          
          setMessages(prev => [...prev, resultMessage]);
          setProcessingAuth(false);
        }, 1500);
      }, 500);
    } else if (command.startsWith('/start')) {
      // Обычная команда start
      const botResponse = { 
        id: Date.now(), 
        text: 'Добро пожаловать! Я бот KittyPoopVPN. Чтобы авторизоваться, отсканируйте QR-код в приложении или отправьте мне команду авторизации.', 
        isUser: false 
      };
      setMessages(prev => [...prev, botResponse]);
    } else {
      // Другие команды
      const botResponse = { 
        id: Date.now(), 
        text: 'Извините, я не понимаю эту команду. Попробуйте отсканировать QR-код для авторизации.', 
        isUser: false 
      };
      setMessages(prev => [...prev, botResponse]);
    }
  };
  
  // Функция для эмуляции авторизации при нажатии кнопки
  const handleSimulateAuth = () => {
    // Получаем сохраненный токен из localStorage
    const authToken = localStorage.getItem('telegram_auth_token');
    
    if (authToken) {
      // Формируем команду авторизации
      const authCommand = `/start auth_${authToken}`;
      setInput(authCommand);
      
      // Автоматически отправляем сообщение через небольшую задержку
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    } else {
      // Если нет активного токена
      const botResponse = { 
        id: Date.now(), 
        text: 'Нет активного QR-кода для авторизации. Откройте QR-код в приложении и попробуйте снова.', 
        isUser: false 
      };
      setMessages(prev => [...prev, botResponse]);
    }
  };
  
  // Обработка нажатия Enter в поле ввода
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <>
      <ToggleButton
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span role="img" aria-label="bot">🤖</span>
      </ToggleButton>
      
      {isOpen && (
        <BotContainer
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <BotHeader>
            <div className="avatar">KP</div>
            <div className="info">
              <h3>KittyPoopVPNBot</h3>
              <span>Онлайн</span>
            </div>
            <button className="close" onClick={() => setIsOpen(false)}>✕</button>
          </BotHeader>
          
          <BotContent>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`message ${msg.isUser ? 'user-message' : ''}`}
              >
                {msg.text}
              </div>
            ))}
          </BotContent>
          
          <InputArea>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              disabled={processingAuth}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || processingAuth}
            >
              Отправить
            </button>
          </InputArea>
          
          <AuthButton onClick={handleSimulateAuth} disabled={processingAuth}>
            Эмулировать авторизацию по QR-коду
          </AuthButton>
        </BotContainer>
      )}
    </>
  );
};

export default MockTelegramBot; 