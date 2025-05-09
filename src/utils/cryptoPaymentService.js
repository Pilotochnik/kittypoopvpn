// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://134.209.91.29/api';

// Кеш для хранения данных о платежах
const paymentCache = new Map();

/**
 * Логирование API вызовов
 * @param {string} method - HTTP метод
 * @param {string} url - URL запроса
 * @param {object} data - Данные запроса
 */
export const logApiCall = (method, url, data) => {
  console.log(`API Call: ${method} ${url}`, data ? data : '');
};

/**
 * Создает новый платеж
 * @param {object} paymentData - Данные платежа
 * @param {string} paymentData.userId - ID пользователя
 * @param {string} paymentData.plan - План (basic, standard, premium)
 * @param {string} paymentData.currency - Криптовалюта (btc, eth, usdt, usdt_eth)
 * @param {string} paymentData.period - Период (monthly, yearly)
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const createPayment = async (paymentData) => {
  try {
    // Если это ручной платеж на карту Тинькофф, используем отдельный эндпоинт
    if (paymentData.currency === 'manual_tinkoff') {
      return createManualPayment(paymentData);
    }
    
    logApiCall('POST', `${API_URL}/crypto-payment`, paymentData);
    const response = await fetch(`${API_URL}/crypto-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      // Более подробная обработка ошибок HTTP
      const statusCode = response.status;
      let errorMessage;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Ошибка сервера: ${statusCode}`;
      } catch (parseError) {
        errorMessage = `Ошибка сервера: ${statusCode}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Сохраняем платеж в кеше
    if (data.payment && data.payment.paymentId) {
      paymentCache.set(data.payment.paymentId, {
        ...data.payment,
        cachedAt: new Date().getTime()
      });
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при создании платежа:', error);
    // Добавляем дополнительную информацию об ошибке
    const enhancedError = new Error(`Ошибка при создании платежа: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.paymentData = paymentData;
    throw enhancedError;
  }
};

/**
 * Создает новый ручной платеж на карту Тинькофф
 * @param {object} paymentData - Данные платежа
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const createManualPayment = async (paymentData) => {
  try {
    logApiCall('POST', `${API_URL}/manual-payment`, paymentData);
    const response = await fetch(`${API_URL}/manual-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось создать ручной платеж');
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при создании ручного платежа:', error);
    throw error;
  }
};

/**
 * Получает информацию о платеже
 * @param {string} paymentId - ID платежа
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const getPayment = async (paymentId) => {
  try {
    // Проверяем кеш сначала
    const cachedPayment = paymentCache.get(paymentId);
    const now = new Date().getTime();
    
    // Используем кешированные данные, если они свежие (не старше 30 секунд)
    if (cachedPayment && (now - cachedPayment.cachedAt) < 30000) {
      console.log(`Использую кешированные данные для платежа ${paymentId}`);
      return cachedPayment;
    }
    
    logApiCall('GET', `${API_URL}/crypto-payment/${paymentId}`);
    const response = await fetch(`${API_URL}/crypto-payment/${paymentId}`);
    
    if (!response.ok) {
      // Более подробная обработка ошибок HTTP
      const statusCode = response.status;
      let errorMessage;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Ошибка сервера: ${statusCode}`;
      } catch (parseError) {
        errorMessage = `Ошибка сервера: ${statusCode}`;
      }
      
      if (statusCode === 404) {
        throw new Error(`Платеж с ID ${paymentId} не найден`);
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    
    // Обновляем кеш
    if (data.payment) {
      paymentCache.set(paymentId, {
        ...data.payment,
        cachedAt: now
      });
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при получении информации о платеже:', error);
    // Если платеж в кеше есть, но он устарел, всё равно вернем его в случае ошибки сети
    const cachedPayment = paymentCache.get(paymentId);
    if (cachedPayment && error.message.includes('сети')) {
      console.log(`Использую устаревшие кешированные данные для платежа ${paymentId} из-за проблем с сетью`);
      return cachedPayment;
    }
    
    const enhancedError = new Error(`Ошибка при получении платежа: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.paymentId = paymentId;
    throw enhancedError;
  }
};

/**
 * Имитирует подтверждение платежа (в реальном приложении это обычно делается через вебхук от платежной системы)
 * @param {string} paymentId - ID платежа
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const confirmPayment = async (paymentId) => {
  try {
    logApiCall('POST', `${API_URL}/crypto-payment/${paymentId}/confirm`);
    const response = await fetch(`${API_URL}/crypto-payment/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось подтвердить платеж');
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при подтверждении платежа:', error);
    throw error;
  }
};

/**
 * Подтверждает ручной платеж пользователем (после перевода денег)
 * @param {string} paymentId - ID платежа
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const confirmManualPayment = async (paymentId) => {
  try {
    logApiCall('POST', `${API_URL}/manual-payment/${paymentId}/confirm`);
    const response = await fetch(`${API_URL}/manual-payment/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось подтвердить ручной платеж');
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при подтверждении ручного платежа:', error);
    throw error;
  }
}; 