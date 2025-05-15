import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyTelegramData, formatTelegramUserData } from '../utils/telegramUtils';
import { logAuthDebug } from '../utils/authDebugLogger';

// Создаем контекст авторизации
const AuthContext = createContext();

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// Константы для хранения токенов
const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const REFRESH_TOKEN_KEY = 'refresh_token';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://134.209.91.29/api';

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
        // ЛОГИРУЕМ содержимое localStorage для отладки
        const storageSnapshot = {
          auth_token: localStorage.getItem(TOKEN_STORAGE_KEY),
          user: localStorage.getItem(USER_STORAGE_KEY),
          auth_token_expiry: localStorage.getItem(TOKEN_EXPIRY_KEY),
          refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY),
        };
        console.log('[AuthContext] localStorage:', storageSnapshot);
        logAuthDebug('AuthContext: localStorage при инициализации', storageSnapshot);
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
                console.log('[AuthContext] parsedUser:', parsedUser);
                logAuthDebug('AuthContext: parsedUser', parsedUser);
                setUser(parsedUser);
              } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e, savedUser);
                logAuthDebug('AuthContext: ошибка парсинга пользователя', { error: e.message, savedUser });
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
        logAuthDebug('AuthContext: ошибка инициализации', { error: error.message });
        resetAuth();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    // Добавляю слушатель на событие 'auth-changed'
    const handleAuthChanged = () => {
      initializeAuth();
    };
    window.addEventListener('auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
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
    logAuthDebug('AuthContext: resetAuth вызван, авторизация сброшена');
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
  
  // Получить профиль пользователя
  const fetchProfile = async (tokenValue) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + tokenValue }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка профиля');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      setUser(data);
      return data;
    } catch (e) {
      resetAuth();
      throw e;
    }
  };
  
  // Автоматическая авторизация при наличии токена
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken).catch(() => {});
    }
    setLoading(false);
  }, []);
  
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
    getAuthHeader,
    isAuthenticated: !!user && !!token,
    TELEGRAM_BOT_USERNAME,
    logout: resetAuth
  };

  useEffect(() => {
    const logState = (where) => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const accessToken = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      logAuthDebug(`[AuthContext][${where}]`, {
        auth_token: savedToken,
        user: savedUser,
        access_token: accessToken,
        user_data: userData,
        isAuthenticated: !!user && !!token,
        loading
      });
    };
    logState('init');
  }, []);

  useEffect(() => {
    const logState = (where) => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const accessToken = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      logAuthDebug(`[AuthContext][${where}]`, {
        auth_token: savedToken,
        user: savedUser,
        access_token: accessToken,
        user_data: userData,
        isAuthenticated: !!user && !!token,
        loading
      });
    };
    logState('user/token/loading changed');
  }, [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 