import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logAuthDebug } from '../utils/authDebugLogger';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const TelegramLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [polling, setPolling] = useState(false);
  const checkIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Генерация токена и запуск процесса авторизации
  const startTelegramAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Получаем ссылку и токен с бэка
      const res = await fetch(`${API_URL}/auth/telegram/auth`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Ошибка генерации ссылки');
      setAuthToken(data.authToken);
      // Инициализируем токен на сервере
      await fetch(`${API_URL}/auth/telegram/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.authToken })
      });
      // Открываем Telegram deep link
      window.open(data.telegramUrl, '_blank');
      setPolling(true);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  // Polling статуса авторизации
  useEffect(() => {
    if (!polling || !authToken) return;
    checkIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/telegram/status?token=${authToken}`);
        const data = await res.json();
        console.log('[TelegramLoginButton] Ответ от backend:', data);
        logAuthDebug('Ответ от backend (polling)', data);
        if (data.success && data.token && data.user) {
          console.log('[TelegramLoginButton] Успешный ответ от backend:', data);
          logAuthDebug('Успешная авторизация через Telegram', data);
          // Для старого AuthContext
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem('auth_token_expiry', expiry.toString());
          localStorage.setItem('refresh_token', '');

          // Для нового AuthContext (authService)
          localStorage.setItem('access_token', data.token);
          localStorage.setItem('user_data', JSON.stringify(data.user));

          // Логируем содержимое localStorage после записи
          const storageSnapshot = {
            auth_token: localStorage.getItem('auth_token'),
            user: localStorage.getItem('user'),
            access_token: localStorage.getItem('access_token'),
            user_data: localStorage.getItem('user_data'),
            auth_token_expiry: localStorage.getItem('auth_token_expiry'),
            refresh_token: localStorage.getItem('refresh_token'),
          };
          console.log('[TelegramLoginButton] localStorage после записи:', storageSnapshot);
          logAuthDebug('localStorage после записи (polling)', storageSnapshot);

          if (data.user && data.user.isAdmin && data.user.telegramId) {
            localStorage.setItem('admin_telegram_id', data.user.telegramId);
          }

          clearInterval(checkIntervalRef.current);
          setPolling(false);
          setLoading(false);
          window.dispatchEvent(new Event('auth-changed'));
          toast.success('Успешная авторизация через Telegram!');
          navigate('/profile');
        }
      } catch (e) {
        // Игнорируем ошибки polling
        logAuthDebug('Ошибка polling TelegramLoginButton', { error: e.message });
      }
    }, 2000);
    return () => clearInterval(checkIntervalRef.current);
  }, [polling, authToken, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={startTelegramAuth} disabled={loading} style={{ padding: '12px 24px', fontSize: '1.1rem', borderRadius: 8, background: '#24a1de', color: '#fff', border: 'none', cursor: 'pointer' }}>
        {loading ? 'Ожидание подтверждения...' : 'Войти через Telegram'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
};

export default TelegramLoginButton; 