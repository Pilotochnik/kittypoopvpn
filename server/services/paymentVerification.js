const { logger } = require('../utils/logger');
const PaymentService = require('../models/Payment');
const VpnKey = require('../models/VpnKey');
const blockchainService = require('../blockchainService');

// Хранилище для активных проверок
const activeVerifications = new Map();

/**
 * Запускает проверку платежа
 * @param {string} paymentId - ID платежа
 */
async function startPaymentVerification(paymentId) {
  // Проверяем, не запущена ли уже проверка
  if (activeVerifications.has(paymentId)) {
    logger.info('Проверка платежа уже запущена', { paymentId });
    return;
  }

  try {
    // Получаем данные платежа
    const payment = await PaymentService.findOne({ paymentId });
    if (!payment) {
      throw new Error('Платеж не найден');
    }

    // Если платеж уже завершен, не запускаем проверку
    if (['completed', 'failed', 'expired'].includes(payment.status)) {
      logger.info('Платеж уже завершен, проверка не требуется', { 
        paymentId,
        status: payment.status 
      });
      return;
    }

    // Запускаем интервал проверки
    const interval = setInterval(async () => {
      try {
        const result = await verifyPayment(payment);
        
        if (result.verified) {
          // Платеж подтвержден
          await completePayment(payment);
          clearInterval(interval);
          activeVerifications.delete(paymentId);
        } else if (result.expired) {
          // Платеж истек
          await expirePayment(payment);
          clearInterval(interval);
          activeVerifications.delete(paymentId);
        }
      } catch (error) {
        logger.error('Ошибка при проверке платежа', error, { paymentId });
      }
    }, 30000); // Проверяем каждые 30 секунд

    // Сохраняем интервал
    activeVerifications.set(paymentId, interval);
    
    // Запускаем первую проверку сразу
    const result = await verifyPayment(payment);
    if (result.verified) {
      await completePayment(payment);
      clearInterval(interval);
      activeVerifications.delete(paymentId);
    }

  } catch (error) {
    logger.error('Ошибка при запуске проверки платежа', error, { paymentId });
  }
}

/**
 * Проверяет статус платежа
 * @param {Object} payment - Объект платежа
 * @returns {Promise<{verified: boolean, expired: boolean}>}
 */
async function verifyPayment(payment) {
  try {
    // Проверяем срок действия
    const now = new Date();
    if (now > new Date(payment.expiryTime)) {
      return { verified: false, expired: true };
    }

    // Проверяем платеж в блокчейне
    const result = await blockchainService.checkPayment(
      payment.currency,
      payment.cryptoAddress,
      payment.cryptoAmount,
      new Date(payment.createdAt)
    );

    return {
      verified: result.confirmed,
      expired: false,
      txId: result.txId
    };
  } catch (error) {
    logger.error('Ошибка при проверке статуса платежа', error, { 
      paymentId: payment.paymentId 
    });
    return { verified: false, expired: false };
  }
}

/**
 * Завершает успешный платеж
 * @param {Object} payment - Объект платежа
 */
async function completePayment(payment) {
  try {
    // Создаем VPN ключ
    const vpnKey = await VpnKey.create({
      userId: payment.userId,
      plan: payment.plan,
      period: payment.period,
      paymentId: payment.paymentId
    });

    // Обновляем статус платежа
    await PaymentService.update(payment.paymentId, {
      status: 'completed',
      vpnKeyId: vpnKey.id
    });

    logger.info('Платеж успешно завершен', {
      paymentId: payment.paymentId,
      vpnKeyId: vpnKey.id
    });
  } catch (error) {
    logger.error('Ошибка при завершении платежа', error, {
      paymentId: payment.paymentId
    });
  }
}

/**
 * Помечает платеж как истекший
 * @param {Object} payment - Объект платежа
 */
async function expirePayment(payment) {
  try {
    await PaymentService.update(payment.paymentId, {
      status: 'expired'
    });

    logger.info('Платеж помечен как истекший', {
      paymentId: payment.paymentId
    });
  } catch (error) {
    logger.error('Ошибка при установке статуса истекшего платежа', error, {
      paymentId: payment.paymentId
    });
  }
}

module.exports = {
  startPaymentVerification
}; 