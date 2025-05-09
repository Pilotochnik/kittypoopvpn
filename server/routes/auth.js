const express = require('express');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();

// Инициализация бота
const token = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
// Получаем первую часть токена для проверки хэша
const botTokenFirstPart = token.split(':')[0] || '7651266107';

const bot = new TelegramBot(token, { polling: true });

// Хранилище токенов авторизации (временное, до сохранения пользователя в БД)
const authTokens = new Map();

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

// Обработка команды /start с токеном авторизации
bot.onText(/\/start auth_(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const authToken = match[1];
  
  console.log(`Получен запрос на авторизацию с токеном: ${authToken}`);
  
  // Сообщаем пользователю, что авторизация в процессе
  bot.sendMessage(chatId, 'Выполняю авторизацию...');
  
  // Формируем данные пользователя для отправки в приложение
  const userData = {
    id: msg.from.id,
    first_name: msg.from.first_name || '',
    last_name: msg.from.last_name || '',
    username: msg.from.username || '',
    photo_url: '', // Можно получить через дополнительный запрос
    auth_date: Math.floor(Date.now() / 1000)
  };
  
  // Генерируем хэш для данных
  userData.hash = generateTelegramHash(userData);
  
  // Сохраняем данные пользователя с привязкой к токену
  authTokens.set(authToken, userData);
  console.log(`Сохранены данные пользователя для токена ${authToken}:`, userData);
  
  // Имитация успешной авторизации
  setTimeout(() => {
    bot.sendMessage(chatId, 'Вы успешно авторизованы! Вернитесь в приложение.');
  }, 1000);
});

// Обработка обычной команды /start
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я бот для авторизации в приложении KittyPoopVPN. Используйте кнопку "Войти через Telegram" на сайте для авторизации.');
});

// API для получения данных пользователя по токену
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  console.log(`Получен запрос на проверку токена: ${token}`);
  
  if (authTokens.has(token)) {
    const userData = authTokens.get(token);
    console.log(`Найдены данные пользователя для токена ${token}:`, userData);
    
    try {
      // Ищем пользователя в базе по Telegram ID
      let user = await User.findOne({ telegramId: userData.id });
      
      // Если пользователь не найден, создаем нового
      if (!user) {
        user = new User({
          telegramId: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          authDate: new Date(userData.auth_date * 1000)
        });
        await user.save();
        console.log(`Создан новый пользователь для Telegram ID ${userData.id}`);
      } else {
        // Обновляем данные пользователя
        user.firstName = userData.first_name;
        user.lastName = userData.last_name;
        user.username = userData.username;
        user.lastLogin = new Date();
        await user.save();
        console.log(`Обновлены данные пользователя с Telegram ID ${userData.id}`);
      }
      
      // Удаляем токен после использования
      authTokens.delete(token);
      
      // Отправляем успешный ответ с данными пользователя
      return res.json({ 
        success: true, 
        user: {
          id: user._id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
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
        email: user.email,
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

module.exports = router; 