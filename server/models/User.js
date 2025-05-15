// Модель User для работы с SQLite
const { getDB } = require('../db');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// Класс User для работы с таблицей users
class UserService {
  // Создание таблицы users
  static async createTable() {
    const db = getDB();
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegramId TEXT UNIQUE,
        username TEXT,
        firstName TEXT,
        lastName TEXT,
        photoUrl TEXT,
        authDate DATETIME,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.run(query);
  }

  // Поиск пользователя по ID
  static async findById(id) {
    try {
      const db = getDB();
      const user = await db.get('SELECT * FROM users WHERE id = ?', id);
      return user;
    } catch (error) {
      logger.error('Ошибка при поиске пользователя:', error);
      throw error;
    }
  }
  
  // Поиск пользователя по Telegram ID
  static async findByTelegramId(telegramId) {
    try {
      const db = getDB();
      const user = await db.get('SELECT * FROM users WHERE telegramId = ?', telegramId);
      return user;
    } catch (error) {
      logger.error('Ошибка при поиске пользователя по Telegram ID:', error);
      throw error;
    }
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
    try {
      const db = getDB();
      const fields = Object.keys(userData).join(', ');
      const placeholders = Object.keys(userData).map(() => '?').join(', ');
      const values = Object.values(userData);
      
      const query = `INSERT INTO users (${fields}) VALUES (${placeholders})`;
      
      const result = await db.run(query, values);
      
      return this.findById(result.lastID);
    } catch (error) {
      logger.error('Ошибка при создании пользователя:', error);
      throw error;
    }
  }
  
  // Обновление пользователя
  static async update(id, updateData) {
    try {
      const db = getDB();
      const fields = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updateData), id];
      
      await db.run(`UPDATE users SET ${fields} WHERE id = ?`, values);
      return this.findById(id);
    } catch (error) {
      logger.error('Ошибка при обновлении пользователя:', error);
      throw error;
    }
  }
  
  // Поиск всех пользователей
  static async findAll() {
    try {
      const db = getDB();
      const users = await db.all('SELECT * FROM users');
      return users;
    } catch (error) {
      logger.error('Ошибка при поиске всех пользователей:', error);
      throw error;
    }
  }
  
  // Удаление пользователя
  static async delete(id) {
    try {
      const db = getDB();
      await db.run('DELETE FROM users WHERE id = ?', id);
    } catch (error) {
      logger.error('Ошибка при удалении пользователя:', error);
      throw error;
    }
  }

  static _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = UserService; 