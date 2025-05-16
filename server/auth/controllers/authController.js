const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const tokenService = require('../services/tokenService');
const telegramService = require('../services/telegramService');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');

// Константы
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
const TELEGRAM_BOT_TOKEN_PART = TELEGRAM_BOT_TOKEN.split(':')[0] || '7651266107';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('[getProfile] Пользователь не найден по id:', req.user.id);
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    const adminEnv = String(process.env.ADMIN_TELEGRAM_CHAT_ID || '434532312');
    const userTgId = String(user.telegramId);
    const isAdmin = userTgId === adminEnv;
    console.log('[getProfile] user:', user);
    console.log('[getProfile] user.telegramId:', userTgId, '| ADMIN_TELEGRAM_CHAT_ID:', adminEnv, '| isAdmin:', isAdmin);
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telegramId: user.telegramId,
        isAdmin: isAdmin
      }
    });
  } catch (error) {
    console.error('[getProfile] Ошибка:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Удаляем токен из БД
    if (refreshToken) {
      await tokenService.removeToken(refreshToken);
    }
    
    return res.json({ success: true, message: 'Успешный выход из системы' });
  } catch (error) {
    console.error('Ошибка выхода из системы:', error);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
};

// Генерация URL для авторизации через Telegram
exports.generateTelegramAuthUrl = (req, res) => {
  try {
    // Генерируем уникальный токен
    const authToken = crypto.randomBytes(16).toString('hex');
    
    // Создаем URL для бота Telegram
    const telegramBotUrl = `https://t.me/Kittypoopvpn_bot?start=auth_${authToken}`;
    
    // Сохраняем токен в Map (в реальном приложении можно использовать Redis)
    global.authTokens.set(authToken, { 
      created: Date.now(), 
      expires: Date.now() + 10 * 60 * 1000 // 10 минут
    });
    
    // Отправляем URL для перенаправления
    return res.json({ 
      success: true, 
      telegramUrl: telegramBotUrl,
      authToken
    });
  } catch (error) {
    console.error('Ошибка генерации URL для Telegram:', error);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
};

// Обработка коллбэка от Telegram
exports.handleTelegramCallback = async (req, res) => {
  try {
    const { token, ...userData } = req.body;
    if (!token || !global.authTokens || !global.authTokens.has(token)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Неверный или истекший токен авторизации' 
      });
    }
    let user = await User.findByTelegramId(userData.id);
    if (user) {
      await User.update(user.id, {
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        photoUrl: userData.photo_url,
        authDate: userData.auth_date,
        lastLogin: new Date().toISOString()
      });
      console.log('[handleTelegramCallback] Обновлён пользователь:', user);
    } else {
      await User.create({
        telegramId: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        photoUrl: userData.photo_url,
        authDate: userData.auth_date,
        lastLogin: new Date().toISOString()
      });
      console.log('[handleTelegramCallback] Создан новый пользователь с telegramId:', userData.id);
    }
    userData.isAdmin = userData.id && userData.id.toString() === (process.env.ADMIN_TELEGRAM_CHAT_ID || '434532312');
    console.log('[handleTelegramCallback] userData:', userData, '| isAdmin:', userData.isAdmin);
    global.authTokens.set(token, { status: 'authorized', userData });
  } catch (error) {
    console.error('Ошибка обработки коллбэка Telegram:', error);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
};

// Проверка статуса авторизации по токену
exports.checkTelegramAuthStatus = (req, res) => {
  const { token } = req.query;
  if (!token || !global.authTokens || !global.authTokens.has(token)) {
    return res.json({ success: false, status: 'pending', message: 'Ожидание авторизации' });
  }
  const data = global.authTokens.get(token);
  if (data.status === 'authorized') {
    const userData = data.userData || {};
    userData.isAdmin = userData.telegramId && userData.telegramId.toString() === (process.env.ADMIN_TELEGRAM_CHAT_ID || '434532312');
    return res.json({ success: true, user: userData, token });
  }
  return res.json({ success: false, status: 'pending', message: 'Ожидание авторизации' });
}; 