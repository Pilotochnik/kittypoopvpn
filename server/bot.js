const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const { User } = require('./models/User');
require('dotenv').config();

// Инициализация бота
const token = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Kittypoopvpn_bot';

// Настройки для бота
const botConfig = {
  baseApiUrl: "https://api.telegram.org",
  polling: {
    interval: 1000, // Увеличиваем интервал
    autoStart: true,
    params: {
      timeout: 30 // Увеличиваем таймаут
    }
  },
  request: {
    timeout: 60000, // Увеличиваем таймаут до 60 секунд
    retry: 5, // Увеличиваем количество попыток
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    agentOptions: {
      keepAlive: true,
      keepAliveMsecs: 90000,
      timeout: 60000,
      rejectUnauthorized: false // Отключаем проверку сертификата
    }
  }
};

// Генерация хэша для данных пользователя Telegram
const generateTelegramHash = (userData) => {
  const botTokenFirstPart = token.split(':')[0];
  const dataCheckArr = Object.keys(userData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${userData[key]}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  const secret = crypto.createHash('sha256').update(botTokenFirstPart).digest();
  
  return crypto.createHmac('sha256', secret)
              .update(dataCheckString)
              .digest('hex');
};

// Инициализация бота только если не в тестовом режиме и есть токен
let bot;
let pollingRetries = 0;
const MAX_POLLING_RETRIES = 5;

if (process.env.NODE_ENV !== 'test' && token) {
  try {
    bot = new TelegramBot(token, botConfig);

    // Улучшенная обработка ошибок бота
    bot.on('polling_error', async (error) => {
      console.error('Ошибка polling:', error.message);
      
      if (error.code === 'ETEGRAM') {
        console.log('Ошибка Telegram API, перезапуск бота...');
        await restartBot();
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.log('Ошибка сети, попытка переподключения...');
        pollingRetries++;
        
        if (pollingRetries <= MAX_POLLING_RETRIES) {
          await restartBot();
        } else {
          console.error(`Достигнуто максимальное количество попыток (${MAX_POLLING_RETRIES}). Бот остановлен.`);
          process.exit(1);
        }
      }
    });

    // Функция перезапуска бота
    async function restartBot() {
      try {
        await bot.stopPolling();
        console.log('Бот остановлен, ожидание 5 секунд перед перезапуском...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await bot.startPolling();
        console.log('Бот успешно перезапущен');
        pollingRetries = 0; // Сбрасываем счетчик при успешном перезапуске
      } catch (e) {
        console.error('Ошибка при перезапуске бота:', e);
        throw e;
      }
    }

    // Обработка команды /start с токеном авторизации
    bot.onText(/\/start auth_(.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const authToken = match[1];
      
      console.log(`Получен запрос на авторизацию с токеном: ${authToken}`);
      
      // Проверяем, что токен существует
      if (!global.authTokens || !global.authTokens.has(authToken)) {
        bot.sendMessage(chatId, '⛔️ Сессия авторизации не найдена или истекла. Попробуйте снова через сайт.');
        return;
      }
      
      const userData = {
        id: msg.from.id,
        first_name: msg.from.first_name || '',
        last_name: msg.from.last_name || '',
        username: msg.from.username || '',
        photo_url: '',
        auth_date: Math.floor(Date.now() / 1000)
      };
      
      userData.hash = generateTelegramHash(userData);
      
      // Обновляем существующий объект токена, добавляя userData
      const old = global.authTokens.get(authToken);
      
      try {
        const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
        if (photos && photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          const fileInfo = await bot.getFile(fileId);
          userData.photo_url = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
        }
      } catch (error) {
        console.error('Ошибка при получении фото профиля:', error);
      }

      // --- ОТПРАВКА callback на backend ---
      try {
        const axios = require('axios');
        await axios.post('http://localhost:5000/api/auth/telegram/callback', {
          token: authToken,
          ...userData
        });
        console.log('Callback авторизации Telegram успешно отправлен на backend');
        bot.sendMessage(chatId, '✅ Вы успешно авторизованы! Можете вернуться на сайт.');
      } catch (err) {
        console.error('Ошибка при отправке callback на backend:', err.message);
        bot.sendMessage(chatId, '❌ Ошибка при авторизации. Попробуйте ещё раз.');
      }
    });

    // Обработка обычной команды /start
    bot.onText(/^\/start$/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Добро пожаловать в KittyPoopVPN!');
    });

    console.log('Telegram бот успешно инициализирован');
  } catch (error) {
    console.error('Ошибка при инициализации бота:', error);
  }
}

function sendAdminNotification(message, paymentId = null) {
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (bot && adminChatId) {
    console.log(`[Telegram] Отправка уведомления админу (${adminChatId}): ${message}`);
    
    // Опции сообщения
    const options = { parse_mode: 'HTML' };
    
    // Если указан paymentId, добавляем кнопки подтверждения и отклонения
    if (paymentId) {
      options.reply_markup = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить платёж', callback_data: `confirm_${paymentId}` },
            { text: '❌ Отклонить платёж', callback_data: `reject_${paymentId}` }
          ]
        ]
      };
    }
    
    return bot.sendMessage(adminChatId, message, options)
      .then(() => console.log('[Telegram] Уведомление успешно отправлено'))
      .catch(e => console.error('[Telegram] Ошибка при отправке уведомления:', e.message));
  } else {
    console.warn('[Telegram] Бот не инициализирован или не указан ADMIN_TELEGRAM_CHAT_ID');
  }
  return Promise.resolve();
}

// Логируем переменные окружения при старте
console.log('[ENV] TELEGRAM_BOT_TOKEN:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('[ENV] ADMIN_TELEGRAM_CHAT_ID:', process.env.ADMIN_TELEGRAM_CHAT_ID);
console.log('[ENV] BOT_USERNAME:', BOT_USERNAME);

// Команда для админа: /confirm pay_xxx
if (bot) {
  // Обработка команды подтверждения платежа через текст
  bot.onText(/\/confirm (pay_[a-zA-Z0-9]+)/, async (msg, match) => {
    const paymentId = match[1];
    try {
      await confirmPayment(msg.chat.id, paymentId);
    } catch (e) {
      bot.sendMessage(msg.chat.id, `Ошибка при подтверждении платежа: ${e.message}`);
    }
  });
  
  // Обработка кнопок подтверждения и отклонения платежа
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    // Проверяем, что это админский чат
    if (chatId.toString() !== process.env.ADMIN_TELEGRAM_CHAT_ID) {
      return;
    }
    
    try {
      // Обрабатываем нажатие на кнопку подтверждения платежа
      if (data.startsWith('confirm_')) {
        const paymentId = data.replace('confirm_', '');
        await confirmPayment(chatId, paymentId);
        
        // Отвечаем на callback запрос
        await bot.answerCallbackQuery(query.id, { text: `Платеж ${paymentId} подтвержден!` });
        
        // Обновляем сообщение, чтобы убрать кнопки
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }
      
      // Обрабатываем нажатие на кнопку отклонения платежа
      if (data.startsWith('reject_')) {
        const paymentId = data.replace('reject_', '');
        await rejectPayment(chatId, paymentId);
        
        // Отвечаем на callback запрос
        await bot.answerCallbackQuery(query.id, { text: `Платеж ${paymentId} отклонен!` });
        
        // Обновляем сообщение, чтобы убрать кнопки
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }
    } catch (e) {
      console.error('Ошибка при обработке callback_query:', e);
      await bot.answerCallbackQuery(query.id, { 
        text: `Ошибка: ${e.message}`, 
        show_alert: true 
      });
    }
  });
}

// Функция подтверждения платежа
async function confirmPayment(chatId, paymentId) {
  const Payment = require('./models/Payment');
  const VpnKey = require('./models/VpnKey');
  
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    return bot.sendMessage(chatId, `Платеж ${paymentId} не найден.`);
  }
  if (payment.status === 'completed') {
    return bot.sendMessage(chatId, `Платеж ${paymentId} уже подтвержден.`);
  }
  
  try {
    // Импортируем функции из модуля payment.js
    const paymentModule = require('./routes/payment');
    const { generateVpnKey, sendVpnKeyToUser, getPlanName } = paymentModule;
    
    // Проверяем, что функции действительно существуют
    if (typeof generateVpnKey !== 'function') {
      console.error('Ошибка: generateVpnKey не является функцией');
      return bot.sendMessage(chatId, `Ошибка при генерации ключа: функция не найдена`);
    }
    
    // Генерируем VPN ключ
    console.log(`Генерация ключа для плана ${payment.plan}, периода ${payment.period}, пользователя ${payment.userId}`);
    const vpnKeyData = await generateVpnKey(payment.plan, payment.period, payment.userId);
    
    if (!vpnKeyData) {
      throw new Error('Не удалось сгенерировать ключ');
    }
    
    // ВАЖНО: сначала обновляем платеж для сохранения vpnKeyUuid, затем меняем статус
    const updateResult = await Payment.update(paymentId, { 
      vpnKeyUuid: vpnKeyData.uuid,
      status: 'completed',
      completedAt: new Date()
    });
    
    console.log(`Платеж ${paymentId} обновлен:`, updateResult ? 'успешно' : 'ошибка');
    
    // Проверяем, обновился ли платеж
    const updatedPayment = await Payment.findOne({ paymentId });
    if (!updatedPayment || updatedPayment.status !== 'completed' || !updatedPayment.vpnKeyUuid) {
      console.error(`Критическая ошибка: не удалось обновить платеж ${paymentId}`);
      throw new Error('Не удалось обновить платеж в базе данных');
    }
    
    // Отправляем ключ пользователю
    await sendVpnKeyToUser(updatedPayment, vpnKeyData);
    
    // Отправляем ключ также администратору для визуальной проверки
    const keyConfigText = typeof vpnKeyData.config === 'string' 
      ? vpnKeyData.config 
      : JSON.stringify(vpnKeyData.config);
    
    // Функция, определяющая период
    const getPeriodName = (period) => {
      if (typeof period === 'number') {
        return `${period} дней`;
      }
      switch(period) {
        case 'monthly': return 'месяц';
        case 'quarterly': return '3 месяца';
        case 'yearly': return 'год';
        default: return period;
      }
    };
    
    await bot.sendMessage(chatId, `✅ Платеж ${paymentId} подтвержден и ключ отправлен пользователю.`);
    
    // Отправляем администратору детали ключа
    await bot.sendMessage(chatId, 
      `📋 Сгенерированный VPN-ключ:\n\n` +
      `👤 Пользователь: ${payment.userId}\n` +
      `🔑 ID ключа: ${vpnKeyData.uuid}\n` +
      `📊 Тариф: ${getPlanName ? getPlanName(payment.plan) : payment.plan}\n` +
      `⏱️ Период: ${getPeriodName(payment.period)}\n` +
      `📆 Действует до: ${new Date(vpnKeyData.expires).toLocaleString('ru-RU')}`
    );
    
    // Отправляем конфигурацию отдельным сообщением без HTML-форматирования
    await bot.sendMessage(chatId, `Конфигурация:\n${keyConfigText}`);
    
    // Проверяем наличие ключа в базе данных
    const verifyKey = await VpnKey.findByUuid(vpnKeyData.uuid);
    if (!verifyKey) {
      console.error(`Предупреждение: ключ ${vpnKeyData.uuid} не найден в базе данных после генерации`);
      await bot.sendMessage(chatId, `⚠️ Предупреждение: ключ ${vpnKeyData.uuid} не был найден в базе данных. Возможно, не удалось сохранить его.`);
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при подтверждении платежа:', error);
    await bot.sendMessage(chatId, `❌ Ошибка при подтверждении платежа ${paymentId}: ${error.message}`);
    return false;
  }
}

// Функция отклонения платежа
async function rejectPayment(chatId, paymentId) {
  const Payment = require('./models/Payment');
  
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    return bot.sendMessage(chatId, `Платеж ${paymentId} не найден.`);
  }
  if (payment.status === 'rejected') {
    return bot.sendMessage(chatId, `Платеж ${paymentId} уже отклонен.`);
  }
  
  await Payment.update(paymentId, { status: 'rejected' });
  return bot.sendMessage(chatId, `Платеж ${paymentId} отклонен.`);
}

// Добавляем поддержку Telegram Web App
if (bot) {
  // Добавление кнопки меню для запуска веб-приложения
  bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/webapp', description: 'Открыть веб-приложение' }
  ]);

  // Обработка команды для открытия веб-приложения
  bot.onText(/\/webapp/, (msg) => {
    const chatId = msg.chat.id;
    const webAppUrl = process.env.WEBAPP_URL || 'https://kittypoop.vpn';
    
    bot.sendMessage(chatId, 'Откройте наше веб-приложение:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть KittyPoop VPN', web_app: { url: webAppUrl } }]
        ]
      }
    });
  });

  // Добавляем кнопку для веб-приложения в основную клавиатуру
  bot.onText(/\/start$/, (msg) => {
    const chatId = msg.chat.id;
    const webAppUrl = process.env.WEBAPP_URL || 'https://kittypoop.vpn';
    
    bot.sendMessage(chatId, 'Добро пожаловать в KittyPoopVPN! Выберите опцию:', {
      reply_markup: {
        keyboard: [
          [{ text: 'Открыть веб-приложение', web_app: { url: webAppUrl } }],
          [{ text: 'Помощь' }]
        ],
        resize_keyboard: true
      }
    });
  });
}

// Экспортирую объект с bot, authTokens, generateTelegramHash и sendAdminNotification
module.exports = {
  bot,
  authTokens: new Map(),
  generateTelegramHash,
  sendAdminNotification
}; 