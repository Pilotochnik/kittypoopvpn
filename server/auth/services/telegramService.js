const crypto = require('crypto');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
const TELEGRAM_BOT_TOKEN_PART = TELEGRAM_BOT_TOKEN.split(':')[0] || '7651266107';

// Генерация хэша для данных пользователя Telegram
exports.generateTelegramHash = (userData) => {
  // Создаем data-check-string
  const dataCheckArr = Object.keys(userData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${userData[key]}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  
  // Создаем секретный ключ из первой части токена бота
  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN_PART).digest();
  
  // Создаем хэш
  return crypto.createHmac('sha256', secret)
              .update(dataCheckString)
              .digest('hex');
};

// Проверка данных аутентификации Telegram
exports.verifyTelegramData = (telegramData) => {
  const { hash, ...userData } = telegramData;
  
  if (!hash) {
    return false;
  }
  
  // Проверяем, не устарели ли данные (проверка auth_date)
  const now = Math.floor(Date.now() / 1000);
  if (userData.auth_date && now - userData.auth_date > 86400) {
    return false; // Данные старше 24 часов
  }
  
  // Генерируем хэш и сравниваем
  const calculatedHash = this.generateTelegramHash(userData);
  return calculatedHash === hash;
};

// Форматирование данных пользователя Telegram
exports.formatTelegramUserData = (telegramData) => {
  return {
    telegramId: telegramData.id,
    firstName: telegramData.first_name || '',
    lastName: telegramData.last_name || '',
    username: telegramData.username || '',
    photoUrl: telegramData.photo_url || '',
    authDate: new Date(telegramData.auth_date * 1000)
  };
}; 