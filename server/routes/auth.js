const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Гарантируем, что глобальная карта токенов всегда определена (до router)
if (!global.authTokens) global.authTokens = new Map();

const router = express.Router();

// CORS middleware для поддержки нескольких origin
router.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const token = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
const botTokenFirstPart = token.split(':')[0] || '7651266107';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

// Генерация хэша для данных пользователя Telegram
const generateTelegramHash = (userData) => {
  // Создаем data-check-string
  const dataCheckArr = Object.keys(userData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${userData[key]}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  
  // Создаем секретный ключ из первой части токена бота
  const secret = crypto.createHash('sha256').update(botTokenFirstPart).digest();
  
  // Создаем хэш
  return crypto.createHmac('sha256', secret)
              .update(dataCheckString)
              .digest('hex');
};

// Маршрут для проверки статуса и финализации Telegram авторизации
router.get('/telegram/status', async (req, res) => {
  // Добавляем заголовки для предотвращения кеширования этого ответа
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Токен не предоставлен' });
  }

  console.log(`[API_TELEGRAM_STATUS_FINALIZED] Запрос на проверку и финализацию для токена: ${token}`);

  if (global.authTokens && global.authTokens.has(token)) {
    const userDataFromBot = global.authTokens.get(token); // Это данные, сохраненные ботом
    
    if (typeof userDataFromBot === 'object' && userDataFromBot !== null && userDataFromBot.id) {
      console.log(`[API_TELEGRAM_STATUS_FINALIZED] Токен ${token} валиден, данные от бота:`, userDataFromBot);
      try {
        // Ищем пользователя в базе по Telegram ID
        let user = await User.findOne({ telegramId: userDataFromBot.id });
        
        if (!user) {
          user = await User.create({
            telegramId: userDataFromBot.id,
            firstName: userDataFromBot.first_name,
            lastName: userDataFromBot.last_name,
            username: userDataFromBot.username,
            authDate: new Date(userDataFromBot.auth_date * 1000)
          });
          console.log(`[API_TELEGRAM_STATUS_FINALIZED] Создан новый пользователь для Telegram ID ${userDataFromBot.id}`);
        } else {
          user = await User.update(user.id, { // Предполагаем, что User.update возвращает обновленного пользователя
            firstName: userDataFromBot.first_name,
            lastName: userDataFromBot.last_name,
            username: userDataFromBot.username,
            lastLogin: new Date()
          });
          console.log(`[API_TELEGRAM_STATUS_FINALIZED] Обновлены данные пользователя с Telegram ID ${userDataFromBot.id}`);
        }
        
        // Удаляем токен после использования
        global.authTokens.delete(token);
        console.log(`[API_TELEGRAM_STATUS_FINALIZED] Токен ${token} удален.`);
        
        // Генерируем JWT
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({ 
          success: true, 
          user: { // Убедимся, что возвращаем все нужные поля для AuthContext
            id: user.id,
            telegramId: user.telegramId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email // Добавим email, если он есть и нужен
          },
          token: jwtToken
        });

      } catch (error) {
        console.error('[API_TELEGRAM_STATUS_FINALIZED] Ошибка при работе с БД или генерации JWT:', error);
        // Не удаляем токен в случае ошибки, чтобы дать шанс на повторную попытку (хотя фронт сейчас этого не делает)
        return res.status(500).json({ 
          success: false, 
          message: 'Внутренняя ошибка сервера при обработке авторизации'
        });
      }
    } else {
      console.log(`[API_TELEGRAM_STATUS_FINALIZED] Токен ${token} найден, но данные пользователя (userData) некорректны или еще не связаны.`);
      return res.json({ success: false, status: 'pending', message: 'Ожидание корректных данных от Telegram-бота' });
    }
  } else {
    console.log(`[API_TELEGRAM_STATUS_FINALIZED] Токен ${token} не найден или уже использован/истек.`);
    return res.json({ success: false, status: 'pending', message: 'Токен недействителен или сессия истекла.' });
  }
});

// Добавляем эндпоинт verify перед маршрутом с параметром
router.get('/verify', authMiddleware, (req, res) => {
  return res.status(200).json({ success: true });
});

// Получить профиль пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('Запрос профиля для id:', req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Пользователь не найден по id:', req.user.id);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      telegramId: user.telegramId
    });
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// API для получения данных пользователя по токену
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  console.log(`Получен запрос на проверку токена: ${token}`);
  
  if (global.authTokens && global.authTokens.has(token)) {
    const userData = global.authTokens.get(token);
    console.log(`Найдены данные пользователя для токена ${token}:`, userData);
    
    try {
      // Ищем пользователя в базе по Telegram ID
      let user = await User.findOne({ telegramId: userData.id });
      
      // Если пользователь не найден, создаем нового
      if (!user) {
        user = await User.create({
          telegramId: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          authDate: new Date(userData.auth_date * 1000)
        });
        console.log(`Создан новый пользователь для Telegram ID ${userData.id}`);
      } else {
        // Обновляем данные пользователя
        user = await User.update(user.id, {
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          lastLogin: new Date()
        });
        console.log(`Обновлены данные пользователя с Telegram ID ${userData.id}`);
      }
      
      // Удаляем токен после использования
      global.authTokens.delete(token);
      
      // Генерируем JWT для пользователя, вошедшего через Telegram
      const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      // Отправляем успешный ответ с данными пользователя и JWT токеном
      return res.json({ 
        success: true, 
        user: {
          id: user.id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        },
        token: jwtToken // Добавляем JWT токен в ответ
      });
    } catch (error) {
      console.error('Ошибка при сохранении/обновлении пользователя:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Внутренняя ошибка сервера при обработке авторизации'
      });
    }
  }
  
  return res.status(404).json({ success: false, message: 'Токен авторизации не найден или уже использован' });
});

// API для получения информации о текущем пользователе
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера при получении данных пользователя'
    });
  }
});

// Middleware для проверки JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

// Генерация ссылки для авторизации через Telegram-бота
router.get('/telegram/auth', (req, res) => {
  const authToken = crypto.randomBytes(16).toString('hex');
  const telegramUrl = `https://t.me/Kittypoopvpn_bot?start=auth_${authToken}`;
  if (!global.authTokens) global.authTokens = new Map();
  global.authTokens.set(authToken, { status: 'pending' });
  res.json({ success: true, telegramUrl, authToken });
});

// Инициализация токена (вызывается фронтом сразу после генерации)
router.post('/telegram/init', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Нет токена' });
  if (!global.authTokens) global.authTokens = new Map();
  global.authTokens.set(token, { status: 'pending' });
  res.json({ success: true });
});

// Callback от Telegram-бота (бот присылает userData и token)
router.post('/telegram/callback', (req, res) => {
  const { token, ...userData } = req.body;
  if (!token || !global.authTokens || !global.authTokens.has(token)) {
    return res.status(400).json({ success: false, message: 'Неверный или истекший токен авторизации' });
  }
  // Сохраняем userData напрямую!
  global.authTokens.set(token, userData);
  res.json({ success: true });
});

module.exports = router; 