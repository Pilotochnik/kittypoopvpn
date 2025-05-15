const jwt = require('jsonwebtoken');
const Token = require('../../models/Token');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'supersecretaccess';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefresh';

// Генерация пары токенов
exports.generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return {
    accessToken,
    refreshToken
  };
};

// Проверка access token
exports.validateAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (e) {
    return null;
  }
};

// Проверка refresh token
exports.validateRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (e) {
    return null;
  }
};

// Сохранение refresh токена в БД
exports.saveToken = async (userId, refreshToken) => {
  try {
    // Проверяем, есть ли уже токен для этого пользователя
    const tokenData = await Token.findOne({ user: userId });
    
    if (tokenData) {
      // Обновляем существующий токен
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }
    
    // Создаем новую запись токена
    const token = await Token.create({
      user: userId,
      refreshToken
    });
    
    return token;
  } catch (error) {
    console.error('Ошибка сохранения токена:', error);
    throw error;
  }
};

// Удаление refresh токена
exports.removeToken = async (refreshToken) => {
  try {
    const tokenData = await Token.deleteOne({ refreshToken });
    return tokenData;
  } catch (error) {
    console.error('Ошибка удаления токена:', error);
    throw error;
  }
};

// Поиск токена в БД
exports.findToken = async (refreshToken) => {
  try {
    const tokenData = await Token.findOne({ refreshToken });
    return tokenData;
  } catch (error) {
    console.error('Ошибка поиска токена:', error);
    throw error;
  }
}; 