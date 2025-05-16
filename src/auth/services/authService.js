import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Класс для работы с API аутентификации
class AuthService {
  // Локальное хранилище - используем единые ключи
  static ACCESS_TOKEN_KEY = 'access_token';
  static REFRESH_TOKEN_KEY = 'refresh_token';
  static USER_KEY = 'user_data';
  
  // HTTP клиент
  _api = axios.create({
    baseURL: `${API_URL}/auth`,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Интерцептор для добавления токена в заголовки
  constructor() {
    this._api.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Интерцептор для обработки ошибок токена
    this._api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Если ошибка не 401 или запрос уже был повторен, пробрасываем ошибку
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }
        
        originalRequest._retry = true;
        
        try {
          // Пробуем обновить токен
          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.logout();
            return Promise.reject(new Error('Нет токена обновления'));
          }
          
          const response = await this._api.post('/refresh', { refreshToken });
          
          // Сохраняем новые токены
          this.setTokens(response.data.tokens.access, response.data.tokens.refresh);
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${response.data.tokens.access}`;
          return axios(originalRequest);
        } catch (e) {
          // Если не удалось обновить токен, разлогиниваем пользователя
          this.logout();
          return Promise.reject(e);
        }
      }
    );
  }
  
  // Получение токенов из localStorage
  getAccessToken() {
    return localStorage.getItem(AuthService.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken() {
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }
  
  // Сохранение токенов
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(AuthService.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, refreshToken);
  }
  
  // Получение данных пользователя
  getUser() {
    const userData = localStorage.getItem(AuthService.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  
  // Сохранение данных пользователя
  setUser(user) {
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
    // Вызываем кастомное событие для уведомления о смене статуса авторизации
    try {
      // Используем setTimeout, чтобы гарантировать выполнение после обновления localStorage
      setTimeout(() => {
        window.dispatchEvent(new Event('auth-changed'));
        console.log('Событие auth-changed отправлено из authService.setUser');
      }, 0);
    } catch (e) {
      console.error('Ошибка при отправке события auth-changed:', e);
    }
  }
  
  // Очистка данных авторизации
  clearAuth() {
    // Очищаем все релевантные ключи из localStorage
    localStorage.removeItem(AuthService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
    
    // Очищаем также ключи используемые в старом контексте (для совместимости)
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_expiry');
    localStorage.removeItem('user');
    
    // Уведомляем об изменении статуса авторизации
    setTimeout(() => {
      window.dispatchEvent(new Event('auth-changed'));
      console.log('Событие auth-changed отправлено из authService.clearAuth');
    }, 0);
  }
  
  // Методы API
  async getProfile() {
    const response = await this._api.get('/me');
    if (response.data.success) {
      this.setUser(response.data.user);
    }
    return response.data;
  }
  
  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    // Проверяем наличие токена и данных пользователя
    const token = this.getAccessToken() || localStorage.getItem('auth_token');
    const user = this.getUser();
    
    console.log('Проверка авторизации:', !!token, !!user);
    
    return !!(token && user);
  }
}

// Создаем и экспортируем экземпляр сервиса
export const authService = new AuthService(); 