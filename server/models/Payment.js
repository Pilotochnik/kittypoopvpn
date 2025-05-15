// Модель Payment для работы с SQLite
const { getDB } = require('../db');
const { logger } = require('../utils/logger');

// Класс Payment для работы с таблицей payments
class PaymentService {
  // Поиск платежа по ID
  static async findById(id) {
    try {
      const db = getDB();
      const payment = await db.get('SELECT * FROM payments WHERE id = ?', id);
      return payment;
    } catch (error) {
      logger.error('Ошибка при поиске платежа:', error);
      throw error;
    }
  }
  
  // Поиск платежа по платежному ID
  static async findByPaymentId(paymentId) {
    try {
      const db = getDB();
      const payment = await db.get('SELECT * FROM payments WHERE paymentId = ?', paymentId);
      return payment;
    } catch (error) {
      logger.error('Ошибка при поиске платежа по paymentId:', error);
      throw error;
    }
  }
  
  // Поиск платежей по условию
  static async find(conditions = {}) {
    try {
      const db = getDB();
      let query = 'SELECT * FROM payments';
      const values = [];

      if (Object.keys(conditions).length > 0) {
        const where = Object.keys(conditions)
          .map(key => `${key} = ?`)
          .join(' AND ');
        values.push(...Object.values(conditions));
        query += ` WHERE ${where}`;
      }

      query += ' ORDER BY createdAt DESC';
      return await db.all(query, values);
    } catch (error) {
      logger.error('Ошибка при поиске платежей:', error);
      throw error;
    }
  }
  
  // Поиск одного платежа по условию
  static async findOne(query) {
    try {
      const payments = await this.find(query);
      const payment = payments[0] || null;
      if (payment) {
        payment.toJSON = function() {
          return {
            ...this,
            createdAt: new Date(this.createdAt).toISOString(),
            completedAt: this.completedAt ? new Date(this.completedAt).toISOString() : null,
            expiryTime: new Date(this.expiryTime).toISOString()
          };
        };
      }
      return payment;
    } catch (error) {
      logger.error('Ошибка при поиске платежа:', error);
      throw error;
    }
  }
  
  // Создание нового платежа
  static async create(paymentData) {
    try {
      const db = getDB();
      const fields = Object.keys(paymentData).join(', ');
      const placeholders = Object.keys(paymentData).map(() => '?').join(', ');
      const values = Object.values(paymentData);

      const result = await db.run(
        `INSERT INTO payments (${fields}) VALUES (${placeholders})`,
        values
      );

      return this.findById(result.lastID);
    } catch (error) {
      logger.error('Ошибка при создании платежа:', error);
      throw error;
    }
  }
  
  // Обновление платежа
  static async update(paymentId, updateData) {
    try {
      const db = getDB();
      const fields = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updateData), paymentId];

      await db.run(
        `UPDATE payments SET ${fields} WHERE paymentId = ?`,
        values
      );

      return this.findByPaymentId(paymentId);
    } catch (error) {
      logger.error('Ошибка при обновлении платежа:', error);
      throw error;
    }
  }

  // Создание таблицы payments
  static async createTable() {
    const db = getDB();
    const query = `
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paymentId TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        cryptopayInvoiceId TEXT,
        cryptopayPayUrl TEXT,
        plan TEXT NOT NULL,
        period INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME,
        expiryTime DATETIME NOT NULL,
        vpnKeyUuid TEXT
      )
    `;
    await db.run(query);
  }

  // Пересоздание таблицы payments
  static async recreateTable() {
    const db = await getDB();
    try {
      // Удаляем существующую таблицу
      await db.run('DROP TABLE IF EXISTS payments');
      console.log('[Payment] Существующая таблица payments удалена');
      
      // Создаем таблицу заново
      await this.createTable();
      console.log('[Payment] Таблица payments успешно пересоздана');
    } catch (error) {
      console.error('[Payment] Ошибка при пересоздании таблицы:', error);
      throw error;
    }
  }

  // Удаление платежа
  static async delete(paymentId) {
    try {
      const db = getDB();
      await db.run('DELETE FROM payments WHERE paymentId = ?', paymentId);
    } catch (error) {
      logger.error('Ошибка при удалении платежа:', error);
      throw error;
    }
  }

  static _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = PaymentService; 