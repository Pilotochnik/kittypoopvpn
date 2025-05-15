const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('./utils/logger');

// API ключи (в продакшне должны храниться в .env файле)
const API_KEYS = {
  BLOCKCHAIN_INFO: '', // Не требуется для публичного API
  ETHERSCAN: 'XCUI4TZHMP18C1HR2GC81V9QJGPB9DKKWJ', // Бесплатный API ключ Etherscan
  TRONGRID: 'a8e3a8e3-9f93-4c78-9c6a-8a2a8c9a7f8c', // Пример ключа TronGrid (замените на свой)
  TONCENTER: '5cede9f2f8ca91c8ea3c8a5e4d85f26067a984fdbb73e4523755229c0400fe01' // Пример ключа TON Center (замените на свой)
};

class BlockchainService {
  constructor() {
    this.supportedCurrencies = ['eth', 'ton', 'usdt_erc20', 'usdt_trc20'];
    this.endpoints = {
      eth: 'https://api.etherscan.io/api',
      ton: 'https://toncenter.com/api/v2',
      usdt_erc20: 'https://api.etherscan.io/api',
      usdt_trc20: 'https://apilist.tronscan.org/api'
    };
  }

  // Генерация адреса для оплаты
  generatePaymentAddress(currency) {
    try {
      // В реальном приложении здесь должна быть интеграция с криптокошельком
      // Для демонстрации генерируем фейковый адрес
      const addresses = {
        eth: '0x' + crypto.randomBytes(20).toString('hex'),
        ton: crypto.randomBytes(32).toString('hex'),
        usdt_erc20: '0x' + crypto.randomBytes(20).toString('hex'),
        usdt_trc20: 'T' + crypto.randomBytes(20).toString('hex')
      };

      return addresses[currency] || null;
    } catch (error) {
      logger.error('Ошибка при генерации адреса для оплаты:', error);
      throw error;
    }
  }

  // Проверка статуса платежа
  async checkPayment(currency, address, amount, createdAt) {
    try {
      // В реальном приложении здесь должна быть проверка транзакций в блокчейне
      // Для демонстрации эмулируем проверку с 30% шансом успеха
      const isConfirmed = Math.random() < 0.3;

      if (isConfirmed) {
        const txId = crypto.randomBytes(32).toString('hex');
        return {
          status: 'completed',
          confirmed: true,
          txId,
          amount
        };
      }

      return {
        status: 'pending',
        confirmed: false,
        amount: 0
      };
    } catch (error) {
      logger.error('Ошибка при проверке статуса платежа:', error);
      throw error;
    }
  }

  // Получение курса криптовалюты
  async getRate(currency) {
    try {
      const ids = {
        eth: 'ethereum',
        ton: 'the-open-network',
        usdt_erc20: 'tether',
        usdt_trc20: 'tether'
      };

      const id = ids[currency];
      if (!id) return null;

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,rub`
      );

      if (!response.data[id]) {
        throw new Error('Не удалось получить курс');
      }

      return {
        usd: response.data[id].usd,
        rub: response.data[id].rub
      };
    } catch (error) {
      logger.error('Ошибка при получении курса криптовалюты:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService(); 