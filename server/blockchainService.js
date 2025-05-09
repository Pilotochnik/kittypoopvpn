const axios = require('axios');
const crypto = require('crypto');

// API ключи (в продакшне должны храниться в .env файле)
const API_KEYS = {
  BLOCKCHAIN_INFO: '', // Не требуется для публичного API
  ETHERSCAN: 'XCUI4TZHMP18C1HR2GC81V9QJGPB9DKKWJ', // Бесплатный API ключ Etherscan
  TRONGRID: 'a8e3a8e3-9f93-4c78-9c6a-8a2a8c9a7f8c', // Пример ключа TronGrid (замените на свой)
  TONCENTER: '5cede9f2f8ca91c8ea3c8a5e4d85f26067a984fdbb73e4523755229c0400fe01' // Пример ключа TON Center (замените на свой)
};

/**
 * Проверяет подтверждение платежа в блокчейне Bitcoin
 * @param {string} address - Адрес кошелька
 * @param {number} amount - Ожидаемая сумма в BTC
 * @param {Date} since - Дата, начиная с которой проверять транзакции
 * @returns {Promise<boolean>} - Подтвержден ли платеж
 */
async function checkBitcoinPayment(address, amount, since) {
  try {
    // В реальном приложении используйте API blockchain.info или другой сервис
    const response = await axios.get(`https://blockchain.info/address/${address}?format=json`);
    
    const transactions = response.data.txs || [];
    const sinceTimestamp = since.getTime() / 1000;
    
    // Проверяем транзакции, которые произошли после указанной даты
    for (const tx of transactions) {
      if (tx.time < sinceTimestamp) continue;
      
      // Ищем наши входящие транзакции
      for (const output of tx.out) {
        if (output.addr === address && output.value >= amount * 100000000) { // Конвертируем в сатоши
          return {
            confirmed: true,
            txId: tx.hash,
            amount: output.value / 100000000
          };
        }
      }
    }
    
    return { confirmed: false };
  } catch (error) {
    console.error('Ошибка при проверке Bitcoin-платежа:', error);
    return { confirmed: false, error: error.message };
  }
}

/**
 * Проверяет подтверждение платежа в блокчейне Ethereum
 * @param {string} address - Адрес кошелька
 * @param {number} amount - Ожидаемая сумма в ETH
 * @param {Date} since - Дата, начиная с которой проверять транзакции
 * @returns {Promise<boolean>} - Подтвержден ли платеж
 */
async function checkEthereumPayment(address, amount, since) {
  try {
    // В реальном приложении используйте API Etherscan или другой сервис
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.ETHERSCAN}`
    );
    
    if (response.data.status !== '1') {
      throw new Error(response.data.message || 'Failed to get transactions');
    }
    
    const transactions = response.data.result || [];
    const sinceTimestamp = since.getTime() / 1000;
    
    // Проверяем транзакции, которые произошли после указанной даты
    for (const tx of transactions) {
      if (tx.timeStamp < sinceTimestamp) continue;
      if (tx.to.toLowerCase() !== address.toLowerCase()) continue;
      
      // Проверяем сумму (конвертируем из wei в eth)
      const txAmount = parseInt(tx.value) / 1000000000000000000;
      if (txAmount >= amount) {
        return {
          confirmed: true,
          txId: tx.hash,
          amount: txAmount
        };
      }
    }
    
    return { confirmed: false };
  } catch (error) {
    console.error('Ошибка при проверке Ethereum-платежа:', error);
    return { confirmed: false, error: error.message };
  }
}

/**
 * Проверяет подтверждение платежа в блокчейне TRON (для USDT TRC20)
 * @param {string} address - Адрес кошелька
 * @param {number} amount - Ожидаемая сумма в USDT
 * @param {Date} since - Дата, начиная с которой проверять транзакции
 * @returns {Promise<boolean>} - Подтвержден ли платеж
 */
async function checkTronPayment(address, amount, since) {
  try {
    // В реальном приложении используйте TronGrid API или другой сервис
    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=100&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`,
      {
        headers: {
          'TRON-PRO-API-KEY': API_KEYS.TRONGRID
        }
      }
    );
    
    const transactions = response.data.data || [];
    const sinceTimestamp = since.getTime();
    
    // Проверяем транзакции, которые произошли после указанной даты
    for (const tx of transactions) {
      const txTime = tx.block_timestamp;
      if (txTime < sinceTimestamp) continue;
      
      if (tx.to === address) {
        // Сумма в USDT (делим на 10^6)
        const txAmount = parseInt(tx.value) / 1000000;
        if (txAmount >= amount) {
          return {
            confirmed: true,
            txId: tx.transaction_id,
            amount: txAmount
          };
        }
      }
    }
    
    return { confirmed: false };
  } catch (error) {
    console.error('Ошибка при проверке TRON-платежа:', error);
    return { confirmed: false, error: error.message };
  }
}

/**
 * Проверяет подтверждение платежа в блокчейне TON
 * @param {string} address - Адрес кошелька
 * @param {number} amount - Ожидаемая сумма в TON
 * @param {Date} since - Дата, начиная с которой проверять транзакции
 * @returns {Promise<boolean>} - Подтвержден ли платеж
 */
async function checkTonPayment(address, amount, since) {
  try {
    // В реальном приложении используйте TON Center API или TON API v4
    const response = await axios.get(
      `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=100&to_lt=0&archival=false`,
      {
        headers: {
          'X-API-Key': API_KEYS.TONCENTER
        }
      }
    );
    
    const transactions = response.data.result || [];
    const sinceTimestamp = since.getTime() / 1000;
    
    // Проверяем транзакции, которые произошли после указанной даты
    for (const tx of transactions) {
      if (tx.utime < sinceTimestamp) continue;
      
      // Проверяем входящие транзакции
      if (tx.in_msg && tx.in_msg.source) {
        // Сумма в TON (делим на 10^9)
        const txAmount = parseInt(tx.in_msg.value || 0) / 1000000000;
        if (txAmount >= amount) {
          return {
            confirmed: true,
            txId: tx.transaction_id,
            amount: txAmount
          };
        }
      }
    }
    
    return { confirmed: false };
  } catch (error) {
    console.error('Ошибка при проверке TON-платежа:', error);
    return { confirmed: false, error: error.message };
  }
}

/**
 * Проверяет подтверждение платежа в зависимости от типа криптовалюты
 * @param {string} currency - Тип криптовалюты (btc, eth, usdt, ton)
 * @param {string} address - Адрес кошелька
 * @param {number} amount - Ожидаемая сумма в соответствующей валюте
 * @param {Date} since - Дата, начиная с которой проверять транзакции
 * @returns {Promise<Object>} - Результат проверки
 */
async function checkPayment(currency, address, amount, since) {
  switch (currency) {
    case 'btc':
      return checkBitcoinPayment(address, amount, since);
    case 'eth':
      return checkEthereumPayment(address, amount, since);
    case 'usdt':
      return checkTronPayment(address, amount, since);
    case 'usdt_eth':
      // Для USDT ERC20 нужна специальная логика проверки токенов ERC20
      // В этом примере мы используем заглушку
      return { confirmed: false, error: 'USDT ERC20 check not implemented yet' };
    case 'ton':
      return checkTonPayment(address, amount, since);
    default:
      return { confirmed: false, error: 'Unsupported currency' };
  }
}

/**
 * Генерирует новый адрес кошелька для приема платежей
 * @param {string} currency - Тип криптовалюты
 * @returns {string} - Новый адрес кошелька
 */
function generatePaymentAddress(currency) {
  // Ваши личные адреса кошельков для приема платежей
  const yourWallets = {
    eth: '0xe1faf7b21a757c282ad02943e6d1bb5e69c5e5f0',  // Ваш Ethereum адрес
    usdt: 'TEa6X6ty8aRHNZMFcPrDCiAJWuqGSSzTRt',  // Ваш USDT TRC20 адрес
    usdt_eth: '0xe1faf7b21a757c282ad02943e6d1bb5e69c5e5f0', // Ваш USDT ERC20 адрес (тот же, что и ETH)
    ton: 'UQDR-imoT2sotRqCvI7dQAN52oKYhPjRvSoe4W48RFRLVkrj' // Ваш TON адрес
  };
  
  // Возвращаем адрес соответствующего кошелька
  if (currency === 'eth' || currency === 'usdt_eth') {
    return yourWallets.eth;
  } else if (currency === 'usdt') {
    return yourWallets.usdt;
  } else if (currency === 'ton') {
    return yourWallets.ton;
  }
  
  // Если валюта не найдена, используем TON по умолчанию
  return yourWallets.ton;
}

module.exports = {
  checkPayment,
  generatePaymentAddress
}; 