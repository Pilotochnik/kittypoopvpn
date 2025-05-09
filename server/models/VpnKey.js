// Модель VpnKey для работы с SQLite
const { getDB } = require('../db');

// Класс VpnKey для работы с таблицей vpn_keys
class VpnKey {
  // Обновление статуса ключа при его истечении
  static async checkAndUpdateStatus(key) {
    // Если ключ активен, но срок его действия истёк, деактивируем его
    if (key && key.isActive === 1) {
      const now = new Date();
      const expiryDate = new Date(key.expires);
      
      if (expiryDate < now) {
        const db = getDB();
        await db.run('UPDATE vpn_keys SET isActive = 0 WHERE id = ?', key.id);
        key.isActive = 0;
        console.log(`Автоматическая деактивация истёкшего ключа ID: ${key.id}, UUID: ${key.uuid}`);
      }
    }
    return key;
  }
  
  // Поиск ключа по UUID с проверкой статуса
  static async findByUuid(uuid) {
    const db = getDB();
    const key = await db.get('SELECT * FROM vpn_keys WHERE uuid = ?', uuid);
    return this.checkAndUpdateStatus(key);
  }
  
  // Поиск ключа по ID с проверкой статуса
  static async findById(id) {
    const db = getDB();
    const key = await db.get('SELECT * FROM vpn_keys WHERE id = ?', id);
    return this.checkAndUpdateStatus(key);
  }
  
  // Поиск ключей по условию с проверкой статуса
  static async find(condition = {}) {
    const db = getDB();
    let query = 'SELECT * FROM vpn_keys';
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
    
    const keys = await db.all(query, params);
    
    // Проверяем статус каждого ключа
    for (let i = 0; i < keys.length; i++) {
      keys[i] = await this.checkAndUpdateStatus(keys[i]);
    }
    
    return keys;
  }
  
  // Создание нового ключа
  static async create(data) {
    const db = getDB();
    
    // Формируем SQL запрос для вставки данных
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const result = await db.run(
      `INSERT INTO vpn_keys (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    // Если ключ был успешно создан, возвращаем его данные
    if (result && result.lastID) {
      return await this.findById(result.lastID);
    }
    
    return null;
  }
  
  // Обновление ключа
  static async update(uuid, data) {
    const db = getDB();
    
    // Формируем SQL запрос для обновления данных
    const keys = Object.keys(data);
    const updates = keys.map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), uuid];
    
    const result = await db.run(
      `UPDATE vpn_keys SET ${updates} WHERE uuid = ?`,
      values
    );
    
    // Если ключ был успешно обновлен, возвращаем его данные
    if (result && result.changes > 0) {
      return await this.findByUuid(uuid);
    }
    
    return null;
  }
  
  // Удаление ключа
  static async delete(uuid) {
    const db = getDB();
    const result = await db.run('DELETE FROM vpn_keys WHERE uuid = ?', uuid);
    return result && result.changes > 0;
  }
  
  // Подсчет активных ключей пользователя с проверкой статуса
  static async countActive(userId) {
    const db = getDB();
    
    // Сначала обновляем все истекшие ключи
    await db.run(`
      UPDATE vpn_keys
      SET isActive = 0
      WHERE userId = ? AND isActive = 1 AND expires < datetime('now')
    `, userId);
    
    // Затем считаем действительно активные ключи
    const result = await db.get(
      'SELECT COUNT(*) as count FROM vpn_keys WHERE userId = ? AND isActive = 1 AND expires > datetime("now")',
      userId
    );
    return result ? result.count : 0;
  }
}

module.exports = VpnKey; 