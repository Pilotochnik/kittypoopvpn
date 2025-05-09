// Модель Payment для работы с SQLite
const { getDB } = require('../db');

// Класс Payment для работы с таблицей payments
class Payment {
  // Поиск платежа по ID
  static async findById(id) {
    const db = getDB();
    return await db.get('SELECT * FROM payments WHERE id = ?', id);
  }
  
  // Поиск платежа по платежному ID
  static async findByPaymentId(paymentId) {
    const db = getDB();
    return await db.get('SELECT * FROM payments WHERE paymentId = ?', paymentId);
  }
  
  // Поиск платежей по условию
  static async find(condition = {}) {
    const db = getDB();
    let query = 'SELECT * FROM payments';
    const params = [];
    
    // Если есть условия, добавляем их в запрос
    if (Object.keys(condition).length > 0) {
      query += ' WHERE ';
      const conditions = [];
      
      for (const [key, value] of Object.entries(condition)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
      
      query += conditions.join(' AND ');
    }
    
    // По умолчанию сортируем по дате создания (новые в начале)
    query += ' ORDER BY createdAt DESC';
    
    return await db.all(query, params);
  }
  
  // Поиск одного платежа по условию
  static async findOne(condition = {}) {
    const db = getDB();
    let query = 'SELECT * FROM payments';
    const params = [];
    
    // Если есть условия, добавляем их в запрос
    if (Object.keys(condition).length > 0) {
      query += ' WHERE ';
      const conditions = [];
      
      for (const [key, value] of Object.entries(condition)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
      
      query += conditions.join(' AND ');
    }
    
    query += ' LIMIT 1';
    
    return await db.get(query, params);
  }
  
  // Создание нового платежа
  static async create(paymentData) {
    const db = getDB();
    
    // Формируем SQL запрос для вставки данных
    const keys = Object.keys(paymentData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(paymentData);
    
    const result = await db.run(
      `INSERT INTO payments (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    // Если платеж был успешно создан, возвращаем его данные
    if (result && result.lastID) {
      return await this.findById(result.lastID);
    }
    
    return null;
  }
  
  // Обновление платежа
  static async update(paymentId, paymentData) {
    const db = getDB();
    
    // Формируем SQL запрос для обновления данных
    const keys = Object.keys(paymentData);
    const updates = keys.map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(paymentData), paymentId];
    
    const result = await db.run(
      `UPDATE payments SET ${updates} WHERE paymentId = ?`,
      values
    );
    
    // Если платеж был успешно обновлен, возвращаем его данные
    if (result && result.changes > 0) {
      return await this.findByPaymentId(paymentId);
    }
    
    return null;
  }
}

module.exports = Payment; 