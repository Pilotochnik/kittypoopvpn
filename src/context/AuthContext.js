import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyTelegramData, formatTelegramUserData } from '../utils/telegramUtils';

// Создаем контекст авторизации
const AuthContext = createContext();

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// Константы для хранения токенов
const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Имя бота Telegram - должно совпадать с тем, что настроено на сервере
const TELEGRAM_BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'Kittypoopvpn_bot';
// Первая часть токена бота для проверки хэша - должна совпадать с тем, что настроено на сервере
const TELEGRAM_BOT_TOKEN_PART = process.env.REACT_APP_TELEGRAM_BOT_TOKEN_PART || '7651266107';

// Провайдер контекста авторизации
export const AuthProvider = ({ children }) => {
  // Состояния
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  
  // Проверка и загрузка сохраненных данных при инициализации
  useEffect(() => {
    const initializeAuth = () => {
      try {
        setLoading(true);
        
        // Получаем сохраненный токен и проверяем его срок действия
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (savedToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10);
          const now = Date.now();
          
          // Если токен еще действителен, используем его
          if (expiryTime > now) {
            setToken(savedToken);
            if (savedRefreshToken) {
              setRefreshToken(savedRefreshToken);
            }
            
            // Загружаем данные пользователя
            const savedUser = localStorage.getItem(USER_STORAGE_KEY);
            if (savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
              } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e);
                resetAuth();
              }
            }
          } else {
            // Токен просрочен, пробуем обновить его с refresh token
            if (savedRefreshToken) {
              refreshAccessToken(savedRefreshToken);
            } else {
              resetAuth();
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при инициализации аутентификации:', error);
        resetAuth();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Очистка данных аутентификации
  const resetAuth = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  };
  
  // Функция для обновления токена
  const refreshAccessToken = async (refreshTokenValue) => {
    try {
      // TODO: Реализовать API для обновления токена
      // Заглушка для демонстрации
      console.log('Попытка обновления токена с помощью:', refreshTokenValue);
      
      // Имитация запроса к API
      // В реальном приложении здесь должен быть запрос к API
      setTimeout(() => {
        // Эмулируем успешное обновление
        const newToken = 'new_token_' + Date.now();
        const newRefreshToken = 'new_refresh_' + Date.now();
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
        
        // Сохраняем новые токены
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        
        // Загружаем данные пользователя
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Ошибка при обновлении токена:', error);
      resetAuth();
      setLoading(false);
    }
  };
  
  // Сохранение токена и пользователя после успешной аутентификации
  const saveAuthData = (userData, tokenValue, refreshTokenValue, expiresIn = 24) => {
    try {
      // Вычисляем время истечения токена
      const expiryTime = Date.now() + expiresIn * 60 * 60 * 1000;
      
      // Сохраняем токены и данные пользователя
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenValue);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      
      // Обновляем состояние
      setToken(tokenValue);
      setRefreshToken(refreshTokenValue);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении данных аутентификации:', error);
      return false;
    }
  };
  
  // Функция для стандартного входа (эмуляция)
  const login = async (credentials) => {
    try {
      // Имитация запроса к API
      // В реальном приложении здесь должен быть запрос к API
      setTimeout(() => {
        const mockUser = { id: 'user123', name: 'Тестовый пользователь' };
        const mockToken = 'token_' + Date.now();
        const mockRefreshToken = 'refresh_' + Date.now();
        
        saveAuthData(mockUser, mockToken, mockRefreshToken);
      }, 1000);
      
      return true;
    } catch (error) {
      setAuthError('Ошибка входа: ' + (error.message || 'Неизвестная ошибка'));
      return false;
    }
  };
  
  // Функция для регистрации (эмуляция)
  const register = async (userData) => {
    try {
      // Имитация запроса к API
      // В реальном приложении здесь должен быть запрос к API
      setTimeout(() => {
        const mockUser = { id: 'user123', name: userData.name };
        const mockToken = 'token_' + Date.now();
        const mockRefreshToken = 'refresh_' + Date.now();
        
        saveAuthData(mockUser, mockToken, mockRefreshToken);
      }, 1000);
      
      return true;
    } catch (error) {
      setAuthError('Ошибка регистрации: ' + (error.message || 'Неизвестная ошибка'));
      return false;
    }
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
      
      // Генерируем токены для аутентификации
      const mockToken = 'telegram_token_' + Date.now();
      const mockRefreshToken = 'telegram_refresh_' + Date.now();
      
      // Сохраняем данные пользователя и токены
      saveAuthData(userData, mockToken, mockRefreshToken);
      
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
    resetAuth();
  };

  // Проверка наличия токена для API запросов
  const getAuthHeader = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const value = {
    user,
    loading,
    authError,
    login,
    register,
    telegramAuth,
    logout,
    getAuthHeader,
    isAuthenticated: !!user && !!token,
    TELEGRAM_BOT_USERNAME
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 