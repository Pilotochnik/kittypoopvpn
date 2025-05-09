const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const axios = require('axios');
const blockchainService = require('./blockchainService');
const { connectDB, getDB } = require('./db');
const keyManager = require('./utils/keyManager');
require('dotenv').config();

// Импорт моделей MongoDB
const User = require('./models/User');
const VpnKey = require('./models/VpnKey');
const Payment = require('./models/Payment');

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 5000;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Kittypoopvpn_bot';

// Хранилище для таймеров проверки платежей
const paymentTimers = new Map();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Инициализация бота
const token = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
// Получаем первую часть токена для проверки хэша
const botTokenFirstPart = token.split(':')[0] || '7651266107';

const bot = new TelegramBot(token, { polling: true });

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

// Хранилище токенов авторизации (временное, до сохранения пользователя в БД)
const authTokens = new Map();

// Обработка команды /start с токеном авторизации
bot.onText(/\/start auth_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const authToken = match[1];
  
  console.log(`Получен запрос на авторизацию с токеном: ${authToken}`);
  
  // Отправляем приветственное сообщение с анимацией
  await bot.sendAnimation(chatId, 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmN1dmZvMDV3Y2Jhamo0MzF5NjRkM3NyczRlOXZ4bmphYWNneDEwaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ohhwpkATGtSV4Mhfa/giphy.gif', {
    caption: `🎉 *Добро пожаловать в KittyPoopVPN!* 🐱\n\nИдет процесс авторизации...\n\nПодождите, пожалуйста, пока мы проверим ваши данные.`,
    parse_mode: 'Markdown'
  });
  
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
  
  // Получаем фото профиля пользователя
  try {
    const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
    if (photos && photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      const fileInfo = await bot.getFile(fileId);
      // Добавляем URL фото в данные пользователя
      userData.photo_url = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      // Обновляем данные в хранилище
      authTokens.set(authToken, userData);
    }
  } catch (error) {
    console.error('Ошибка при получении фото профиля:', error);
  }
  
  // Отправляем сообщение об успешной авторизации
  setTimeout(async () => {
    // Создаем URL для возврата на сайт с прикрепленным токеном и параметром для редиректа в личный кабинет
    const returnUrl = `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/auth-success?token=${authToken}&redirect=/profile`;
    
    await bot.sendMessage(chatId, 
      `✅ *Авторизация успешно завершена!* ✅\n\n`+
      `Вы успешно авторизованы в KittyPoopVPN! Теперь вы можете управлять своими VPN-ключами и подписками.`, 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 Личный кабинет', callback_data: 'my_profile' }],
            [{ text: '🌐 Перейти на сайт', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
          ]
        }
      }
    );
  }, 2000);
});

// Обработка обычной команды /start
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendPhoto(chatId, 'https://i.imgur.com/V1RwQVE.jpg', {
    caption: `🎉 *Привет! Я официальный бот KittyPoopVPN* 🐱\n\n`+
      `Здесь вы можете управлять своим VPN-аккаунтом и получать информацию о ваших ключах.`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '👤 Личный кабинет', callback_data: 'my_profile' }],
        [{ text: '🌐 Перейти на сайт', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
      ]
    }
  });
});

// API для получения данных пользователя по токену
app.get('/api/auth/:token', async (req, res) => {
  const { token } = req.params;
  console.log(`Получен запрос на проверку токена: ${token}`);
  
  if (authTokens.has(token)) {
    const userData = authTokens.get(token);
    console.log(`Найдены данные пользователя для токена ${token}:`, userData);
    
    try {
      // Ищем пользователя в базе по Telegram ID
      let user = await User.findByTelegramId(userData.id);
      
      // Если пользователь не найден, создаем нового
      if (!user) {
        const newUserData = {
          telegramId: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          authDate: new Date(userData.auth_date * 1000).toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        user = await User.create(newUserData);
        console.log(`Создан новый пользователь для Telegram ID ${userData.id}`);
      } else {
        // Обновляем данные пользователя
        const updateData = {
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          lastLogin: new Date().toISOString()
        };
        
        user = await User.update(user.id, updateData);
        console.log(`Обновлены данные пользователя с Telegram ID ${userData.id}`);
      }
      
      // Удаляем токен после использования
      authTokens.delete(token);
      
      // Отправляем успешный ответ с данными пользователя
      return res.json({ 
        success: true, 
        user: {
          id: user.id,
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

// API для создания пробного ключа
app.post('/api/trial-key', async (req, res) => {
  try {
    const { uuid, expiryTime, userId } = req.body;
    
    if (!uuid || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указан UUID ключа или ID пользователя' 
      });
    }
    
    // Проверка существования пользователя (только для неанонимных пользователей)
    if (userId !== 'anonymous-user') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Пользователь не найден' 
        });
      }
    }
    
    // Устанавливаем срок действия ключа - 1 час от текущего времени
    let expiry;
    if (expiryTime) {
      // Если время истечения пришло в формате ISO строки
      expiry = new Date(expiryTime);
    } else {
      // Иначе устанавливаем +1 час от текущего времени
      expiry = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    // Проверяем валидность даты
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Некорректный формат даты истечения срока' 
      });
    }
    
    // Генерируем конфигурацию VLESS
    const vlessUUID = crypto.randomUUID();
    const vlessConfig = `vless://${vlessUUID}@vpn.kittypoopvpn.com:443?security=tls&encryption=none&headerType=none&type=tcp&sni=vpn.kittypoopvpn.com#KittyPoopVPN_Trial`;

    // Создаем запись о пробном ключе в базе данных
    const vpnKeyData = {
      uuid,
      userId,
      plan: 'trial',
      period: 0, // 0 месяцев для пробного ключа
      created: new Date().toISOString(),
      expires: expiry.toISOString(),
      isActive: 1,
      isTrial: 1,
      config: vlessConfig
    };
    
    const vpnKey = await VpnKey.create(vpnKeyData);
    
    console.log(`Создан пробный ключ ${uuid} для пользователя ${userId}, действителен до ${expiry}`);
    
    return res.json({ 
      success: true, 
      uuid, 
      expires: expiry,
      message: 'Пробный ключ успешно создан'
    });
  } catch (error) {
    console.error('Ошибка при создании пробного ключа:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера при создании пробного ключа'
    });
  }
});

// API для проверки статуса пробного ключа
app.get('/api/trial-key/:uuid', async (req, res) => {
  const { uuid } = req.params;
  
  try {
    const vpnKey = await VpnKey.findByUuid(uuid);
    
    if (!vpnKey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пробный ключ не найден' 
      });
    }
    
    const now = new Date();
    const expiryDate = new Date(vpnKey.expires);
    
    // Проверяем, не истек ли срок действия ключа
    if (now > expiryDate) {
      // Обновляем статус ключа на неактивный
      await VpnKey.update(uuid, { isActive: 0 });
      
      return res.json({
        success: true,
        isActive: false,
        message: 'Срок действия пробного ключа истек',
        expires: vpnKey.expires
      });
    }
    
    return res.json({
      success: true,
      isActive: vpnKey.isActive === 1,
      expires: vpnKey.expires,
      config: vpnKey.config,
      message: 'Пробный ключ активен'
    });
  } catch (error) {
    console.error('Ошибка при проверке статуса пробного ключа:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера при проверке статуса пробного ключа'
    });
  }
});

// Генерация уникального ID платежа
const generatePaymentId = () => {
  return `payment_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

// API для создания крипто-платежа
app.post('/api/crypto-payment', async (req, res) => {
  try {
    console.log('Запрос на создание платежа:', req.body);
    
    const { userId, plan, period, currency, amount } = req.body;
    
    // Проверка наличия необходимых параметров
    if (!userId || !plan || !period || !currency) {
      console.error('Не указаны необходимые параметры:', { userId, plan, period, currency });
      return res.status(400).json({
        success: false,
        message: 'Не указаны все необходимые параметры'
      });
    }
    
    // Валидация входных данных
    if (!currency || !plan || !period || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Не указаны все необходимые параметры'
      });
    }

    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Рассчитываем стоимость в зависимости от плана и периода
    let finalAmount;
    if (amount) {
      // Если сумма уже задана, используем её
      finalAmount = amount;
    } else {
      // Рассчитываем сумму на основе плана и периода
      if (period === 'yearly' || period === 12) {
        finalAmount = 1500; // Годовая подписка - 1500₽
      } else if (period === 'quarterly' || period === 3) {
        finalAmount = 500; // Квартальная подписка - 500₽
      } else if (period === 'monthly' || period === 1 || 
                (typeof period === 'string' && period.toLowerCase() === 'monthly')) {
        finalAmount = 200; // Месячная подписка - 200₽
      } else {
        // По умолчанию - месячная подписка
        finalAmount = 200;
      }
      
      // Применяем модификаторы в зависимости от выбранного плана
      if (plan === 'premium') {
        // Премиум план (Наш слоняра) - всегда годовой
        finalAmount = 1500;
      }
    }
    
    // Генерация платежного адреса
    const cryptoAddress = await blockchainService.generatePaymentAddress(currency);
    
    // Конвертация суммы в крипто (в реальности должен использоваться API курса валют)
    let cryptoAmount;
    const rates = {
      eth: 3000, // USD за 1 ETH
      usdt: 1, // USD за 1 USDT
      usdt_eth: 1, // USD за 1 USDT ERC20
      usdt_trc20: 1, // USD за 1 USDT
      ton: 5 // USD за 1 TON
    };
    
    // Примерный курс рубля к доллару
    const rubToUsd = 0.011; // Примерно 90 рублей за доллар
    const amountUsd = finalAmount * rubToUsd;
    
    // Выбираем курс обмена в зависимости от валюты
    let rate = rates[currency];
    if (!rate) {
      // Если валюта не найдена, используем значение по умолчанию
      console.warn(`Неизвестная валюта: ${currency}, используем курс USDT`);
      rate = rates.usdt;
    }
    
    cryptoAmount = parseFloat((amountUsd / rate).toFixed(8));
    
    // Создаем ID платежа
    const paymentId = generatePaymentId();
    
    // Вычисляем время истечения платежа (30 минут)
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
    
    // Определяем числовой период для хранения в БД
    let numericPeriod;
    if (period === 'yearly') {
      numericPeriod = 12;
    } else if (period === 'quarterly') {
      numericPeriod = 3;
    } else if (period === 'monthly') {
      numericPeriod = 1;
    } else {
      // Если период уже задан числом
      numericPeriod = parseInt(period);
      if (isNaN(numericPeriod) || numericPeriod <= 0) {
        numericPeriod = 1; // По умолчанию 1 месяц
      }
    }
    
    // Создаем запись о платеже в базе данных
    const paymentData = {
      paymentId,
      userId,
      status: 'pending',
      amount: finalAmount,
      currency,
      cryptoAmount,
      cryptoAddress,
      plan,
      period: numericPeriod,
      expiryTime: expiryTime.toISOString()
    };
    
    const payment = await Payment.create(paymentData);
    
    // Запускаем проверку платежа
    startPaymentVerification(paymentId);
    
    // Отправляем в ответ все необходимые данные
    return res.json({
      success: true,
      payment: {
        paymentId,
        amount: finalAmount,
        currency,
        cryptoAmount,
        cryptoAddress,
        plan,
        period,
        expiryTime
      }
    });
  } catch (error) {
    console.error('Ошибка при создании крипто-платежа:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при создании платежа'
    });
  }
});

// API для проверки статуса платежа
app.get('/api/crypto-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Ищем платеж в базе данных
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Платеж не найден'
      });
    }
    
    // Проверяем, не истек ли срок ожидания платежа
    const now = new Date();
    if (payment.status === 'pending' && now > payment.expiryTime) {
      payment.status = 'expired';
      await payment.save();
      
      // Останавливаем таймер проверки, если он существует
      if (paymentTimers.has(paymentId)) {
        clearInterval(paymentTimers.get(paymentId));
        paymentTimers.delete(paymentId);
      }
    }
    
    // Если платеж выполнен, возвращаем также информацию о ключе
    let vpnKey = null;
    if (payment.status === 'completed' && payment.vpnKeyUuid) {
      vpnKey = await VpnKey.findOne({ uuid: payment.vpnKeyUuid });
    }
    
    return res.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        cryptoAmount: payment.cryptoAmount,
        cryptoAddress: payment.cryptoAddress,
        plan: payment.plan,
        period: payment.period,
        expiryTime: payment.expiryTime,
        completedAt: payment.completedAt,
        transactionId: payment.transactionId,
        vpnKeyUuid: payment.vpnKeyUuid
      },
      vpnKey: vpnKey ? {
        uuid: vpnKey.uuid,
        plan: vpnKey.plan,
        period: vpnKey.period,
        created: vpnKey.created,
        expires: vpnKey.expires,
        isActive: vpnKey.isActive,
        config: vpnKey.config
      } : null
    });
  } catch (error) {
    console.error('Ошибка при проверке статуса крипто-платежа:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при проверке статуса платежа'
    });
  }
});

// Функция для периодической проверки статуса платежа
async function startPaymentVerification(paymentId) {
  // Получаем данные платежа из базы данных
  const payment = await Payment.findByPaymentId(paymentId);
  
  if (!payment || payment.status !== 'pending') {
    console.log(`Платеж ${paymentId} не требует проверки (не найден или не в статусе 'pending')`);
    return;
  }
  
  console.log(`Запускаем проверку платежа ${paymentId}`);
  
  // Создаем интервал для периодической проверки (каждые 30 секунд)
  const intervalId = setInterval(async () => {
    try {
      // Проверяем актуальность платежа в базе данных
      const updatedPayment = await Payment.findByPaymentId(paymentId);
      
      if (!updatedPayment || updatedPayment.status !== 'pending') {
        console.log(`Остановка проверки для платежа ${paymentId}: изменен статус или платеж удален`);
        clearInterval(intervalId);
        paymentTimers.delete(paymentId);
        return;
      }
      
      // Проверяем, не истек ли срок ожидания платежа
      const now = new Date();
      const expiryTime = new Date(updatedPayment.expiryTime);
      
      if (now > expiryTime) {
        console.log(`Платеж ${paymentId} истек`);
        await Payment.update(paymentId, { status: 'expired' });
        clearInterval(intervalId);
        paymentTimers.delete(paymentId);
        return;
      }
      
      console.log(`Проверка статуса платежа ${paymentId} в блокчейне...`);
      
      // Проверяем платеж в соответствующей блокчейн-сети
      const paymentResult = await blockchainService.checkPayment(
        updatedPayment.currency,
        updatedPayment.cryptoAddress,
        updatedPayment.cryptoAmount,
        updatedPayment.createdAt
      );
      
      // Если платеж подтвержден
      if (paymentResult.confirmed) {
        console.log(`Платеж ${paymentId} подтвержден в блокчейне!`);
        
        // Генерируем VPN ключ
        const vpnKeyData = await generateVpnKey(updatedPayment.plan, updatedPayment.period, updatedPayment.userId);
        
        // Обновляем статус платежа
        await Payment.update(paymentId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          transactionId: paymentResult.txId,
          vpnKeyUuid: vpnKeyData.uuid
        });
        
        // Отправляем ключ пользователю
        await sendVpnKeyToUser(updatedPayment, vpnKeyData);
        
        // Останавливаем проверку
        clearInterval(intervalId);
        paymentTimers.delete(paymentId);
      }
    } catch (error) {
      console.error(`Ошибка при проверке платежа ${paymentId}:`, error);
    }
  }, 30000); // Проверка каждые 30 секунд
  
  // Сохраняем ID интервала для возможности остановки
  paymentTimers.set(paymentId, intervalId);
}

// Функция для генерации VPN ключа
async function generateVpnKey(plan, period, userId) {
  // Генерируем уникальный ID ключа
  const uuid = `vpn_${crypto.randomBytes(8).toString('hex')}`;
  
  // Вычисляем дату истечения срока действия ключа
  const now = new Date();
  const expires = new Date(now);
  
  // Устанавливаем срок действия в зависимости от выбранного периода
  if (period === 'yearly' || period === 12) {
    // Годовая подписка - добавляем 12 месяцев
    expires.setMonth(expires.getMonth() + 12);
  } else if (period === 'quarterly' || period === 3) {
    // Квартальная подписка (3 месяца)
    expires.setMonth(expires.getMonth() + 3);
  } else if (period === 'monthly' || period === 1) {
    // Месячная подписка - добавляем 1 месяц
    expires.setMonth(expires.getMonth() + 1);
  } else {
    // Если период указан в виде числа (количество месяцев)
    const numericPeriod = parseInt(period);
    if (!isNaN(numericPeriod) && numericPeriod > 0) {
      expires.setMonth(expires.getMonth() + numericPeriod);
    } else {
      // По умолчанию - 1 месяц
      expires.setMonth(expires.getMonth() + 1);
    }
  }

  // Генерация VLESS-ключа
  const vlessUUID = crypto.randomUUID();
  let planSuffix = '';
  
  switch (plan) {
    case 'basic':
      planSuffix = '_Basic';
      break;
    case 'premium':
      planSuffix = '_Premium';
      break;
    case 'unlimited':
      planSuffix = '_Unlimited';
      break;
    default:
      planSuffix = '';
  }
  
  // Формируем конфигурацию VLESS
  const config = `vless://${vlessUUID}@vpn.kittypoopvpn.com:443?security=tls&encryption=none&headerType=none&type=tcp&sni=vpn.kittypoopvpn.com#KittyPoopVPN${planSuffix}`;

  // Преобразуем период в числовое значение для хранения в БД
  let numericPeriod;
  if (period === 'yearly') {
    numericPeriod = 12;
  } else if (period === 'quarterly') {
    numericPeriod = 3;
  } else if (period === 'monthly') {
    numericPeriod = 1;
  } else {
    // Если период уже задан числом
    numericPeriod = parseInt(period);
    if (isNaN(numericPeriod) || numericPeriod <= 0) {
      numericPeriod = 1; // По умолчанию 1 месяц
    }
  }

  // Сохраняем ключ в базе данных
  const vpnKeyData = {
    uuid,
    userId,
    plan,
    period: numericPeriod,
    created: now.toISOString(),
    expires: expires.toISOString(),
    isActive: 1,
    isTrial: 0,
    config
  };
  
  // Создаем запись в базе данных
  const vpnKey = await VpnKey.create(vpnKeyData);
  
  return vpnKey;
}

// Функция для отправки ключа пользователю
async function sendVpnKeyToUser(paymentData, vpnKeyData) {
  try {
    // Получаем данные пользователя
    const user = await User.findById(paymentData.userId);
    
    if (!user) {
      console.error(`Пользователь не найден для ID ${paymentData.userId}`);
      return;
    }
    
    // Если у пользователя есть Telegram ID, отправляем ключ через бота
    if (user.telegramId) {
      // Создаем QR-код для конфигурации VPN
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(vpnKeyData.config)}`;
      
      // Готовим информацию о плане
      let planInfo = '';
      if (vpnKeyData.plan === 'basic') {
        planInfo = '🔵 Базовый план';
      } else if (vpnKeyData.plan === 'premium') {
        planInfo = '🟣 Премиум план';
      } else if (vpnKeyData.plan === 'unlimited') {
        planInfo = '⭐ Безлимитный план';
      } else {
        planInfo = '🔶 Пробный план';
      }
      
      // Формируем инструкции для установки V2ray
      const installInstructions = `
📱 *Инструкция по установке V2ray:*
1. Скачайте и установите приложение V2rayTUN (iOS) или V2rayNG (Android) на ваше устройство
2. Откройте приложение и выберите опцию "Импортировать из буфера обмена" или "Сканировать QR-код"
3. Вставьте скопированный VLESS-ключ или отсканируйте QR-код
4. Подключитесь к серверу

💡 *Совет:* Отсканировать QR-код можно прямо с экрана вашего устройства, на котором открыт этот чат.
`;
      
      // Формируем сообщение со всеми данными
      const message = `
🎉 *Ваш платеж успешно обработан!* 🎉

${planInfo}
🔑 *Ваш VLESS ключ готов!*

📋 *Детали ключа:*
• UUID: \`${vpnKeyData.uuid}\`
• Тип: VLESS
• План: ${vpnKeyData.plan}
• Период: ${vpnKeyData.period} мес.
• Действителен до: ${new Date(vpnKeyData.expires).toLocaleDateString()}

⚙️ *Конфигурация:*
\`\`\`
${vpnKeyData.config}
\`\`\`

${installInstructions}

Спасибо за использование KittyPoopVPN! 🐱
Если у вас возникли вопросы, обращайтесь в нашу поддержку.
      `;
      
      // Сначала отправляем QR-код с частью сообщения
      await bot.sendPhoto(user.telegramId, qrCodeUrl, {
        caption: `🎉 *Ваш VLESS ключ готов!* 🎉\n\nНиже QR-код для быстрой настройки.\nСейчас отправлю детальную информацию и инструкции.`,
        parse_mode: 'Markdown'
      });
      
      // Затем отправляем подробное сообщение
      await bot.sendMessage(user.telegramId, message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Перейти на сайт', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}` }],
            [{ text: '« Назад', callback_data: 'back_to_main' }]
          ]
        }
      });
      
      console.log(`VPN ключ отправлен пользователю через Telegram`);
    } else {
      console.log(`У пользователя нет Telegram ID для отправки ключа`);
      // Здесь можно добавить отправку по email, если у пользователя есть email
    }
  } catch (error) {
    console.error('Ошибка при отправке VPN ключа пользователю:', error);
  }
}

// API для получения всех ключей пользователя
app.get('/api/vpn-keys/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Получаем все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId });
    
    // Форматируем данные для ответа
    const formattedKeys = vpnKeys.map(key => ({
      uuid: key.uuid,
      plan: key.plan,
      period: key.period,
      created: key.created,
      expires: key.expires,
      isActive: key.isActive,
      isTrial: key.isTrial,
      config: key.config
    }));
    
    return res.json({
      success: true,
      keys: formattedKeys
    });
  } catch (error) {
    console.error('Ошибка при получении VPN ключей пользователя:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при получении VPN ключей'
    });
  }
});

// API для получения истории платежей пользователя
app.get('/api/payment-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Получаем историю платежей пользователя
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    
    // Форматируем данные для ответа
    const formattedPayments = payments.map(payment => ({
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      cryptoAmount: payment.cryptoAmount,
      plan: payment.plan,
      period: payment.period,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      vpnKeyUuid: payment.vpnKeyUuid
    }));
    
    return res.json({
      success: true,
      payments: formattedPayments
    });
  } catch (error) {
    console.error('Ошибка при получении истории платежей пользователя:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при получении истории платежей'
    });
  }
});

// Маршрут для проверки подключения к SQLite
app.get('/api/db-test', async (req, res) => {
  try {
    // Попытка выполнить простой запрос к базе данных
    const db = getDB();
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    return res.json({
      success: true,
      message: 'Подключение к SQLite работает!',
      stats: {
        users: usersCount.count
      }
    });
  } catch (error) {
    console.error('Ошибка при проверке подключения к SQLite:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка подключения к SQLite',
      error: error.message
    });
  }
});

// Обработка команды /help
bot.onText(/^\/help$/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📚 *Справка по командам* 📚

*Доступные команды:*
• 🚀 /start - Начать работу с ботом
• 📖 /help - Показать это сообщение
• 📊 /status - Проверить статус подписки
• ❓ /faq - Часто задаваемые вопросы

🔹 *Как использовать Kitty Poop VPN?*
1️⃣ Авторизуйтесь на нашем сайте через Telegram
2️⃣ Получите пробный ключ или оформите подписку
3️⃣ Установите приложение OpenVPN на ваше устройство
4️⃣ Импортируйте полученный ключ (вручную или через QR-код)
5️⃣ Наслаждайтесь безопасным и быстрым интернетом!

🔒 *Преимущества нашего VPN:*
• 🔐 Надежное шифрование трафика
• ⚡ Высокая скорость соединения
• 🌍 Множество серверов по всему миру
• 🔓 Доступ к заблокированным сайтам
• 🕵️ Анонимность в сети
`;

  bot.sendMessage(chatId, helpMessage, { 
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📚 Полная документация', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/faq` }],
        [{ text: '❓ FAQ', callback_data: 'faq' }]
      ]
    }
  });
});

// Обработка команды /status - проверка статуса подписки
bot.onText(/^\/status$/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  try {
    // Найти пользователя по Telegram ID
    const user = await User.findByTelegramId(telegramId);
    
    if (!user) {
      return bot.sendMessage(chatId, 
        '❌ *Вы не зарегистрированы в системе*\n\n' +
        'Для использования сервиса необходимо авторизоваться через Telegram на нашем сайте.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Авторизоваться', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
            ]
          }
        }
      );
    }
    
    // Получить все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId: user.id });
    
    // Если у пользователя нет ключей
    if (!vpnKeys || vpnKeys.length === 0) {
      return bot.sendMessage(chatId, 
        '🔍 *У вас пока нет VPN ключей*\n\n' +
        'Вы можете получить бесплатный пробный ключ на 1 час или приобрести полную подписку на нашем сайте.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Купить подписку', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/pricing` }]
            ]
          }
        }
      );
    }
    
    // Сортируем ключи: сначала активные, потом по дате истечения (сначала те, что истекают позже)
    vpnKeys.sort((a, b) => {
      // Если один активен, а другой нет, активный идет первым
      if (a.isActive !== b.isActive) {
        return b.isActive - a.isActive;
      }
      // Иначе сортируем по дате истечения (сначала те, что истекают позже)
      return new Date(b.expires) - new Date(a.expires);
    });
    
    // Форматируем информацию о ключах
    let keysList = '';
    const now = new Date();
    
    vpnKeys.forEach((key, index) => {
      const expiryDate = new Date(key.expires);
      const isExpired = now > expiryDate;
      
      // Определяем статус и эмодзи
      let status, emoji;
      if (key.isActive === 1 && !isExpired) {
        status = 'Активен';
        emoji = '✅';
      } else if (isExpired) {
        status = 'Истек';
        emoji = '⏱️';
      } else {
        status = 'Отключен';
        emoji = '❌';
      }
      
      // Определяем тип плана
      let planEmoji;
      switch (key.plan) {
        case 'basic':
          planEmoji = '🔵';
          break;
        case 'premium':
          planEmoji = '🟣';
          break;
        case 'unlimited':
          planEmoji = '⭐';
          break;
        case 'trial':
          planEmoji = '🔶';
          break;
        default:
          planEmoji = '🔹';
      }
      
      // Форматируем дату истечения срока
      const formattedExpiry = expiryDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      keysList += `${index + 1}. ${emoji} ${planEmoji} *${key.plan.charAt(0).toUpperCase() + key.plan.slice(1)}*\n` +
        `   📅 До: ${formattedExpiry}\n` +
        `   🔑 ID: \`${key.uuid}\`\n` +
        `   📊 Статус: ${status}\n\n`;
    });
    
    // Формируем итоговое сообщение
    const statusMessage = `
📊 *Статус ваших VPN ключей* 📊

${keysList}
Для управления ключами перейдите в личный кабинет на нашем сайте.
Там вы можете продлить подписку, скачать конфигурацию и получить QR-код для быстрой настройки.
`;
    
    bot.sendMessage(chatId, statusMessage, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔑 Получить новый ключ', callback_data: 'trial_key' }],
          [{ text: '👤 Личный кабинет', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/profile` }],
          [{ text: '💰 Купить подписку', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/pricing` }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при проверке статуса подписки:', error);
    bot.sendMessage(chatId, 
      '❌ *Произошла ошибка при проверке статуса подписки*\n\n' +
      'Пожалуйста, попробуйте позже или обратитесь в поддержку.',
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработка команды /faq - часто задаваемые вопросы
bot.onText(/^\/faq$/, (msg) => {
  const chatId = msg.chat.id;
  sendFaqMessage(chatId);
});

// Функция отправки сообщения FAQ
function sendFaqMessage(chatId) {
  const faqMessage = `
❓ *Часто задаваемые вопросы* ❓

*🔍 Что такое KittyPoopVPN?*
KittyPoopVPN - это сервис виртуальной частной сети, обеспечивающий безопасное и анонимное подключение к интернету.

*📱 Как настроить VPN на моем устройстве?*
Мы используем протокол VLESS. После покупки подписки вы получите VLESS-ключ и QR-код, которые можно импортировать в приложение V2rayTUN (iOS) или V2rayNG (Android).

*🔢 На скольких устройствах можно использовать один ключ?*
Зависит от плана подписки:
• 🔵 Базовый план: до 2 устройств
• 🟣 Премиум план: до 5 устройств
• ⭐ Безлимитный план: без ограничений

*⏱️ Есть ли бесплатный пробный период?*
Да, вы можете получить пробный ключ на 1 час для тестирования сервиса.

*💰 Какие платежные методы вы принимаете?*
Мы принимаем криптовалюты: ETH, USDT (ERC20/TRC20) и TON.

*🔄 Как продлить подписку?*
Посетите раздел "Мои ключи" на нашем сайте и выберите опцию продления для нужного ключа.

*📞 Как связаться с поддержкой?*
Вы можете написать нам на адрес support@kittypoopvpn.com или через Telegram @kittypoopvpn_support.

*⬇️ Где скачать приложения для подключения?*
Выберите ссылку для вашей платформы из кнопок ниже.
`;

  bot.sendMessage(chatId, faqMessage, { 
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        // Ссылки на приложения
        [
          { text: '📱 Android V2rayNG', url: 'https://play.google.com/store/apps/details?id=com.v2ray.ang' },
          { text: '🍎 iOS V2rayTUN', url: 'https://apps.apple.com/us/app/v2raytun/id1501776752' }
        ],
        [
          { text: '🖥️ Windows v2rayN', url: 'https://github.com/2dust/v2rayN/releases' },
          { text: '🍏 macOS V2rayU', url: 'https://github.com/yanue/V2rayU/releases' }
        ],
        [
          { text: '🐧 Linux v2ray', url: 'https://github.com/v2fly/v2ray-core' }
        ],
        // Другие кнопки
        [{ text: '📚 Полная документация', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/faq` }],
        [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
      ]
    }
  });
}

// Запуск сервера
async function startServer() {
  // Подключаемся к базе данных
  const connected = await connectDB();
  
  if (!connected) {
    console.error('Не удалось подключиться к базе данных. Выход...');
    process.exit(1);
  }
  
  // Запускаем проверку статуса ключей с использованием улучшенного менеджера ключей
  await keyManager.startKeyStatusChecker();
  
  // Запускаем сервер
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
}

// Запускаем сервер
startServer();

// Обработка callback запросов от inline-кнопок
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  // Отправляем уведомление, что запрос обрабатывается
  await bot.answerCallbackQuery(callbackQuery.id, { text: 'Обрабатываю запрос...' });
  
  // Обработка подтверждения платежа администратором
  if (data.startsWith('approve_payment_')) {
    // Проверяем, что запрос от администратора
    if (userId.toString() !== '434532312') {
      await bot.sendMessage(chatId, 
        '❌ *Доступ запрещен*\n\n' +
        'Только администратор может подтверждать платежи.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Получаем ID платежа из callback_data
    const paymentId = data.replace('approve_payment_', '');
    
    try {
      // Ищем платеж в базе данных
      const payment = await Payment.findByPaymentId(paymentId);
      
      if (!payment) {
        await bot.sendMessage(chatId, 
          '❌ *Платеж не найден*\n\n' +
          `Платеж с ID ${paymentId} не найден в базе данных.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // Проверяем, можно ли подтвердить платеж
      if (payment.status !== 'waiting_confirmation') {
        await bot.sendMessage(chatId, 
          '⚠️ *Невозможно подтвердить платеж*\n\n' +
          `Текущий статус платежа: ${payment.status}\n` +
          'Подтвердить можно только платежи со статусом "waiting_confirmation".',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // Отправляем сообщение о начале обработки
      await bot.sendMessage(chatId, 
        '🔄 *Обработка платежа*\n\n' +
        'Платеж подтвержден. Генерирую VPN-ключ...',
        { parse_mode: 'Markdown' }
      );
      
      // Генерируем VPN ключ
      const vpnKeyData = await generateVpnKey(payment.plan, payment.period, payment.userId);
      
      // Обновляем статус платежа
      await Payment.update(paymentId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        vpnKeyUuid: vpnKeyData.uuid
      });
      
      // Отправляем ключ пользователю
      await sendVpnKeyToUser(payment, vpnKeyData);
      
      // Отправляем сообщение администратору о успешном подтверждении
      await bot.sendMessage(chatId, 
        '✅ *Платеж успешно подтвержден*\n\n' +
        `Платеж с ID ${paymentId} был подтвержден.\n` +
        `VPN-ключ (${vpnKeyData.uuid}) успешно сгенерирован и отправлен пользователю.`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Ошибка при подтверждении платежа администратором:', error);
      await bot.sendMessage(chatId, 
        '❌ *Произошла ошибка*\n\n' +
        'Не удалось подтвердить платеж. Пожалуйста, попробуйте позже или проверьте логи сервера.',
        { parse_mode: 'Markdown' }
      );
    }
    
    return;
  }
  
  // Обработка отклонения платежа администратором
  if (data.startsWith('reject_payment_')) {
    // Проверяем, что запрос от администратора
    if (userId.toString() !== '434532312') {
      await bot.sendMessage(chatId, 
        '❌ *Доступ запрещен*\n\n' +
        'Только администратор может отклонять платежи.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Получаем ID платежа из callback_data
    const paymentId = data.replace('reject_payment_', '');
    
    try {
      // Ищем платеж в базе данных
      const payment = await Payment.findByPaymentId(paymentId);
      
      if (!payment) {
        await bot.sendMessage(chatId, 
          '❌ *Платеж не найден*\n\n' +
          `Платеж с ID ${paymentId} не найден в базе данных.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // Проверяем, можно ли отклонить платеж
      if (payment.status !== 'waiting_confirmation') {
        await bot.sendMessage(chatId, 
          '⚠️ *Невозможно отклонить платеж*\n\n' +
          `Текущий статус платежа: ${payment.status}\n` +
          'Отклонить можно только платежи со статусом "waiting_confirmation".',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // Обновляем статус платежа
      await Payment.update(paymentId, {
        status: 'rejected',
        completedAt: new Date().toISOString()
      });
      
      // Отправляем сообщение пользователю об отклонении платежа
      const user = await User.findById(payment.userId);
      if (user && user.telegramId) {
        await bot.sendMessage(user.telegramId, 
          '❌ *Ваш платеж был отклонен*\n\n' +
          `Ваш платеж на сумму ${payment.amount} ${payment.currency} был отклонен администратором.\n` +
          'Пожалуйста, свяжитесь с поддержкой для выяснения причины или попробуйте другой способ оплаты.',
          { parse_mode: 'Markdown' }
        );
      }
      
      // Отправляем сообщение администратору об отклонении
      await bot.sendMessage(chatId, 
        '✅ *Платеж отклонен*\n\n' +
        `Платеж с ID ${paymentId} был успешно отклонен.\n` +
        'Пользователь уведомлен об отклонении платежа.',
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Ошибка при отклонении платежа администратором:', error);
      await bot.sendMessage(chatId, 
        '❌ *Произошла ошибка*\n\n' +
        'Не удалось отклонить платеж. Пожалуйста, попробуйте позже или проверьте логи сервера.',
        { parse_mode: 'Markdown' }
      );
    }
    
    return;
  }
  
  if (data === 'my_profile') {
    // Проверяем, зарегистрирован ли пользователь
    const user = await User.findByTelegramId(userId);
    
    if (!user) {
      await bot.sendMessage(chatId, 
        '❌ *Вы не зарегистрированы в системе*\n\n' +
        'Для использования сервиса необходимо авторизоваться через Telegram на нашем сайте.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Авторизоваться', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
            ]
          }
        }
      );
      return;
    }
    
    // Получаем все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId: user.id });
    
    // Если у пользователя нет ключей
    if (!vpnKeys || vpnKeys.length === 0) {
      return bot.sendMessage(chatId, 
        '🔍 *У вас пока нет VPN ключей*\n\n' +
        'Для приобретения подписки и получения ключа, пожалуйста, перейдите на наш сайт.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Купить подписку', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/pricing` }],
              [{ text: '« Назад', callback_data: 'back_to_main' }]
            ]
          }
        }
      );
    }
    
    // Сортируем ключи: сначала активные, потом по дате истечения (сначала те, что истекают позже)
    vpnKeys.sort((a, b) => {
      // Если один активен, а другой нет, активный идет первым
      if (a.isActive !== b.isActive) {
        return b.isActive - a.isActive;
      }
      // Иначе сортируем по дате истечения (сначала те, что истекают позже)
      return new Date(b.expires) - new Date(a.expires);
    });
    
    // Отправляем информацию о пользователе
    const userInfoMessage = `
🔹 *Профиль пользователя* 🔹

👤 *${user.firstName || ''} ${user.lastName || ''}*
${user.username ? `@${user.username}` : ''}
ID: \`${user.telegramId}\`
    `;
    
    await bot.sendMessage(chatId, userInfoMessage, { parse_mode: 'Markdown' });
    
    // Отправляем каждый ключ отдельным сообщением с кнопками для управления
    for (let i = 0; i < vpnKeys.length; i++) {
      const key = vpnKeys[i];
      const expiryDate = new Date(key.expires);
      const isExpired = new Date() > expiryDate;
      
      // Определяем статус и эмодзи
      let status, statusEmoji;
      if (key.isActive === 1 && !isExpired) {
        status = 'Активен';
        statusEmoji = '✅';
      } else if (isExpired) {
        status = 'Истек';
        statusEmoji = '⏱️';
      } else {
        status = 'Отключен';
        statusEmoji = '❌';
      }
      
      // Определяем тип плана и его эмодзи
      let planType, planEmoji;
      switch (key.plan) {
        case 'basic':
          planType = 'Базовый';
          planEmoji = '🔵';
          break;
        case 'premium':
          planType = 'Премиум';
          planEmoji = '🟣';
          break;
        case 'unlimited':
          planType = 'Безлимитный';
          planEmoji = '⭐';
          break;
        case 'trial':
          planType = 'Пробный';
          planEmoji = '🔶';
          break;
        default:
          planType = key.plan.charAt(0).toUpperCase() + key.plan.slice(1);
          planEmoji = '🔹';
      }
      
      // Форматируем дату истечения срока
      const formattedExpiry = expiryDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Определяем прогресс подписки в виде эмодзи прогресс-бара
      let progressBar = '';
      if (!isExpired && key.isActive === 1) {
        const totalDuration = (new Date(key.expires) - new Date(key.created));
        const elapsed = (Date.now() - new Date(key.created));
        const percentage = Math.min(100, Math.max(0, Math.floor(elapsed / totalDuration * 100)));
        
        // Создаем прогресс-бар из эмодзи
        const fullBlocks = Math.floor(percentage / 10);
        
        progressBar = '▓'.repeat(fullBlocks) + '░'.repeat(10 - fullBlocks) + ` ${percentage}%`;
      }
      
      // Подготавливаем сообщение для каждого ключа
      const keyMessage = `
${planEmoji} *VPN ключ #${i+1} - ${planType}*

🔑 *ID ключа:* \`${key.uuid}\`
${statusEmoji} *Статус:* ${status}
📅 *Срок действия:* ${formattedExpiry}
${key.period ? `⏳ *Период:* ${key.period} мес.\n` : ''}
${progressBar ? `📊 *Осталось:* ${progressBar}\n` : ''}
${key.isTrial === 1 ? '⚠️ Это пробный ключ\n' : ''}
`;
      
      // Определяем кнопки в зависимости от статуса ключа
      const keyboardButtons = [];
      
      // Добавляем кнопку для просмотра конфигурации
      if (key.isActive === 1 && !isExpired) {
        keyboardButtons.push([
          { text: '📋 Показать конфигурацию', callback_data: `show_config_${key.uuid}` }
        ]);
      }
      
      // Добавляем кнопку для продления, если ключ не пробный
      if (key.isTrial !== 1) {
        keyboardButtons.push([
          { text: '🔄 Продлить подписку', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/profile?renew=${key.uuid}` }
        ]);
      }
      
      // Добавляем общие кнопки
      keyboardButtons.push([
        { text: '🌐 Перейти на сайт', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/profile` }
      ]);
      
      await bot.sendMessage(chatId, keyMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboardButtons
        }
      });
    }
    
    // Добавляем кнопку "Назад" после всех ключей
    await bot.sendMessage(chatId, 
      '*Управление ключами*\n\n' +
      'Для более детального управления ключами, пожалуйста, воспользуйтесь нашим сайтом.', 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '« Назад в главное меню', callback_data: 'back_to_main' }]
          ]
        }
      }
    );
  } else if (data === 'back_to_main') {
    // Отправляем главное меню
    bot.sendPhoto(chatId, 'https://i.imgur.com/V1RwQVE.jpg', {
      caption: `🎉 *Привет! Я официальный бот KittyPoopVPN* 🐱\n\n`+
        `Здесь вы можете управлять своим VPN-аккаунтом и получать информацию о ваших ключах.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '👤 Личный кабинет', callback_data: 'my_profile' }],
          [{ text: '🌐 Перейти на сайт', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
        ]
      }
    });
  } else if (data === 'trial_key') {
    // Проверяем, зарегистрирован ли пользователь
    const user = await User.findByTelegramId(userId);
    
    if (!user) {
      await bot.sendMessage(chatId, 
        '❌ *Вы не зарегистрированы в системе*\n\n' +
        'Для получения тестового ключа необходимо сначала авторизоваться через Telegram на нашем сайте.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Авторизоваться', url: process.env.FRONTEND_URL || 'https://kittypoopvpn.com' }]
            ]
          }
        }
      );
      return;
    }
    
    // Проверяем, есть ли уже активный тестовый ключ у пользователя
    const activeKeys = await VpnKey.find({ userId: user.id, isActive: 1, isTrial: 1 });
    
    if (activeKeys && activeKeys.length > 0) {
      const expiryDate = new Date(activeKeys[0].expires);
      const formattedDate = expiryDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await bot.sendMessage(chatId, 
        '⚠️ *У вас уже есть активный тестовый ключ*\n\n' +
        `Ваш ключ действителен до: ${formattedDate}\n\n` +
        'Вы можете использовать этот ключ или дождаться окончания его срока действия, чтобы получить новый тестовый ключ.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'my_profile' }]
            ]
          }
        }
      );
      return;
    }
    
    // Создаем новый тестовый ключ
    await bot.sendMessage(chatId, '🔄 *Генерирую тестовый ключ...*', { parse_mode: 'Markdown' });
    
    try {
      // Генерируем UUID для ключа
      const uuid = `vpn_${crypto.randomBytes(8).toString('hex')}`;
      
      // Устанавливаем срок действия ключа - 1 час от текущего времени
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Генерируем конфигурацию VPN
      const vpnConfig = `client
dev tun
proto udp
remote vpn.kittypoopvpn.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3
key-direction 1
<key>
${crypto.randomBytes(64).toString('base64')}
</key>
<cert>
${crypto.randomBytes(64).toString('base64')}
</cert>
<ca>
${crypto.randomBytes(64).toString('base64')}
</ca>
<tls-auth>
${crypto.randomBytes(64).toString('base64')}
</tls-auth>`;
      
      // Создаем запись о пробном ключе в базе данных
      const vpnKeyData = {
        uuid,
        userId: user.id,
        plan: 'trial',
        period: 0, // 0 месяцев для пробного ключа
        created: now.toISOString(),
        expires: expiry.toISOString(),
        isActive: 1,
        isTrial: 1,
        config: vpnConfig
      };
      
      const vpnKey = await VpnKey.create(vpnKeyData);
      
      // Создаем QR-код для конфигурации VPN
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(vpnConfig)}`;
      
      // Форматируем дату истечения срока
      const formattedExpiry = expiry.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Отправляем QR-код с кратким описанием
      await bot.sendPhoto(chatId, qrCodeUrl, {
        caption: `🎉 *Ваш тестовый ключ готов!* 🎉\n\nНиже QR-код для быстрой настройки.\nСейчас отправлю детальную информацию и инструкции.`,
        parse_mode: 'Markdown'
      });
      
      // Отправляем подробную информацию о ключе
      const message = `
📋 *Детали тестового ключа:*
• UUID: \`${uuid}\`
• Тип: OpenVPN
• План: Тестовый (1 час)
• Действителен до: ${formattedExpiry}

📱 *Инструкция по установке:*
1. Скачайте и установите приложение OpenVPN на ваше устройство
2. Скопируйте конфигурацию ниже или используйте QR-код
3. Создайте новый профиль в приложении и вставьте конфигурацию
4. Подключитесь к серверу

⚙️ *Конфигурация:*
\`\`\`
${vpnConfig}
\`\`\`

⏱️ Ваш тестовый ключ будет активен в течение 1 часа.
После истечения срока действия вы можете приобрести полную подписку на нашем сайте.
      `;
      
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '« Назад в личный кабинет', callback_data: 'my_profile' }]
          ]
        }
      });
      
    } catch (error) {
      console.error('Ошибка при создании тестового ключа:', error);
      await bot.sendMessage(chatId, 
        '❌ *Произошла ошибка при создании тестового ключа*\n\n' +
        'Пожалуйста, попробуйте позже или обратитесь в поддержку.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'my_profile' }]
            ]
          }
        }
      );
    }
  } else if (data.startsWith('show_config_')) {
    // Извлекаем UUID ключа из callback data
    const keyUuid = data.replace('show_config_', '');
    
    try {
      // Находим ключ в базе данных
      const key = await VpnKey.findByUuid(keyUuid);
      
      if (!key) {
        await bot.sendMessage(chatId, 
          '❌ *Ключ не найден*\n\n' +
          'Указанный ключ не найден в базе данных. Возможно, он был удален.',
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад', callback_data: 'my_profile' }]
              ]
            }
          }
        );
        return;
      }
      
      // Проверяем, принадлежит ли ключ этому пользователю
      const user = await User.findByTelegramId(userId);
      
      if (!user || key.userId !== user.id) {
        await bot.sendMessage(chatId, 
          '❌ *Доступ запрещен*\n\n' +
          'У вас нет доступа к этому ключу.',
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад', callback_data: 'my_profile' }]
              ]
            }
          }
        );
        return;
      }
      
      // Проверяем, активен ли ключ
      const now = new Date();
      const expiryDate = new Date(key.expires);
      const isExpired = now > expiryDate;
      
      if (isExpired || key.isActive !== 1) {
        await bot.sendMessage(chatId, 
          '⚠️ *Ключ неактивен*\n\n' +
          'Этот ключ больше не активен. Пожалуйста, продлите подписку или приобретите новый ключ.',
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💰 Продлить подписку', url: `${process.env.FRONTEND_URL || 'https://kittypoopvpn.com'}/profile?renew=${keyUuid}` }],
                [{ text: '« Назад', callback_data: 'my_profile' }]
              ]
            }
          }
        );
        return;
      }
      
      // Создаем QR-код для конфигурации VPN
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(key.config)}`;
      
      // Отправляем QR-код с кратким описанием
      await bot.sendPhoto(chatId, qrCodeUrl, {
        caption: `🔑 *Конфигурация VPN ключа*\n\nNВы можете отсканировать QR-код для быстрой настройки или скопировать конфигурацию ниже.`,
        parse_mode: 'Markdown'
      });
      
      // Отправляем конфигурацию ключа
      await bot.sendMessage(chatId, 
        `📋 *Конфигурация ключа* \`${keyUuid}\`\n\n` +
        '```\n' +
        `${key.config}\n` +
        '```\n\n' +
        '📱 *Инструкция по установке:*\n' +
        '1. Скачайте и установите приложение OpenVPN на ваше устройство\n' +
        '2. Скопируйте конфигурацию выше или используйте QR-код\n' +
        '3. Создайте новый профиль в приложении и вставьте конфигурацию\n' +
        '4. Подключитесь к серверу',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад к профилю', callback_data: 'my_profile' }]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка при показе конфигурации ключа:', error);
      await bot.sendMessage(chatId, 
        '❌ *Произошла ошибка*\n\n' +
        'Не удалось получить конфигурацию ключа. Пожалуйста, попробуйте позже или обратитесь в поддержку.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'my_profile' }]
            ]
          }
        }
      );
    }
  }
});

// Добавляем API для проверки статуса ключей
app.get('/api/admin/keys/status', async (req, res) => {
  try {
    const stats = await keyManager.getKeysStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Ошибка при получении статистики ключей:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики ключей'
    });
  }
});

// Добавляем API для очистки старых тестовых ключей
app.post('/api/admin/keys/cleanup', async (req, res) => {
  try {
    const daysAgo = req.body.daysAgo || 7;
    const result = await keyManager.cleanupOldTrialKeys(daysAgo);
    res.json({
      success: true,
      deleted: result.deleted
    });
  } catch (error) {
    console.error('Ошибка при очистке старых ключей:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при очистке старых ключей'
    });
  }
});

// API для создания платежа через ручной перевод на Тинькофф
app.post('/api/manual-payment', async (req, res) => {
  try {
    const { amount, currency, plan, period, userId } = req.body;
    
    // Валидация входных данных
    if (!plan || !period || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Не указаны все необходимые параметры'
      });
    }

    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Рассчитываем стоимость в зависимости от плана и периода
    let finalAmount;
    if (amount) {
      // Если сумма уже задана, используем её
      finalAmount = amount;
    } else {
      // Рассчитываем сумму на основе плана и периода
      if (period === 'yearly' || period === 12) {
        finalAmount = 1500; // Годовая подписка - 1500₽
      } else if (period === 'quarterly' || period === 3) {
        finalAmount = 500; // Квартальная подписка - 500₽
      } else if (period === 'monthly' || period === 1 || 
                (typeof period === 'string' && period.toLowerCase() === 'monthly')) {
        finalAmount = 200; // Месячная подписка - 200₽
      } else {
        // По умолчанию - месячная подписка
        finalAmount = 200;
      }
      
      // Применяем модификаторы в зависимости от выбранного плана
      if (plan === 'premium') {
        // Премиум план (Наш слоняра) - всегда годовой
        finalAmount = 1500;
      }
    }
    
    // Создаем ID платежа
    const paymentId = generatePaymentId();
    
    // Вычисляем время истечения платежа (24 часа)
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Определяем числовой период для хранения в БД
    let numericPeriod;
    if (period === 'yearly') {
      numericPeriod = 12;
    } else if (period === 'quarterly') {
      numericPeriod = 3;
    } else if (period === 'monthly') {
      numericPeriod = 1;
    } else {
      // Если период уже задан числом
      numericPeriod = parseInt(period);
      if (isNaN(numericPeriod) || numericPeriod <= 0) {
        numericPeriod = 1; // По умолчанию 1 месяц
      }
    }
    
    // Создаем запись о платеже в базе данных
    const paymentData = {
      paymentId,
      userId,
      status: 'pending',
      amount: finalAmount,
      currency: 'RUB',
      method: 'manual_tinkoff',
      cardNumber: '2200700774500382', // Номер карты Тинькофф
      plan,
      period: numericPeriod,
      expiryTime: expiryTime.toISOString()
    };
    
    const payment = await Payment.create(paymentData);
    
    // Отправляем в ответ все необходимые данные
    return res.json({
      success: true,
      payment: {
        paymentId,
        amount: finalAmount,
        currency: 'RUB',
        cardNumber: '2200700774500382',
        plan,
        period,
        expiryTime
      }
    });
  } catch (error) {
    console.error('Ошибка при создании платежа через ручной перевод:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при создании платежа'
    });
  }
});

// API для подтверждения платежа пользователем (после перевода денег)
app.post('/api/manual-payment/:paymentId/confirm', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Ищем платеж в базе данных
    const payment = await Payment.findByPaymentId(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Платеж не найден'
      });
    }
    
    // Проверяем, не истек ли срок ожидания платежа
    const now = new Date();
    if (payment.status !== 'pending' || now > new Date(payment.expiryTime)) {
      return res.status(400).json({
        success: false,
        message: 'Платеж уже обработан или истек срок ожидания'
      });
    }
    
    // Обновляем статус платежа на "waiting_confirmation"
    await Payment.update(paymentId, { status: 'waiting_confirmation' });
    
    // Получаем данные пользователя
    const user = await User.findById(payment.userId);
    
    // Отправляем уведомление администратору в Telegram
    if (user) {
      // ID администратора
      const adminTelegramId = '434532312';
      
      // Формируем сообщение для администратора
      const adminMessage = `
🔔 *Новая заявка на подтверждение платежа* 🔔

*Информация о платеже:*
• ID платежа: \`${paymentId}\`
• Сумма: ${payment.amount} ${payment.currency}
• План: ${payment.plan}
• Период: ${payment.period} мес.

*Информация о пользователе:*
• ID: ${user.id}
• Telegram: ${user.username ? '@' + user.username : user.telegramId}
• Имя: ${user.firstName || ''} ${user.lastName || ''}

Пожалуйста, проверьте поступление средств на карту Тинькофф и подтвердите или отклоните платеж.
      `;
      
      // Отправляем сообщение администратору с кнопками подтверждения/отклонения
      try {
        await bot.sendMessage(adminTelegramId, adminMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Подтвердить', callback_data: `approve_payment_${paymentId}` },
                { text: '❌ Отклонить', callback_data: `reject_payment_${paymentId}` }
              ]
            ]
          }
        });
        
        // Также отправляем сообщение пользователю
        if (user.telegramId) {
          await bot.sendMessage(user.telegramId, 
            `🔄 *Ваш платеж ожидает подтверждения*\n\n` +
            `Ваш платеж на сумму ${payment.amount} ${payment.currency} отправлен на проверку администратору.\n` +
            `Обычно проверка занимает не более 30 минут. Вы получите уведомление, когда платеж будет подтвержден.`,
            { parse_mode: 'Markdown' }
          );
        }
        
      } catch (error) {
        console.error('Ошибка при отправке уведомления администратору:', error);
      }
    }
    
    return res.json({
      success: true,
      status: 'waiting_confirmation',
      message: 'Платеж ожидает подтверждения администратором'
    });
  } catch (error) {
    console.error('Ошибка при подтверждении платежа пользователем:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при подтверждении платежа'
    });
  }
}); 