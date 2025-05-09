const express = require('express');
const crypto = require('crypto');
const blockchainService = require('../blockchainService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const VpnKey = require('../models/VpnKey');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const router = express.Router();

// Инициализация бота для отправки уведомлений
const token = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
const bot = new TelegramBot(token, { polling: false });

// Хранилище для таймеров проверки платежей
const paymentTimers = new Map();

// Функция для логирования
const logger = {
  info: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  },
  error: (message, error = null, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error ? { message: error.message, stack: error.stack } : null,
      ...data
    };
    console.error(JSON.stringify(logEntry));
  },
  warning: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      message,
      ...data
    };
    console.warn(JSON.stringify(logEntry));
  }
};

// Генерация уникального ID платежа
const generatePaymentId = () => {
  return 'pay_' + crypto.randomBytes(10).toString('hex');
};

// API для создания крипто-платежа
router.post('/create', async (req, res) => {
  try {
    const { amount, currency, plan, period, userId } = req.body;
    
    logger.info('Получен запрос на создание платежа', { userId, plan, period, currency });
    
    // Валидация входных данных
    if (!amount || !currency || !plan || !period || !userId) {
      logger.warning('Неполные данные платежа', { 
        received: { amount, currency, plan, period, userId } 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Не указаны все необходимые параметры'
      });
    }

    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      logger.warning('Пользователь не найден при создании платежа', { userId });
      
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Генерация платежного адреса
    let cryptoAddress;
    try {
      cryptoAddress = await blockchainService.generatePaymentAddress(currency);
      logger.info('Сгенерирован адрес для платежа', { currency, cryptoAddress });
    } catch (addrError) {
      logger.error('Ошибка при генерации адреса платежа', addrError, { currency });
      
      return res.status(500).json({
        success: false,
        message: 'Не удалось сгенерировать адрес для платежа'
      });
    }
    
    // Конвертация суммы в крипто (в реальности должен использоваться API курса валют)
    let cryptoAmount;
    const rates = {
      eth: 3000, // USD за 1 ETH
      usdt_erc20: 1, // USD за 1 USDT
      usdt_trc20: 1, // USD за 1 USDT
      ton: 5 // USD за 1 TON
    };
    
    // Проверка поддерживаемой валюты
    if (!rates[currency]) {
      logger.warning('Неподдерживаемая валюта платежа', { currency });
      
      return res.status(400).json({
        success: false,
        message: 'Указана неподдерживаемая валюта'
      });
    }
    
    cryptoAmount = parseFloat((amount / rates[currency]).toFixed(8));
    
    // Создаем ID платежа
    const paymentId = generatePaymentId();
    
    // Вычисляем время истечения платежа (30 минут)
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000);
    
    // Создаем запись о платеже в базе данных
    const payment = new Payment({
      paymentId,
      userId: user._id,
      status: 'pending',
      amount,
      currency,
      cryptoAmount,
      cryptoAddress,
      plan,
      period,
      expiryTime
    });
    
    try {
      await payment.save();
      logger.info('Создан новый платеж', { 
        paymentId, 
        userId: user._id, 
        amount, 
        currency, 
        plan, 
        period 
      });
    } catch (dbError) {
      logger.error('Ошибка при сохранении платежа в БД', dbError, { paymentId });
      
      return res.status(500).json({
        success: false,
        message: 'Не удалось сохранить платеж в базе данных'
      });
    }
    
    // Запускаем проверку платежа
    try {
      startPaymentVerification(paymentId);
      logger.info('Запущена проверка платежа', { paymentId });
    } catch (verifyError) {
      logger.error('Ошибка при запуске проверки платежа', verifyError, { paymentId });
      // Не возвращаем ошибку клиенту, так как платеж уже создан
    }
    
    // Отправляем в ответ все необходимые данные
    return res.json({
      success: true,
      payment: {
        paymentId,
        amount,
        currency,
        cryptoAmount,
        cryptoAddress,
        plan,
        period,
        expiryTime
      }
    });
  } catch (error) {
    logger.error('Необработанная ошибка при создании крипто-платежа', error, { 
      body: req.body 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при создании платежа'
    });
  }
});

// API для проверки статуса платежа
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    logger.info('Получен запрос на проверку статуса платежа', { paymentId });
    
    // Ищем платеж в базе данных
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      logger.warning('Платеж не найден при проверке статуса', { paymentId });
      
      return res.status(404).json({
        success: false,
        message: 'Платеж не найден'
      });
    }
    
    // Проверяем, не истек ли срок ожидания платежа
    const now = new Date();
    if (payment.status === 'pending' && now > payment.expiryTime) {
      logger.info('Платеж истек', { paymentId, status: payment.status });
      
      payment.status = 'expired';
      await payment.save();
      
      // Останавливаем таймер проверки, если он существует
      if (paymentTimers.has(paymentId)) {
        clearInterval(paymentTimers.get(paymentId));
        paymentTimers.delete(paymentId);
        logger.info('Остановлена проверка истекшего платежа', { paymentId });
      }
    }
    
    // Если платеж выполнен, возвращаем также информацию о ключе
    let vpnKey = null;
    if (payment.status === 'completed' && payment.vpnKeyUuid) {
      try {
        vpnKey = await VpnKey.findOne({ uuid: payment.vpnKeyUuid });
        if (!vpnKey) {
          logger.warning('VPN ключ не найден для завершенного платежа', { 
            paymentId, 
            vpnKeyUuid: payment.vpnKeyUuid 
          });
        }
      } catch (keyError) {
        logger.error('Ошибка при поиске VPN ключа', keyError, { 
          paymentId,
          vpnKeyUuid: payment.vpnKeyUuid
        });
      }
    }
    
    logger.info('Успешная проверка статуса платежа', { 
      paymentId, 
      status: payment.status 
    });
    
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
    logger.error('Необработанная ошибка при проверке статуса платежа', error, { 
      paymentId: req.params.paymentId 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при проверке статуса платежа'
    });
  }
});

// API для получения истории платежей пользователя
router.get('/history/:userId', async (req, res) => {
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

// Функция для периодической проверки статуса платежа
async function startPaymentVerification(paymentId) {
  try {
    logger.info('Запуск проверки платежа', { paymentId });
    
    // Проверяем, нет ли уже активного таймера для этого платежа
    if (paymentTimers.has(paymentId)) {
      clearInterval(paymentTimers.get(paymentId));
      logger.info('Перезапуск существующего таймера проверки платежа', { paymentId });
    }
    
    // Создаем интервал для периодической проверки платежа
    const checkInterval = setInterval(async () => {
      try {
        const payment = await Payment.findOne({ paymentId });
        
        if (!payment) {
          logger.warning('Платеж не найден при автоматической проверке', { paymentId });
          clearInterval(checkInterval);
          paymentTimers.delete(paymentId);
          return;
        }
        
        // Если платеж уже завершен или истек, останавливаем проверку
        if (payment.status !== 'pending') {
          logger.info('Платеж больше не в ожидании, останавливаем проверку', { 
            paymentId, 
            status: payment.status 
          });
          clearInterval(checkInterval);
          paymentTimers.delete(paymentId);
          return;
        }
        
        // Проверяем, не истек ли срок ожидания платежа
        const now = new Date();
        if (now > payment.expiryTime) {
          logger.info('Платеж истек во время проверки', { paymentId });
          payment.status = 'expired';
          await payment.save();
          clearInterval(checkInterval);
          paymentTimers.delete(paymentId);
          return;
        }
        
        // Проверяем статус платежа в блокчейне (эмуляция)
        // В реальном приложении здесь должен быть запрос к блокчейн-API
        const blockchainStatus = await blockchainService.checkPaymentStatus(
          payment.cryptoAddress, 
          payment.cryptoAmount, 
          payment.currency
        );
        
        logger.info('Результат проверки блокчейна', { 
          paymentId, 
          status: blockchainStatus.status 
        });
        
        if (blockchainStatus.status === 'completed') {
          // Платеж подтвержден, обновляем статус
          payment.status = 'completed';
          payment.completedAt = new Date();
          payment.transactionId = blockchainStatus.transactionId;
          
          // Генерируем VPN ключ
          try {
            const vpnKey = await generateVpnKey(payment.plan, payment.period, payment.userId);
            payment.vpnKeyUuid = vpnKey.uuid;
            logger.info('Создан VPN ключ для платежа', { 
              paymentId, 
              vpnKeyUuid: vpnKey.uuid 
            });
            
            // Отправляем уведомление пользователю
            await sendVpnKeyToUser(payment, vpnKey);
          } catch (keyError) {
            logger.error('Ошибка при генерации VPN ключа', keyError, { paymentId });
          }
          
          await payment.save();
          
          // Останавливаем дальнейшие проверки
          clearInterval(checkInterval);
          paymentTimers.delete(paymentId);
        }
      } catch (checkError) {
        logger.error('Ошибка при проверке статуса платежа', checkError, { paymentId });
      }
    }, 60000); // Проверка каждую минуту
    
    // Сохраняем интервал в хранилище
    paymentTimers.set(paymentId, checkInterval);
  } catch (error) {
    logger.error('Ошибка при запуске проверки платежа', error, { paymentId });
    throw error;
  }
}

// Функция для генерации VPN ключа
async function generateVpnKey(plan, period, userId) {
  try {
    logger.info('Генерация VPN ключа', { plan, period, userId });
    
    // В реальном приложении здесь должна быть интеграция с V2Ray API
    const uuid = 'vpn_' + crypto.randomBytes(10).toString('hex');
    const now = new Date();
    
    // Определяем срок действия ключа в месяцах
    let periodMonths;
    if (typeof period === 'number') {
      periodMonths = period;
    } else if (period === 'yearly') {
      periodMonths = 12;
    } else if (period === 'quarterly') {
      periodMonths = 3;
    } else {
      periodMonths = 1; // По умолчанию 1 месяц
    }
    
    // Вычисляем дату истечения
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + periodMonths);
    
    // Создаем конфигурацию для ключа
    const config = {
      server: process.env.VPN_SERVER_HOST || '134.209.91.29',
      port: 443,
      protocol: 'vless',
      uuid: uuid,
      tls: true,
      network: 'ws',
      path: '/vpn'
    };
    
    // Создаем запись о ключе в базе данных
    const vpnKey = new VpnKey({
      uuid,
      userId,
      plan,
      period: periodMonths,
      created: now,
      expires,
      isActive: true,
      config
    });
    
    await vpnKey.save();
    logger.info('VPN ключ успешно создан', { uuid });
    
    return vpnKey;
  } catch (error) {
    logger.error('Ошибка при генерации VPN ключа', error, { plan, period, userId });
    throw error;
  }
}

// Функция для отправки ключа пользователю
async function sendVpnKeyToUser(paymentData, vpnKeyData) {
  try {
    logger.info('Отправка VPN ключа пользователю', { 
      paymentId: paymentData.paymentId,
      userId: paymentData.userId
    });
    
    // Получаем данные пользователя
    const user = await User.findById(paymentData.userId);
    
    if (!user) {
      logger.warning('Пользователь не найден при отправке ключа', { 
        userId: paymentData.userId 
      });
      return;
    }
    
    // Если у пользователя есть Telegram ID, отправляем сообщение через бота
    if (user.telegramId) {
      try {
        // Создаем ссылку для импорта конфигурации в клиент
        const importLink = generateVpnImportLink(vpnKeyData.config);
        
        // Отправляем сообщение с деталями ключа
        await bot.sendMessage(
          user.telegramId,
          `🎉 *Ваш VPN-ключ готов!* 🎉\n\n`+
          `🔑 *UUID:* \`${vpnKeyData.uuid}\`\n`+
          `📆 *Действует до:* ${vpnKeyData.expires.toLocaleDateString()}\n`+
          `📊 *Тариф:* ${vpnKeyData.plan}\n\n`+
          `Для подключения используйте одно из предложенных приложений и импортируйте конфигурацию по ссылке ниже.\n\n`+
          `*Инструкция по настройке:*\n`+
          `1. Установите приложение V2Ray или Matsuri\n`+
          `2. Откройте приложение и нажмите "Импорт конфигурации"\n`+
          `3. Используйте данные ниже или отсканируйте QR-код\n\n`+
          `*Ссылка для импорта:*\n\`${importLink}\``,
          { parse_mode: 'Markdown' }
        );
        
        // Отправляем QR-код для быстрой настройки
        // В реальном приложении здесь должна быть генерация QR-кода
        logger.info('Успешно отправлено сообщение в Telegram', { 
          telegramId: user.telegramId 
        });
      } catch (telegramError) {
        logger.error('Ошибка при отправке сообщения в Telegram', telegramError, { 
          telegramId: user.telegramId 
        });
      }
    } else {
      logger.warning('У пользователя отсутствует Telegram ID', { 
        userId: paymentData.userId 
      });
    }
  } catch (error) {
    logger.error('Ошибка при отправке VPN ключа пользователю', error, { 
      paymentId: paymentData.paymentId 
    });
  }
}

// Функция для генерации ссылки импорта VPN конфигурации
function generateVpnImportLink(config) {
  try {
    // Формируем строку конфигурации в формате для импорта
    const configStr = `vless://${config.uuid}@${config.server}:${config.port}?security=tls&type=${config.network}&path=${config.path}#KittyPoopVPN`;
    
    return configStr;
  } catch (error) {
    logger.error('Ошибка при генерации ссылки для импорта VPN', error, { 
      config 
    });
    return '';
  }
}

module.exports = router; 