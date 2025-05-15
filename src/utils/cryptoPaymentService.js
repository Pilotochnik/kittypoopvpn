// API URL
const API_URL = '/api';

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
 * @param {string} paymentData.userId - ID пользователя или 'anonymous-user' для анонимных платежей
 * @param {string} paymentData.plan - План (basic, standard, premium)
 * @param {string} paymentData.currency - Криптовалюта (btc, eth, usdt, usdt_eth)
 * @param {string} paymentData.period - Период (monthly, yearly)
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const createPayment = async (paymentData) => {
  try {
    // Проверяем, есть ли userId, если нет - используем анонимный идентификатор
    if (!paymentData.userId) {
      paymentData.userId = 'anonymous-user';
      console.log('Используется анонимный пользователь для создания платежа');
    }
    
    logApiCall('POST', `${API_URL}/payment/create`, paymentData);
    const response = await fetch(`${API_URL}/payment/create`, {
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
    
    logApiCall('GET', `${API_URL}/payment/status/${paymentId}`);
    const response = await fetch(`${API_URL}/payment/status/${paymentId}`);
    
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
    const paymentData = data.payment;
    
    // Если платеж завершен, vpnKey уже включен в объект payment с сервера
    if (paymentData && paymentData.status === 'completed') {
      console.log('Платеж завершен, проверяю наличие VPN ключа:', {
        hasVpnKey: !!paymentData.vpnKey,
        vpnKeyDetails: paymentData.vpnKey ? {
          id: paymentData.vpnKey.id,
          hasConfig: !!paymentData.vpnKey.config,
          configType: typeof paymentData.vpnKey.config
        } : null
      });
    }
    
    // Сохраняем платеж в кеше
    if (paymentData) {
      const now = new Date().getTime();
      paymentCache.set(paymentId, {
        ...paymentData,
        cachedAt: now
      });
    }
    
    return paymentData;
  } catch (error) {
    console.error('Ошибка при получении данных платежа:', error);
    throw error;
  }
};

/**
 * Имитирует подтверждение платежа (в реальном приложении это обычно делается через вебхук от платежной системы)
 * @param {string} paymentId - ID платежа
 * @returns {Promise<object>} - Объект с данными платежа
 */
export const confirmPayment = async (paymentId) => {
  try {
    logApiCall('POST', `${API_URL}/payment/${paymentId}/confirm`);
    const response = await fetch(`${API_URL}/payment/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось подтвердить платеж');
    }
    
    // Обновляем кеш, если есть данные о платеже
    if (data.payment) {
      const now = new Date().getTime();
      paymentCache.set(paymentId, {
        ...data.payment,
        cachedAt: now
      });
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
    logApiCall('POST', `${API_URL}/payment/status/${paymentId}/confirm`);
    const response = await fetch(`${API_URL}/payment/status/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось подтвердить ручной платеж');
    }
    
    // Обновляем кеш, если есть данные о платеже
    if (data.payment) {
      const now = new Date().getTime();
      paymentCache.set(paymentId, {
        ...data.payment,
        cachedAt: now
      });
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при подтверждении ручного платежа:', error);
    throw error;
  }
}; 