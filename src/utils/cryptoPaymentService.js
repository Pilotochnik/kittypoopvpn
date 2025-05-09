// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Добавляем функцию для отладки запросов
const logApiCall = (method, url, data = null) => {
  console.log(`API ${method} запрос:`, url);
  if (data) console.log('Данные:', data);
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось создать платеж');
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при создании платежа:', error);
    throw error;
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
    logApiCall('GET', `${API_URL}/crypto-payment/${paymentId}`);
    const response = await fetch(`${API_URL}/crypto-payment/${paymentId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Не удалось получить информацию о платеже');
    }
    
    return data.payment;
  } catch (error) {
    console.error('Ошибка при получении информации о платеже:', error);
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