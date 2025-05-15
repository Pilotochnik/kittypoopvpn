const tokenService = require('../services/tokenService');
const User = require('../../models/User');

/**
 * Контроллер для обработки обновления токенов
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Отсутствует refresh token' });
    }
    
    // Проверяем валидность refresh токена
    const userData = tokenService.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ success: false, message: 'Недействительный refresh token' });
    }
    
    // Проверяем наличие токена в базе
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!tokenFromDb) {
      return res.status(401).json({ success: false, message: 'Токен не найден в базе данных' });
    }
    
    // Проверяем существование пользователя
    const user = await User.findById(userData.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    
    // Генерируем новые токены
    const tokens = tokenService.generateTokens({
      id: user.id,
      email: user.email
    });
    
    // Сохраняем новый refresh токен
    await tokenService.saveToken(user.id, tokens.refreshToken);
    
    // Возвращаем новые токены
    return res.json({
      success: true,
      tokens: {
        access: tokens.accessToken,
        refresh: tokens.refreshToken
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
}; 