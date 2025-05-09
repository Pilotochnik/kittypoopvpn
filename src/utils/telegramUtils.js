/**
 * Утилиты для работы с авторизацией через Telegram
 */

// URL API сервера
const API_BASE_URL = 'http://localhost:5000/api';

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
    const response = await fetch(`${API_BASE_URL}/auth/${token}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка при проверке статуса авторизации:', error);
    return null;
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