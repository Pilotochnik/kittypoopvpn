const express = require('express');
const authController = require('./controllers/authController');
const tokenController = require('./controllers/tokenController');
const authMiddleware = require('./middleware/authMiddleware');

const router = express.Router();

// Базовая аутентификация
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getProfile);

// Управление токенами
router.post('/refresh', tokenController.refresh);

// Telegram аутентификация
router.get('/telegram/auth', authController.generateTelegramAuthUrl);
router.post('/telegram/callback', authController.handleTelegramCallback);
router.get('/telegram/status', authController.checkTelegramAuthStatus);

// Новый endpoint для инициализации токена
router.post('/telegram/init', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Нет токена' });
  if (!global.authTokens) global.authTokens = new Map();
  global.authTokens.set(token, { status: 'pending' });
  res.json({ success: true });
});

module.exports = router; 