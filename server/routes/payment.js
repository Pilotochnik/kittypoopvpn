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

// Генерация уникального ID платежа
const generatePaymentId = () => {
  return `payment_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

// API для создания крипто-платежа
router.post('/create', async (req, res) => {
  try {
    const { amount, currency, plan, period, userId } = req.body;
    
    // Валидация входных данных
    if (!amount || !currency || !plan || !period || !userId) {
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
    
    // Генерация платежного адреса
    const cryptoAddress = await blockchainService.generatePaymentAddress(currency);
    
    // Конвертация суммы в крипто (в реальности должен использоваться API курса валют)
    let cryptoAmount;
    const rates = {
      eth: 3000, // USD за 1 ETH
      usdt_erc20: 1, // USD за 1 USDT
      usdt_trc20: 1, // USD за 1 USDT
      ton: 5 // USD за 1 TON
    };
    
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
    
    await payment.save();
    
    // Запускаем проверку платежа
    startPaymentVerification(paymentId);
    
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
    console.error('Ошибка при создании крипто-платежа:', error);
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
  // Получаем данные платежа из базы данных
  const payment = await Payment.findOne({ paymentId });
  
  if (!payment || payment.status !== 'pending') {
    console.log(`Платеж ${paymentId} не требует проверки (не найден или не в статусе 'pending')`);
    return;
  }
  
  console.log(`Запускаем проверку платежа ${paymentId}`);
  
  // Создаем интервал для периодической проверки (каждые 30 секунд)
  const intervalId = setInterval(async () => {
    try {
      // Проверяем актуальность платежа в базе данных
      const updatedPayment = await Payment.findOne({ paymentId });
      
      if (!updatedPayment || updatedPayment.status !== 'pending') {
        console.log(`Остановка проверки для платежа ${paymentId}: изменен статус или платеж удален`);
        clearInterval(intervalId);
        paymentTimers.delete(paymentId);
        return;
      }
      
      // Проверяем, не истек ли срок ожидания платежа
      const now = new Date();
      if (now > updatedPayment.expiryTime) {
        console.log(`Платеж ${paymentId} истек`);
        updatedPayment.status = 'expired';
        await updatedPayment.save();
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
        
        // Обновляем статус платежа
        updatedPayment.status = 'completed';
        updatedPayment.completedAt = new Date();
        updatedPayment.transactionId = paymentResult.txId;
        
        // Генерируем VPN ключ
        const vpnKeyData = await generateVpnKey(updatedPayment.plan, updatedPayment.period, updatedPayment.userId);
        
        // Связываем ключ с платежом
        updatedPayment.vpnKeyUuid = vpnKeyData.uuid;
        await updatedPayment.save();
        
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
  expires.setMonth(expires.getMonth() + period);
  
  // Генерируем конфигурацию VPN
  const vpnConfig = `server_address=vpn.kittypoopvpn.com
port=51820
private_key=${crypto.randomBytes(32).toString('base64')}
dns=1.1.1.1
allowed_ips=0.0.0.0/0,::/0`;

  // Создаем запись о ключе в базе данных
  const vpnKey = new VpnKey({
    uuid,
    userId,
    plan,
    period,
    created: now,
    expires,
    isActive: true,
    isTrial: false,
    config: vpnConfig
  });
  
  await vpnKey.save();
  
  console.log(`Создан VPN ключ ${uuid} для плана ${plan}, действителен до ${expires}`);
  
  return {
    uuid,
    plan,
    period,
    created: now,
    expires,
    isActive: true,
    config: vpnConfig
  };
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
      const message = `
🎉 Ваш платеж успешно обработан!

🔑 Ваш VPN ключ:
UUID: ${vpnKeyData.uuid}
План: ${vpnKeyData.plan}
Период: ${vpnKeyData.period} мес.
Действителен до: ${vpnKeyData.expires.toLocaleDateString()}

⚙️ Конфигурация:
\`\`\`
${vpnKeyData.config}
\`\`\`

Спасибо за использование KittyPoopVPN! 🐱
      `;
      
      await bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
      console.log(`VPN ключ отправлен пользователю через Telegram`);
    } else {
      console.log(`У пользователя нет Telegram ID для отправки ключа`);
      // Здесь можно добавить отправку по email, если у пользователя есть email
    }
  } catch (error) {
    console.error('Ошибка при отправке VPN ключа пользователю:', error);
  }
}

module.exports = router; 