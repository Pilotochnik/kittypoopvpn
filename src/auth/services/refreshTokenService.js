import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class RefreshTokenService {
  // Локальное хранилище
  static ACCESS_TOKEN_KEY = 'access_token';
  static REFRESH_TOKEN_KEY = 'refresh_token';
  
  // Флаг, указывающий, что токен обновляется
  isRefreshing = false;
  
  // Очередь ожидающих запросов
  refreshSubscribers = [];
  
  // Добавление колбэка в очередь
  onRefreshed = (accessToken) => {
    this.refreshSubscribers.forEach(callback => callback(accessToken));
    this.refreshSubscribers = [];
  };
  
  // Подписка на обновление токена
  subscribeTokenRefresh = (callback) => {
    this.refreshSubscribers.push(callback);
  };
  
  // Получение токенов из localStorage
  getAccessToken() {
    return localStorage.getItem(RefreshTokenService.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken() {
    return localStorage.getItem(RefreshTokenService.REFRESH_TOKEN_KEY);
  }
  
  // Сохранение токенов
  setTokens(accessToken, refreshToken) {
    localStorage.setItem(RefreshTokenService.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(RefreshTokenService.REFRESH_TOKEN_KEY, refreshToken);
  }
  
  // Очистка токенов
  clearTokens() {
    localStorage.removeItem(RefreshTokenService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(RefreshTokenService.REFRESH_TOKEN_KEY);
  }
  
  // Обновление токена
  async refreshToken() {
    // Если уже идет обновление, возвращаем Promise
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.subscribeTokenRefresh(token => resolve(token));
      });
    }
    
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('Нет refresh токена'));
    }
    
    this.isRefreshing = true;
    
    try {
      // Выполняем запрос на обновление токена
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      
      if (response.data.success) {
        const { access, refresh } = response.data.tokens;
        this.setTokens(access, refresh);
        
        // Уведомляем подписчиков
        this.onRefreshed(access);
        return access;
      } else {
        this.clearTokens();
        return Promise.reject(new Error('Не удалось обновить токен'));
      }
    } catch (error) {
      this.clearTokens();
      return Promise.reject(error);
    } finally {
      this.isRefreshing = false;
    }
  }
  
  // Настройка интерцептора для axios
  setupInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Если ошибка не 401 или запрос уже был повторен
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }
        
        originalRequest._retry = true;
        
        try {
          // Обновляем токен
          const newAccessToken = await this.refreshToken();
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Если не удалось обновить токен, разлогиниваем пользователя
          return Promise.reject(refreshError);
        }
      }
    );
  }
}

// Создаем и экспортируем экземпляр сервиса
export const refreshTokenService = new RefreshTokenService(); 