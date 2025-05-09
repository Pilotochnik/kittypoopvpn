import React, { createContext, useState, useEffect, useContext } from 'react';
import { verifyTelegramData, formatTelegramUserData } from '../utils/telegramUtils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Константы для взаимодействия с Telegram
const TELEGRAM_BOT_USERNAME = 'Kittypoopvpn_bot';
const TELEGRAM_BOT_TOKEN_PART = '7651266107'; // Только первая часть токена для проверки на клиенте

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь в localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Ошибка при чтении данных пользователя из localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Функция для входа через email и пароль
  const login = async (email, password) => {
    // Здесь будет API запрос на авторизацию
    // Имитация успешного входа
    const userData = { 
      id: '1', 
      email, 
      name: 'Пользователь',
      isAdmin: false 
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // Функция для регистрации
  const register = async (email, password, name) => {
    // Здесь будет API запрос на регистрацию
    // Имитация успешной регистрации
    const userData = { 
      id: '1', 
      email, 
      name,
      isAdmin: false 
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // Функция для Telegram аутентификации
  const telegramAuth = (telegramData) => {
    console.log('=== TELEGRAM AUTH DEBUGGING ===');
    console.log('Получены данные от виджета Telegram Login:', JSON.stringify(telegramData, null, 2));
    setAuthError(null);
    
    try {
      // Проверяем наличие необходимых данных
      if (!telegramData) {
        const errorMsg = 'Ошибка: данные от Telegram отсутствуют';
        console.error(errorMsg);
        setAuthError(errorMsg);
        return null;
      }
      
      // Проверяем подлинность данных
      const isVerified = verifyTelegramData(telegramData, TELEGRAM_BOT_TOKEN_PART);
      if (!isVerified) {
        const errorMsg = 'Ошибка: не удалось подтвердить подлинность данных Telegram';
        console.error(errorMsg);
        setAuthError(errorMsg);
        return null;
      }
      
      console.log('ID пользователя Telegram:', telegramData.id);
      console.log('Имя пользователя:', telegramData.first_name || 'Не указано');
      
      // Форматируем данные пользователя для сохранения
      const userData = formatTelegramUserData(telegramData);
      userData.isAdmin = false; // Устанавливаем права доступа
      
      console.log('Подготовленные данные пользователя:', JSON.stringify(userData, null, 2));
      
      // Сохраняем в стейт и localStorage
      console.log('Сохранение данных пользователя в стейт...');
      setUser(userData);
      
      console.log('Сохранение данных пользователя в localStorage...');
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Авторизация через Telegram успешно завершена');
      return userData;
    } catch (error) {
      const errorMsg = `Произошла ошибка при Telegram авторизации: ${error.message || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      console.error('Стек ошибки:', error.stack);
      setAuthError(errorMsg);
      return null;
    }
  };

  // Выход из аккаунта
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    authError,
    login,
    register,
    telegramAuth,
    logout,
    isAuthenticated: !!user,
    TELEGRAM_BOT_USERNAME
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 