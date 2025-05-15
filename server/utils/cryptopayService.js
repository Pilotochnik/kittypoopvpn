const axios = require('axios');

const CRYPTOPAY_TOKEN = process.env.CRYPTOPAY_TOKEN || '56332:AAcaFHmcEurXMQhwAh9fxcp9MTYpZZd2FVo';
const CRYPTOPAY_API_URL = 'https://pay.crypt.bot/api/createInvoice';

/**
 * Создать инвойс через CryptoPay с конвертацией из рублей в криптовалюту и поддержкой выбора сети для USDT
 * @param {Object} params
 * @param {number} params.amount - сумма в рублях
 * @param {string} params.currency - валюта для оплаты (TON, USDT_TRC20, USDT_ERC20, BTC, USDT)
 * @param {string} params.plan
 * @param {string} params.period
 * @param {string} params.userId
 * @returns {Promise<{invoice_id: string, pay_url: string}>}
 */
async function createInvoice({ amount, currency, plan, period, userId }) {
  try {
    let accepted_assets = '';
    const cur = currency.toUpperCase();

    if (cur === 'TON' || cur === 'BTC') {
      accepted_assets = cur;
    } else if (cur.startsWith('USDT')) {
      accepted_assets = 'USDT'; // Всегда только USDT, сеть выберет пользователь в CryptoPay
    } else {
      throw new Error('Выбранная валюта/сеть не поддерживается. Доступно: TON, BTC, USDT');
    }

    const data = {
      currency_type: 'fiat',
      fiat: 'RUB',
      amount: amount.toString(),
      accepted_assets,
      description: `VPN ${plan} (${period}) для пользователя ${userId}`,
      expires_in: 1800 // 30 минут
    };
    const headers = {
      'Content-Type': 'application/json',
      'Crypto-Pay-API-Token': CRYPTOPAY_TOKEN
    };
    const response = await axios.post(CRYPTOPAY_API_URL, data, { headers });
    if (!response.data.ok) {
      throw new Error('Ошибка создания инвойса в CryptoPay: ' + JSON.stringify(response.data));
    }
    // bot_invoice_url — актуальная ссылка для оплаты
    return {
      invoice_id: response.data.result.invoice_id,
      pay_url: response.data.result.bot_invoice_url
    };
  } catch (err) {
    console.error('[CryptoPay] Ошибка при создании инвойса:', err.message, err.response?.data);
    throw new Error('Ошибка при создании платежа через CryptoPay: ' + (err.response?.data?.description || err.message));
  }
}

module.exports = { createInvoice }; 