// Модель User для работы с SQLite
const { getDB } = require('../db');

// Класс User для работы с таблицей users
class User {
  // Поиск пользователя по ID
  static async findById(id) {
    const db = getDB();
    return await db.get('SELECT * FROM users WHERE id = ?', id);
  }
  
  // Поиск пользователя по Telegram ID
  static async findByTelegramId(telegramId) {
    const db = getDB();
    return await db.get('SELECT * FROM users WHERE telegramId = ?', telegramId);
  }
  
  // Поиск пользователя по email
  static async findByEmail(email) {
    const db = getDB();
    return await db.get('SELECT * FROM users WHERE email = ?', email);
  }
  
  // Поиск пользователя по условию
  static async findOne(condition = {}) {
    const db = getDB();
    let query = 'SELECT * FROM users';
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
    
    return await db.get(query, params);
  }
  
  // Создание нового пользователя
  static async create(userData) {
    const db = getDB();
    
    // Формируем SQL запрос для вставки данных
    const keys = Object.keys(userData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(userData);
    
    const result = await db.run(
      `INSERT INTO users (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    // Если пользователь был успешно создан, возвращаем его данные
    if (result && result.lastID) {
      return await this.findById(result.lastID);
    }
    
    return null;
  }
  
  // Обновление пользователя
  static async update(id, userData) {
    const db = getDB();
    
    // Формируем SQL запрос для обновления данных
    const keys = Object.keys(userData);
    const updates = keys.map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(userData), id];
    
    const result = await db.run(
      `UPDATE users SET ${updates} WHERE id = ?`,
      values
    );
    
    // Если пользователь был успешно обновлен, возвращаем его данные
    if (result && result.changes > 0) {
      return await this.findById(id);
    }
    
    return null;
  }
  
  // Поиск пользователей по условию
  static async find(condition = {}) {
    const db = getDB();
    let query = 'SELECT * FROM users';
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
    
    return await db.all(query, params);
  }
  
  // Подсчет пользователей
  static async countDocuments(condition = {}) {
    const db = getDB();
    let query = 'SELECT COUNT(*) as count FROM users';
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
    
    const result = await db.get(query, params);
    return result.count;
  }
}

module.exports = User; 