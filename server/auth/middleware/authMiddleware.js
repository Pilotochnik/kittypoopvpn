const tokenService = require('../services/tokenService');

module.exports = function (req, res, next) {
  try {
    // Получаем заголовок Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
    
    // Проверяем формат "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Неверный формат токена' });
    }
    
    const accessToken = parts[1];
    
    // Проверяем валидность токена
    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      return res.status(401).json({ success: false, message: 'Недействительный токен' });
    }
    
    // Добавляем данные пользователя в запрос
    req.user = userData;
    next();
  } catch (e) {
    console.error('Ошибка в middleware аутентификации:', e);
    return res.status(401).json({ success: false, message: 'Ошибка авторизации' });
  }
}; 