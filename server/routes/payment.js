const express = require('express');
const crypto = require('crypto');
const blockchainService = require('../blockchainService');
const PaymentService = require('../models/Payment');
const User = require('../models/User');
const VpnKey = require('../models/VpnKey');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { sendAdminNotification } = require('../bot');
const { startPaymentVerification } = require('../services/paymentVerification');
const { logger } = require('../utils/logger');
require('dotenv').config();

const router = express.Router();

// Инициализация бота для отправки уведомлений
const token = process.env.TELEGRAM_BOT_TOKEN || '7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik';
const bot = new TelegramBot(token, { polling: false });

// Хранилище для таймеров проверки платежей
const paymentTimers = new Map();

// Хранилище для таймеров деактивации ключей
const deactivationTimers = new Map();

// Кеш для хранения курсов валют
const rateCache = new Map();
const RATE_CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Генерация уникального ID платежа
const generatePaymentId = () => {
  return 'pay_' + crypto.randomBytes(10).toString('hex');
};

// Получение реального курса валют через CoinGecko
async function getCryptoRate(currency) {
  try {
    // Проверяем кеш
    const cached = rateCache.get(currency);
    if (cached && (Date.now() - cached.timestamp) < RATE_CACHE_TTL) {
      return cached.rate;
    }

    const ids = {
      eth: 'ethereum',
      ton: 'the-open-network',
      usdt_erc20: 'tether',
      usdt_trc20: 'tether',
      usdt: 'tether',
      usdt_eth: 'tether'
    };

    const id = ids[currency];
    if (!id) {
      // Для manual_tinkoff возвращаем фиксированный курс 1:1
      if (currency === 'manual_tinkoff') {
        return { usd: 1, rub: 1 };
      }
      return null;
    }

    // Получаем курсы в USD и RUB
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,rub`
    );

    if (!res.data[id]) {
      throw new Error('Не удалось получить курс');
    }

    const rate = {
      usd: res.data[id].usd,
      rub: res.data[id].rub
    };

    // Сохраняем в кеш
    rateCache.set(currency, {
      rate,
      timestamp: Date.now()
    });

    return rate;
  } catch (e) {
    console.error('Ошибка получения курса CoinGecko:', e);
    
    // Фолбэк на дефолтные значения
    const defaultRates = {
      eth: { usd: 3000, rub: 270000 },
      ton: { usd: 5, rub: 450 },
      usdt: { usd: 1, rub: 90 },
      usdt_erc20: { usd: 1, rub: 90 },
      usdt_trc20: { usd: 1, rub: 90 },
      usdt_eth: { usd: 1, rub: 90 },
      manual_tinkoff: { usd: 1, rub: 1 }
    };

    return defaultRates[currency] || null;
  }
}

// API для создания крипто-платежа (анонимно или с userId)
router.post('/create', async (req, res) => {
  try {
    const { amount, currency, plan, period, userId } = req.body;
    logger.info('Получен запрос на создание платежа', { userId, plan, period, currency });
    // Валидация входных данных
    if (!currency || !plan || !period || !userId) {
      logger.warning('Неполные данные платежа', { received: { amount, currency, plan, period, userId } });
      return res.status(400).json({ success: false, message: 'Не указаны все необходимые параметры' });
    }
    // --- Убираем проверку существования пользователя для анонимных ---
    let user = null;
    if (userId !== 'anonymous-user') {
      user = await User.findById(userId);
      if (!user) {
        logger.warning('Пользователь не найден при создании платежа', { userId });
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      }
    }
    
    // Рассчитываем базовую сумму в рублях
    let rubAmount;
    switch(plan) {
      case 'basic':
        rubAmount = 200; // Пробный месяц
        break;
      case 'standard':
        rubAmount = 500; // Базовичок
        break;
      case 'premium':
        rubAmount = 1500; // Наш котяра
        break;
      default:
        rubAmount = 500;
    }

    // Получаем актуальный курс валюты
    const rates = await getCryptoRate(currency);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'Не удалось получить курс валюты'
      });
    }

    // Конвертируем сумму в криптовалюту
    const cryptoAmount = parseFloat((rubAmount / rates.rub).toFixed(8));
    
    // Генерируем ID платежа
    const paymentId = `pay_${crypto.randomBytes(10).toString('hex')}`;
    
    // Устанавливаем срок действия платежа (30 минут)
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000);

    // Конвертация периода в дни
    let periodInDays;
    switch (period) {
      case 'monthly':
        periodInDays = 30;
        break;
      case 'quarterly':
        periodInDays = 90;
        break;
      case 'yearly':
        periodInDays = 365;
        break;
      default:
        periodInDays = 30;
    }

    // Генерируем адрес для оплаты
    const cryptoAddress = blockchainService.generatePaymentAddress(currency);
    
    // Создаем запись о платеже в базе данных
    const payment = await PaymentService.create({
      paymentId,
      userId: user ? user.id : userId,
      status: 'pending',
      amount: rubAmount,
      currency,
      cryptoAmount,
      cryptoAddress,
      plan,
      period: periodInDays,
      expiryTime
    });
    
    logger.info('Создан новый платеж', { 
      paymentId, 
      userId: user ? user.id : userId, 
      amount: rubAmount,
      cryptoAmount,
      currency,
      plan, 
      period 
    });
    
    // Запускаем проверку платежа
    try {
      startPaymentVerification(paymentId);
      logger.info('Запущена проверка платежа', { paymentId });
    } catch (verifyError) {
      logger.error('Ошибка при запуске проверки платежа', verifyError, { paymentId });
    }
    
    // Отправляем в ответ все необходимые данные
    return res.json({
      success: true,
      payment: {
        paymentId,
        amount: rubAmount,
        currency,
        cryptoAmount,
        cryptoAddress,
        plan,
        period,
        status: 'pending',
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
    
    const payment = await PaymentService.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Платеж не найден' 
      });
    }

    // Если платеж завершен, получаем информацию о VPN ключе
    let vpnKey = null;
    if (payment.status === 'completed') {
      logger.info('Получен запрос статуса для завершенного платежа', {
        paymentId,
        hasVpnKeyUuid: !!payment.vpnKeyUuid,
        hasVpnKeyConfig: !!payment.vpnKeyConfig,
        configType: typeof payment.vpnKeyConfig
      });
      
      // Проверяем и форматируем конфигурацию
      let config = payment.vpnKeyConfig;
      if (typeof config === 'object') {
        config = JSON.stringify(config);
      }
      
      // Форматируем объект с данными ключа
      vpnKey = {
        uuid: payment.vpnKeyUuid,
        config: config,
        createdAt: payment.completedAt,
        expiresAt: payment.vpnKeyExpires
      };
      
      logger.info('Отправляю ответ с VPN ключом', {
        paymentId,
        vpnKeyDetails: {
          hasUuid: !!vpnKey.uuid,
          hasConfig: !!vpnKey.config,
          configType: typeof vpnKey.config,
          configPreview: vpnKey.config ? vpnKey.config.substring(0, 50) + '...' : null
        },
        fullPayment: JSON.stringify(payment, null, 2),
        fullVpnKey: JSON.stringify(vpnKey, null, 2)
      });
    }

    const response = {
      success: true,
      payment: {
        ...payment.toJSON(),
        vpnKey
      }
    };

    logger.info('Финальный ответ клиенту:', {
      paymentId,
      response: JSON.stringify(response, null, 2)
    });

    return res.json(response);
  } catch (error) {
    logger.error('Ошибка при получении статуса платежа', error, { 
      paymentId: req.params.paymentId 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при получении статуса платежа'
    });
  }
});

// API для подтверждения платежа
router.post('/status/:paymentId/confirm', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Получаем платеж
    const payment = await PaymentService.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Платеж не найден'
      });
    }
    
    // Для ручной оплаты меняем статус на "ожидание проверки"
    if (payment.currency === 'manual_tinkoff') {
      await PaymentService.update(paymentId, { status: 'waiting_confirmation' });
      
      // Отправляем уведомление админу в Telegram
      const msg2 = `🔔 <b>Пользователь подтвердил ручной платёж!</b>\n\n` +
        `ID: ${paymentId}\n` +
        `Пользователь: ${payment.userId}\n` +
        `Сумма: ${payment.amount} ₽\n` +
        `Тариф: ${getPlanName(payment.plan)} (${getPeriodName(payment.period)})\n\n` +
        `Проверьте поступление средств и подтвердите платёж.`;
      await sendAdminNotification(msg2, paymentId);
      
      // Возвращаем обновленный платеж
      const updatedPayment = await PaymentService.findOne({ paymentId });
      return res.json({
        success: true,
        payment: updatedPayment,
        message: 'Платеж ожидает проверки администратором'
      });
    }
    
    // Для других типов оплаты сразу подтверждаем
    await PaymentService.update(paymentId, { status: 'completed' });
    
    // Генерируем VPN ключ
    const vpnKeyData = await generateVpnKey(payment.plan, payment.period, payment.userId);
    logger.info('Сгенерирован VPN ключ', { 
      paymentId,
      vpnKeyData: {
        uuid: vpnKeyData.uuid,
        expires: vpnKeyData.expires,
        hasConfig: !!vpnKeyData.config
      }
    });
    
    // Отправляем ключ пользователю
    await sendVpnKeyToUser(payment, vpnKeyData);
    
    // Обновляем платеж с информацией о ключе
    await PaymentService.update(paymentId, { 
      vpnKeyUuid: vpnKeyData.uuid,
      vpnKeyConfig: vpnKeyData.config,
      vpnKeyExpires: vpnKeyData.expires,
      status: 'completed',
      completedAt: new Date()
    });
    
    // Получаем обновленный платеж
    const updatedPayment = await PaymentService.findOne({ paymentId });
    
    // Формируем ответ с ключом
    const response = {
      success: true,
      payment: {
        ...updatedPayment.toJSON(),
        vpnKey: {
          uuid: vpnKeyData.uuid,
          config: vpnKeyData.config,
          expires: vpnKeyData.expires
        }
      },
      message: 'Платеж успешно подтвержден'
    };
    
    logger.info('Отправляю ответ с VPN ключом', {
      paymentId,
      hasVpnKey: !!response.payment.vpnKey,
      vpnKeyDetails: response.payment.vpnKey ? {
        uuid: response.payment.vpnKey.uuid,
        hasConfig: !!response.payment.vpnKey.config,
        configType: typeof response.payment.vpnKey.config
      } : null
    });
    
    return res.json(response);
  } catch (error) {
    logger.error('Ошибка при подтверждении платежа', error, { 
      params: req.params,
      body: req.body 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при подтверждении платежа'
    });
  }
});

// API для подтверждения платежа админом
router.post('/admin/confirm/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const { adminToken } = req.body;
  // <<< Лог входа
  logger.info(`[Admin Confirm] Вход в роут для paymentId: ${paymentId}`, { body: req.body }); 

  try {
    // Проверяем токен админа
    logger.info(`[Admin Confirm] Проверяю токен админа...`, { paymentId });
    const expectedToken = process.env.ADMIN_TOKEN;
    if (adminToken !== expectedToken) {
      logger.warning('[Admin Confirm] Неверный токен админа.', { 
        paymentId, 
        receivedToken: adminToken, 
        expectedTokenSubstring: expectedToken ? expectedToken.substring(0, 3) + '...' : 'null' 
      });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
    }
    logger.info(`[Admin Confirm] Токен админа верный.`, { paymentId });

    // Ищем платеж в базе данных
    logger.info(`[Admin Confirm] Ищу платеж ${paymentId} в БД...`);
    const payment = await PaymentService.findOne({ paymentId });

    if (!payment) {
      logger.warning('[Admin Confirm] Платеж не найден.', { paymentId });
      return res.status(404).json({
        success: false,
        message: 'Платеж не найден'
      });
    }
    logger.info(`[Admin Confirm] Платеж ${paymentId} найден.`, { currentStatus: payment.status });

    // Проверяем статус платежа
    logger.info(`[Admin Confirm] Проверяю статус платежа ${paymentId}... Ожидаемый статус: waiting_confirmation`);
    if (payment.status !== 'waiting_confirmation') {
      logger.warning('[Admin Confirm] Платеж не в статусе ожидания подтверждения.', { 
        paymentId, 
        status: payment.status 
      });
      return res.status(400).json({
        success: false,
        message: 'Платеж не требует подтверждения или уже обработан'
      });
    }
    logger.info(`[Admin Confirm] Статус платежа ${paymentId} корректный (waiting_confirmation).`);

    // Генерируем VPN ключ ПЕРЕД сменой статуса
    logger.info(`[Admin Confirm] Генерирую VPN ключ для ${paymentId}...`);
    const vpnKeyData = await generateVpnKey(payment.plan, payment.period, payment.userId);
    logger.info(`[Admin Confirm] Сгенерирован ключ ${vpnKeyData.uuid} для платежа ${paymentId}`);

    // Отправляем ключ пользователю (асинхронно, не блокируем ответ)
    sendVpnKeyToUser(payment, vpnKeyData).catch(err => {
      logger.error('[Admin Confirm] Не удалось отправить ключ пользователю (фоновая задача)', err, { paymentId, userId: payment.userId });
    });

    // ОДНОВРЕМЕННО обновляем статус, UUID ключа и дату завершения
    const updateData = { 
      vpnKeyUuid: vpnKeyData.uuid,
      status: 'completed',
      completedAt: new Date()
    };
    logger.info(`[Admin Confirm] Обновляю платеж ${paymentId} в БД данными:`, { updateData });
    
    // Используем PaymentService.update и проверяем результат
    const updatedRows = await PaymentService.update(paymentId, updateData);

    // Логируем результат обновления
    logger.info(`[Admin Confirm] Результат выполнения PaymentService.update для ${paymentId}:`, { updatedRows });

    if (updatedRows === 0) {
        logger.error(`[Admin Confirm] НЕ УДАЛОСЬ обновить платеж ${paymentId} в БД! PaymentService.update вернул 0.`, { paymentId, updateData });
        // Возвращаем ошибку, так как обновление критично
        return res.status(500).json({ success: false, message: 'Ошибка при обновлении статуса платежа в БД' });
    }

    logger.info(`[Admin Confirm] Платеж ${paymentId} успешно обновлен в БД.`);
    
    // Получаем САМЫЕ АКТУАЛЬНЫЕ данные платежа ПОСЛЕ обновления
    logger.info(`[Admin Confirm] Повторно запрашиваю данные платежа ${paymentId} из БД ПОСЛЕ обновления...`);
    const finalPaymentData = await PaymentService.findByPaymentId(paymentId);
    // Логируем финальные данные перед отправкой ответа
    logger.info(`[Admin Confirm] Финальные данные платежа ${paymentId} для ответа:`, { finalPaymentData: JSON.parse(JSON.stringify(finalPaymentData || null)) });

    // Если по какой-то причине платеж не найден после успешного обновления - это ошибка
    if (!finalPaymentData) {
        logger.error(`[Admin Confirm] КРИТИЧЕСКАЯ ОШИБКА: Платеж ${paymentId} не найден ПОСЛЕ успешного PaymentService.update!`, { paymentId });
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера после обновления платежа' });
    }

    // Формируем ключ для ответа АДМИНУ (фронтенд получит его через /status)
    // Используем данные из vpnKeyData, т.к. они точно есть
    const formattedKeyForAdminResponse = {
      uuid: vpnKeyData.uuid,
      config: typeof vpnKeyData.config === 'string' 
        ? vpnKeyData.config 
        : generateVpnImportLink(vpnKeyData.config),
      expires: vpnKeyData.expires
    };
    
    logger.info(`[Admin Confirm] Платеж ${paymentId} успешно подтвержден админом. Отправляю ответ с актуальными данными.`);
    
    return res.json({
      success: true,
      // Возвращаем finalPaymentData, которая была получена ПОСЛЕ обновления
      payment: { 
        ...JSON.parse(JSON.stringify(finalPaymentData)), 
        vpnKey: formattedKeyForAdminResponse // Добавляем ключ для информации админа
      },
      message: 'Платеж успешно подтвержден'
    });
  } catch (error) {
    logger.error('[Admin Confirm] Глобальная ошибка при подтверждении платежа админом', error, { 
      params: req.params,
      body: req.body 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при подтверждении платежа'
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
    const payments = await PaymentService.find({ userId }).sort({ createdAt: -1 });
    
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

// Функция для генерации VPN ключа
async function generateVpnKey(plan, period, userId) {
  try {
    logger.info('Генерация VPN ключа', { plan, period, userId });
    
    const now = new Date();
    
    // Используем фиксированный UUID для всех ключей (как на сервере)
    const uuid = '62bc8aba-1979-4918-85ca-0e2eea1df559';
    // Генерируем уникальный internal_id для идентификации ключа в базе
    const internal_id = crypto.randomUUID();
    
    // Определяем срок действия ключа
    let expiresAt = new Date(now);
    
    if (plan === 'trial') {
      // Для пробного периода - строго 1 час
      expiresAt.setHours(expiresAt.getHours() + 1);
      logger.info('Создан пробный ключ на 1 час', { 
        createdAt: now, 
        expiresAt 
      });
    } else {
      // Для остальных тарифов
      let days;
      if (typeof period === 'number') {
        days = period;
      } else {
        switch (period) {
          case 'yearly':
            days = 365;
            break;
          case 'quarterly':
            days = 90;
            break;
          case 'monthly':
            days = 30;
            break;
          default:
            days = 30; // По умолчанию 1 месяц
        }
      }
      
      // Для премиум тарифа добавляем бонусные дни
      if (plan === 'premium') {
        days += 30; // +30 дней бонус
      }
      
      expiresAt.setDate(expiresAt.getDate() + days);
      logger.info('Создан ключ с периодом действия', { 
        plan, 
        days,
        createdAt: now,
        expiresAt 
      });
    }

    // Генерируем конфигурационную строку в формате VLESS с корректными настройками
    const config = VpnKey._generateVpnConfig(plan);
    
    // Создаем запись о ключе в базе данных
    const vpnKey = await VpnKey.create({
      internal_id,
      uuid,
      userId: userId || null,
      plan,
      config,
      expiresAt,
      ip: null
    });
    
    // Запускаем таймер для деактивации ключа
    VpnKey.scheduleDeactivation(uuid, expiresAt);
    
    logger.info('VPN ключ успешно создан', { 
      internal_id,
      uuid,
      plan,
      expiresAt: expiresAt.toISOString()
    });
    
    return {
      uuid: vpnKey.uuid,
      config: config,
      expires: vpnKey.expiresAt
    };
  } catch (error) {
    logger.error('Ошибка при генерации VPN ключа', { error: error.message });
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
    
    // Если это анонимный пользователь, просто логируем это и возвращаемся
    if (paymentData.userId === 'anonymous-user') {
      logger.info('Платеж от анонимного пользователя, пропускаем отправку в Telegram', {
        paymentId: paymentData.paymentId
      });
      return;
    }
    
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
          `🎉 <b>Ваш VPN-ключ готов!</b> 🎉\n\n`+
          `🔑 <b>UUID:</b> <code>${vpnKeyData.uuid}</code>\n`+
          `📆 <b>Действует до:</b> ${new Date(vpnKeyData.expires).toLocaleDateString()}\n`+
          `📊 <b>Тариф:</b> ${vpnKeyData.plan}\n\n`+
          `Для подключения используйте одно из предложенных приложений и импортируйте конфигурацию по ссылке ниже.\n\n`+
          `<b>Инструкция по настройке:</b>\n`+
          `1. Установите приложение V2Ray или Matsuri\n`+
          `2. Откройте приложение и нажмите "Импорт конфигурации"\n`+
          `3. Используйте данные ниже или отсканируйте QR-код\n\n`+
          `<b>Ссылка для импорта:</b>\n<code>${importLink}</code>`,
          { parse_mode: 'HTML' }
        );
        
        // Отправляем QR-код для быстрой настройки
        try {
          // Формируем конфигурационную строку для QR-кода
          const uuid = '62bc8aba-1979-4918-85ca-0e2eea1df559';
          const host = 'vpn.kittypoopvpn.ru';
          const port = '4843';
          const encryption = 'none';
          const security = 'tls';
          const type = 'ws';
          const path = '/vless';
          const flow = 'none';
          const alpn = 'h2,h3,http/1.1';
          const configName = 'KittyPoopVPN_Trial';

          const configString = `vless://${uuid}@${host}:${port}?encryption=${encryption}&security=${security}&type=${type}&host=${host}&path=${encodeURIComponent(path)}&flow=${flow}&alpn=${encodeURIComponent(alpn)}#${encodeURIComponent(configName)}`;

          // Генерируем QR-код через API с правильным размером и уровнем коррекции ошибок
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&ecc=H&data=${encodeURIComponent(configString)}`;
          
          // Отправляем QR-код через Telegram
          await bot.sendPhoto(user.telegramId, qrCodeUrl, {
            caption: `🔄 <b>QR-код для быстрой настройки VPN</b>\n\n` +
                    `Отсканируйте его в приложении V2rayNG или Matsuri для быстрого подключения.\n\n` +
                    `Конфигурация:\n` +
                    `<code>${configString}</code>\n\n` +
                    `UUID: <code>${uuid}</code>`,
            parse_mode: 'HTML'
          });
          
          logger.info('QR-код успешно отправлен пользователю', { 
            telegramId: user.telegramId 
          });
        } catch (qrError) {
          logger.error('Ошибка при отправке QR-кода', qrError, { 
            telegramId: user.telegramId 
          });
        }
      } catch (error) {
        logger.error('Ошибка при отправке сообщения в Telegram', error, {
          telegramId: user.telegramId
        });
      }
    }
  } catch (error) {
    logger.error('Ошибка при отправке VPN ключа пользователю', error, {
      paymentId: paymentData.paymentId,
      userId: paymentData.userId
    });
  }
}

// Генерируем ссылку для импорта VPN-конфигурации
function generateVpnImportLink(config) {
  try {
    // Если config это строка, возвращаем её как есть, так как она уже в правильном формате
    if (typeof config === 'string') {
      return config;
    }
    
    // Создаем строку для VLESS протокола в формате, подходящем для большинства клиентов
    const uuid = typeof config === 'object' ? config.uuid : 'vpn_' + crypto.randomBytes(10).toString('hex');
    const server = typeof config === 'object' ? config.server : 'vpn.kittypoop.com';
    const port = typeof config === 'object' ? config.port : '443';
    const protocol = typeof config === 'object' ? config.protocol : 'vmess';
    
    // Базовый формат для vmess: vmess://base64(json-config)
    const vmessConfig = {
      v: "2",
      ps: "Kitty Poop VPN",
      add: server,
      port: port,
      id: uuid,
      aid: "0",
      net: "ws",
      type: "none",
      host: "",
      path: "/vpn",
      tls: "tls",
      sni: "vpn.kittypoop.com",
      scy: "auto"
    };
    
    // Преобразуем объект в строку JSON, затем в base64
    const base64Config = Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    return `${protocol}://${base64Config}`;
  } catch (error) {
    logger.error('Ошибка при генерации ссылки импорта VPN', { error: error.message });
    return 'vmess://error-generating-config'; // Возвращаем заметную ошибку
  }
}

// Функция для получения названия тарифа
function getPlanName(plan) {
  switch(plan) {
    case 'basic': return 'Пробный месяц';
    case 'standard': return 'Базовичок';
    case 'premium': return 'Наш котяра';
    default: return plan;
  }
}

// Функция для получения названия периода
function getPeriodName(period) {
  switch(period) {
    case 'monthly': return 'месяц';
    case 'quarterly': return '3 месяца';
    case 'yearly': return 'год';
    default: return period;
  }
}

// Функция для планирования деактивации ключа
function scheduleKeyDeactivation(internal_id, expiresAt) {
  // Очищаем существующий таймер, если есть
  if (deactivationTimers.has(internal_id)) {
    clearTimeout(deactivationTimers.get(internal_id));
    deactivationTimers.delete(internal_id);
  }
  
  // Вычисляем время до деактивации
  const now = new Date();
  const timeUntilDeactivation = expiresAt.getTime() - now.getTime();
  
  if (timeUntilDeactivation <= 0) {
    // Если время уже истекло, деактивируем немедленно
    deactivateKey(internal_id);
    return;
  }
  
  // Устанавливаем таймер на деактивацию
  const timer = setTimeout(async () => {
    await deactivateKey(internal_id);
  }, timeUntilDeactivation);
  
  // Сохраняем таймер
  deactivationTimers.set(internal_id, timer);
  
  logger.info('Запланирована деактивация ключа', {
    internal_id,
    expiresAt: expiresAt.toISOString(),
    timeUntilDeactivation: Math.floor(timeUntilDeactivation / 1000) + ' seconds'
  });
}

// Функция деактивации ключа
async function deactivateKey(internal_id) {
  try {
    // Обновляем статус ключа в базе данных
    await VpnKey.update(internal_id, { is_active: false });
    
    // Очищаем таймер
    if (deactivationTimers.has(internal_id)) {
      clearTimeout(deactivationTimers.get(internal_id));
      deactivationTimers.delete(internal_id);
    }
    
    logger.info('Ключ деактивирован', { internal_id });
    
    // Здесь можно добавить дополнительную логику
    // например, отправку уведомления пользователю о деактивации
  } catch (error) {
    logger.error('Ошибка при деактивации ключа', { 
      internal_id, 
      error: error.message 
    });
  }
}

// При запуске сервера - восстанавливаем таймеры для всех активных ключей
async function restoreDeactivationTimers() {
  try {
    // Получаем все активные ключи
    const activeKeys = await VpnKey.findActive();
    
    for (const key of activeKeys) {
      const expiresAt = new Date(key.expires);
      const now = new Date();
      
      // Если срок действия уже истек - деактивируем
      if (expiresAt <= now) {
        await deactivateKey(key.internal_id);
        continue;
      }
      
      // Иначе планируем деактивацию
      scheduleKeyDeactivation(key.internal_id, expiresAt);
    }
    
    logger.info('Восстановлены таймеры деактивации', {
      activeKeysCount: activeKeys.length
    });
  } catch (error) {
    logger.error('Ошибка при восстановлении таймеров деактивации', {
      error: error.message
    });
  }
}

// Экспортируем router в качестве основного объекта для Express
const routerExport = router;

// Добавляем нужные функции к экспортируемому объекту
routerExport.generateVpnKey = generateVpnKey;
routerExport.sendVpnKeyToUser = sendVpnKeyToUser;
routerExport.generateVpnImportLink = generateVpnImportLink;

// Экспортируем только router с добавленными функциями
module.exports = routerExport; 