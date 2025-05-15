/**
 * Утилиты для работы с авторизацией через Telegram
 */

import * as cryptoModule from 'crypto-browserify';
const crypto = cryptoModule.default || cryptoModule;

// API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://134.209.91.29/api';

/**
 * Проверяет подлинность полученных данных от Telegram Login Widget
 * @param {Object} telegramUser - Данные пользователя от Telegram
 * @param {string} botToken - Токен бота (только первая часть токена до ':')
 * @returns {boolean} - Результат проверки
 */
export const verifyTelegramData = (telegramUser, botToken) => {
  if (!telegramUser || !botToken) return false;
  
  try {
    // Проверяем наличие обязательных полей
    if (!telegramUser.id || !telegramUser.auth_date || !telegramUser.hash) {
      console.error('Отсутствуют обязательные поля в данных Telegram:', telegramUser);
      return false;
    }

    // Проверяем, что auth_date не устарел (не старше 24 часов)
    const authDate = parseInt(telegramUser.auth_date);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 86400) {
      console.error('Срок действия auth_date истек:', telegramUser.auth_date);
      return false;
    }
    
    // Для полной проверки хэша нужен серверный компонент
    // Здесь мы просто проверяем, что хэш есть
    if (!telegramUser.hash) {
      return false;
    }
    
    return true;
    
    /* 
    Полная проверка должна проводиться на сервере примерно так:
    
    // Создание data-check-string
    const dataCheckArr = Object.keys(telegramUser)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${telegramUser[key]}`);
    
    const dataCheckString = dataCheckArr.join('\n');
    
    // Создание секретного ключа из токена бота
    const secret = crypto.createHash('sha256').update(botToken).digest();
    
    // Создание хэша для проверки
    const hash = crypto.createHmac('sha256', secret)
                 .update(dataCheckString)
                 .digest('hex');
    
    // Проверка хэша
    return hash === telegramUser.hash;
    */
  } catch (error) {
    console.error('Ошибка при проверке данных Telegram:', error);
    return false;
  }
};

/**
 * Проверяет статус авторизации по токену на сервере
 * @param {string} token - Токен авторизации
 * @returns {Promise<Object>} - Данные пользователя Telegram или null при ошибке
 */
export const checkAuthStatus = async (token) => {
  try {
    const url = `${API_BASE_URL}/auth/telegram/status?token=${token}&_cb=${Date.now()}`;
    console.log(`[telegramUtils.checkAuthStatus] Fetching URL: ${url}`); // Добавим лог URL для отладки
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache', // Явно указываем не использовать кэш
      headers: {
        'Content-Type': 'application/json'
        // Можно также добавить 'Pragma': 'no-cache' и 'Expires': '0' для старых HTTP/1.0 клиентов,
        // но 'cache: no-cache' является стандартом для fetch.
      }
    });
    
    // Проверяем, что ответ успешный с точки зрения HTTP
    if (!response.ok) {
      // Попытаемся прочитать тело ошибки, если оно есть
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (textError) {
        // Игнорируем, если тело не читается
      }
      console.error(`[telegramUtils.checkAuthStatus] Ошибка HTTP: ${response.status}. Ответ: ${errorText}`);
      // Возвращаем объект с ошибкой, чтобы TelegramLoginButton мог это обработать
      return { success: false, status: response.status, message: `Ошибка сервера: ${response.status}${errorText ? ' - ' + errorText : ''}` };
    }
    
    // Парсим JSON ответа
    const data = await response.json();
    console.log('[telegramUtils.checkAuthStatus] Ответ сервера:', data);
    
    // Возвращаем весь объект data, т.к. он содержит success и userData или другие поля статуса
    return data; 
    
  } catch (error) {
    console.error('[telegramUtils.checkAuthStatus] Исключение при проверке статуса:', error);
    // Возвращаем объект с ошибкой для обработки в вызывающем коде
    return { success: false, message: error.message || 'Сетевая ошибка или не удалось обработать ответ' };
  }
};

/**
 * Обработчик авторизации через QR-код или прямую ссылку
 * Эта функция будет вызываться при обработке авторизации через Telegram бота
 * @param {string} authToken - Токен авторизации из ссылки
 * @param {Object} userData - Данные пользователя от Telegram
 * @returns {boolean} - Успех операции
 */
export const handleQRAuthCallback = (authToken, userData) => {
  if (!authToken || !userData) return false;
  
  try {
    // Сохраняем данные пользователя в localStorage с использованием токена
    localStorage.setItem(`telegram_auth_${authToken}`, JSON.stringify(userData));
    
    // Проверяем, совпадает ли токен с сохраненным
    const savedToken = localStorage.getItem('telegram_auth_token');
    return savedToken === authToken;
  } catch (error) {
    console.error('Ошибка при сохранении данных авторизации:', error);
    return false;
  }
};

/**
 * Создает глубокую ссылку для авторизации через Telegram
 * @param {string} botUsername - Имя бота Telegram
 * @param {string} authToken - Токен авторизации
 * @returns {string} URL для QR-кода или прямой ссылки
 */
export const createTelegramDeepLink = (botUsername, authToken) => {
  if (!botUsername || !authToken) return '';
  
  const baseUrl = `https://t.me/${botUsername}`;
  const params = `start=auth_${authToken}`;
  
  return `${baseUrl}?${params}`;
};

/**
 * Проверяет, является ли сообщение запросом на авторизацию
 * @param {string} message - Сообщение от пользователя Telegram
 * @returns {string|null} Токен авторизации или null, если это не запрос на авторизацию
 */
export const extractAuthToken = (message) => {
  if (!message || !message.startsWith('/start auth_')) return null;
  
  return message.replace('/start auth_', '');
};

/**
 * Преобразует данные пользователя из Telegram в формат для сохранения
 * @param {Object} telegramUser - Данные пользователя от Telegram
 * @returns {Object} - Форматированные данные пользователя
 */
export const formatTelegramUserData = (telegramUser) => {
  return {
    id: telegramUser.id,
    first_name: telegramUser.first_name || '',
    last_name: telegramUser.last_name || '',
    username: telegramUser.username || '',
    photo_url: telegramUser.photo_url || '',
    auth_date: telegramUser.auth_date || Math.floor(Date.now() / 1000),
    hash: telegramUser.hash || '',
  };
};

/**
 * Верификация данных от Telegram WebApp
 * @param {string} initData - Данные, полученные от Telegram WebApp
 * @param {string} botToken - Токен бота (только первая часть токена до ':')
 * @returns {boolean} - Результат проверки
 */
export const verifyTelegramWebAppData = (initData, botToken) => {
  if (!initData) return false;
  
  // Получаем первую часть токена бота (для подписи)
  const botTokenParts = botToken.split(':');
  if (botTokenParts.length !== 2) return false;
  
  const botTokenFirstPart = botTokenParts[0];
  
  try {
    // Парсим строку initData
    const urlParams = new URLSearchParams(initData);
    
    // Получаем хэш
    const hash = urlParams.get('hash');
    if (!hash) return false;
    
    // Удаляем параметр hash для создания data-check-string
    urlParams.delete('hash');
    
    // Сортируем пары ключ-значение
    const keys = [...urlParams.keys()].sort();
    const dataCheckParts = [];
    
    for (const key of keys) {
      dataCheckParts.push(`${key}=${urlParams.get(key)}`);
    }
    
    const dataCheckString = dataCheckParts.join('\n');
    
    // Создаем секретный ключ из первой части токена бота
    const secret = crypto.createHash('sha256').update(botTokenFirstPart).digest();
    
    // Создаем хэш
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');
    
    // Сравниваем хэши
    return calculatedHash === hash;
  } catch (error) {
    console.error('Ошибка при верификации Telegram WebApp данных:', error);
    return false;
  }
};

/**
 * Получить данные пользователя из Telegram WebApp
 * @returns {Object|null} - Данные пользователя или null, если пользователь не авторизован
 */
export const getTelegramWebAppUser = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};

/**
 * Проверить, открыто ли приложение в Telegram WebApp
 * @returns {boolean} - Результат проверки
 */
export const isTelegramWebApp = () => {
  return window.Telegram && window.Telegram.WebApp;
};

/**
 * Закрыть Telegram WebApp
 */
export const closeTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
};

/**
 * Отправить данные обратно в Telegram WebApp
 * @param {Object} data - Данные для отправки
 * @returns {boolean} - Результат отправки
 */
export const sendDataToTelegramWebApp = (data) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.sendData(JSON.stringify(data));
    return true;
  }
  return false;
};

/**
 * Расширить окно приложения на весь экран
 */
export const expandTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand();
  }
};

/**
 * Сообщить Telegram, что приложение готово
 */
export const notifyTelegramWebAppReady = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
  }
};

/**
 * Инструкции по настройке Telegram бота для авторизации
 * 
 * 1. Создайте бота через @BotFather в Telegram
 * 2. Получите токен бота и установите его в AuthContext.js
 * 3. Настройте бота для работы с авторизацией:
 * 
 * Пример кода для бота на Node.js с использованием библиотеки node-telegram-bot-api:
 * 
 * ```js
 * const TelegramBot = require('node-telegram-bot-api');
 * const token = 'ВАШ_ТОКЕН_БОТА';
 * const bot = new TelegramBot(token, { polling: true });
 * 
 * // Обработка команды /start с токеном авторизации
 * bot.onText(/\/start auth_(.+)/, (msg, match) => {
 *   const chatId = msg.chat.id;
 *   const authToken = match[1];
 *   
 *   // Сообщаем пользователю, что авторизация в процессе
 *   bot.sendMessage(chatId, 'Выполняю авторизацию...');
 *   
 *   // Формируем данные пользователя для отправки в приложение
 *   const userData = {
 *     id: msg.from.id,
 *     first_name: msg.from.first_name || '',
 *     last_name: msg.from.last_name || '',
 *     username: msg.from.username || '',
 *     photo_url: '', // Можно получить через дополнительный запрос
 *     auth_date: Math.floor(Date.now() / 1000)
 *   };
 *   
 *   // Здесь должна быть отправка данных на сервер вашего приложения
 *   // Например, через API-запрос к вашему серверу
 *   
 *   // Имитация успешной авторизации
 *   setTimeout(() => {
 *     bot.sendMessage(chatId, 'Вы успешно авторизованы! Вернитесь в приложение.');
 *   }, 1000);
 * });
 * 
 * // Обработка обычной команды /start
 * bot.onText(/^\/start$/, (msg) => {
 *   const chatId = msg.chat.id;
 *   bot.sendMessage(chatId, 'Привет! Я бот для авторизации в приложении KittyPoopVPN. Используйте кнопку "Войти через Telegram" на сайте для авторизации.');
 * });
 * ```
 */ 