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

// Удаляю все функции, связанные с созданием и подтверждением крипто-платежей (createPayment, getPayment, confirmPayment, confirmManualPayment)
// ... существующий код ... 