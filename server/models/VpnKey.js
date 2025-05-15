// Модель VpnKey для работы с SQLite
const { getDB } = require('../db');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// Класс VpnKey для работы с таблицей vpn_keys
class VpnKey {
  // Обновление статуса ключа при его истечении
  static async checkAndUpdateStatus(key) {
    if (!key) return null;

    try {
      const now = new Date();
      const expiryDate = new Date(key.expiresAt);

      if (key.isActive && expiryDate < now) {
        const db = getDB();
        await db.run('UPDATE vpn_keys SET isActive = 0 WHERE uuid = ?', key.uuid);
        key.isActive = 0;
        logger.info(`Ключ ${key.uuid} деактивирован по истечении срока действия`);
      }

      return key;
    } catch (error) {
      logger.error('Ошибка при проверке статуса ключа:', error);
      throw error;
    }
  }
  
  // Поиск ключа по UUID
  static async findByUuid(uuid) {
    try {
      const db = getDB();
      const key = await db.get('SELECT * FROM vpn_keys WHERE uuid = ?', uuid);
      return this.checkAndUpdateStatus(key);
    } catch (error) {
      logger.error('Ошибка при поиске ключа по UUID:', error);
      throw error;
    }
  }
  
  // Поиск ключа по ID
  static async findById(id) {
    try {
      const db = getDB();
      const key = await db.get('SELECT * FROM vpn_keys WHERE id = ?', id);
      return this.checkAndUpdateStatus(key);
    } catch (error) {
      logger.error('Ошибка при поиске ключа по ID:', error);
      throw error;
    }
  }
  
  // Поиск ключей по условию
  static async find(conditions = {}) {
    try {
      const db = getDB();
      let query = 'SELECT * FROM vpn_keys';
      const values = [];

      if (Object.keys(conditions).length > 0) {
        const where = Object.keys(conditions)
          .map(key => `${key} = ?`)
          .join(' AND ');
        values.push(...Object.values(conditions));
        query += ` WHERE ${where}`;
      }

      return await db.all(query, values);
    } catch (error) {
      logger.error('Ошибка при поиске ключей:', error);
      throw error;
    }
  }
  
  // Создание нового ключа
  static async create(keyData) {
    try {
      const db = getDB();
      const { uuid, userId, plan, config, expiresAt, ip } = keyData;
      
      // Преобразуем дату в строку ISO для SQLite
      const expiresAtStr = new Date(expiresAt).toISOString();
      
      logger.info('Создание VPN ключа в БД:', {
        uuid,
        userId,
        plan,
        config: typeof config === 'string' ? config.substring(0, 50) + '...' : null,
        configType: typeof config,
        expiresAt: expiresAtStr
      });
      
      const result = await db.run(
        'INSERT INTO vpn_keys (uuid, userId, plan, config, expiresAt, ip) VALUES (?, ?, ?, ?, ?, ?)',
        [uuid, userId, plan, config, expiresAtStr, ip]
      );
      
      const createdKey = await this.findById(result.lastID);
      logger.info('VPN ключ создан в БД:', {
        id: result.lastID,
        uuid: createdKey.uuid,
        hasConfig: !!createdKey.config,
        configType: typeof createdKey.config
      });
      
      return createdKey;
    } catch (error) {
      logger.error('Ошибка при создании ключа:', error);
      throw error;
    }
  }
  
  // Обновление ключа
  static async update(uuid, updateData) {
    try {
      const db = getDB();
      const fields = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updateData), uuid];
      
      await db.run(`UPDATE vpn_keys SET ${fields} WHERE uuid = ?`, values);
      return this.findByUuid(uuid);
    } catch (error) {
      logger.error('Ошибка при обновлении ключа:', error);
      throw error;
    }
  }
  
  // Удаление ключа
  static async delete(uuid) {
    try {
      const db = getDB();
      await db.run('DELETE FROM vpn_keys WHERE uuid = ?', uuid);
    } catch (error) {
      logger.error('Ошибка при удалении ключа:', error);
      throw error;
    }
  }
  
  // Подсчет активных ключей пользователя
  static async countActive(userId) {
    try {
      const db = getDB();
      const result = await db.get(
        'SELECT COUNT(*) as count FROM vpn_keys WHERE userId = ? AND isActive = 1 AND expiresAt > datetime("now")',
        userId
      );
      return result ? result.count : 0;
    } catch (error) {
      logger.error('Ошибка при подсчете активных ключей:', error);
      throw error;
    }
  }

  static async findByInternalId(internal_id) {
    const db = getDB();
    return db.get('SELECT * FROM vpn_keys WHERE internal_id = ?', [internal_id]);
  }

  static async findActive() {
    try {
      const db = getDB();
      const keys = await db.all(
        'SELECT * FROM vpn_keys WHERE isActive = 1 AND expiresAt > datetime("now")'
      );
      return keys;
    } catch (error) {
      logger.error('Ошибка при поиске активных ключей:', error);
      throw error;
    }
  }

  static async createTable() {
    const db = getDB();
    const query = `
      CREATE TABLE IF NOT EXISTS vpn_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_id TEXT UNIQUE,
        uuid TEXT NOT NULL,
        userId TEXT,
        plan TEXT NOT NULL,
        config TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME NOT NULL,
        isActive INTEGER DEFAULT 1,
        ip TEXT
      )
    `;
    await db.run(query);
  }

  static async recreateTable() {
    const db = getDB();
    try {
      // Удаляем существующую таблицу
      await db.run('DROP TABLE IF EXISTS vpn_keys');
      console.log('[VpnKey] Существующая таблица vpn_keys удалена');
      
      // Создаем таблицу заново
      await this.createTable();
      console.log('[VpnKey] Таблица vpn_keys успешно пересоздана');
    } catch (error) {
      console.error('[VpnKey] Ошибка при пересоздании таблицы:', error);
      throw error;
    }
  }

  static async restoreDeactivationTimers() {
    try {
      // Проверяем существование таблицы
      const db = getDB();
      const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='vpn_keys'");
      
      if (!tableExists) {
        console.log('[VpnKey] Таблица vpn_keys еще не создана, пропускаем восстановление таймеров');
        return;
      }

      // Получаем все активные ключи
      const activeKeys = await this.find({ isActive: 1 });
      
      console.log(`[VpnKey] Восстановление таймеров для ${activeKeys?.length || 0} активных ключей`);
      
      if (!activeKeys || activeKeys.length === 0) {
        console.log('[VpnKey] Активные ключи не найдены');
        return;
      }

      for (const key of activeKeys) {
        const expiryDate = new Date(key.expiresAt);
        const now = new Date();
        
        // Если ключ уже истёк
        if (expiryDate <= now) {
          console.log(`[VpnKey] Деактивация истекшего ключа: ${key.uuid}`);
          await this.update(key.uuid, { isActive: 0 });
          continue;
        }
        
        // Вычисляем время до истечения
        const timeUntilExpiry = expiryDate.getTime() - now.getTime();
        
        // Устанавливаем таймер на деактивацию
        setTimeout(async () => {
          console.log(`[VpnKey] Автоматическая деактивация ключа по таймеру: ${key.uuid}`);
          await this.update(key.uuid, { isActive: 0 });
        }, timeUntilExpiry);
        
        console.log(`[VpnKey] Установлен таймер деактивации для ключа ${key.uuid} через ${Math.round(timeUntilExpiry/1000)} секунд`);
      }
    } catch (error) {
      console.error('[VpnKey] Ошибка при восстановлении таймеров:', error);
      throw error;
    }
  }

  static async scheduleDeactivation(uuid, expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const timeUntilExpiry = expiry.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 0) {
      console.log(`[VpnKey] Ключ ${uuid} уже истёк, деактивирую немедленно`);
      await this.update(uuid, { isActive: 0 });
      return;
    }

    this._setDeactivationTimer(uuid, timeUntilExpiry, expiryDate);
    console.log(`[VpnKey] Установлен каскадный таймер деактивации для ключа ${uuid}, истекает ${expiryDate}`);
  }

  static _setDeactivationTimer(uuid, remainingTime, expiryDate) {
    // Максимальное время для setTimeout (24 дня в миллисекундах)
    const MAX_TIMEOUT = 2073600000;

    if (remainingTime <= 0) {
      // Время истекло, деактивируем ключ
      this.update(uuid, { isActive: 0 })
        .then(() => console.log(`[VpnKey] Автоматическая деактивация ключа по таймеру: ${uuid}`))
        .catch(err => console.error(`[VpnKey] Ошибка при деактивации ключа ${uuid}:`, err));
      return;
    }

    // Определяем интервал для текущего таймера
    const interval = Math.min(remainingTime, MAX_TIMEOUT);

    setTimeout(() => {
      const newRemainingTime = remainingTime - interval;
      if (newRemainingTime > 0) {
        // Если время ещё осталось, устанавливаем следующий таймер
        console.log(`[VpnKey] Продление таймера деактивации для ключа ${uuid}, осталось ${Math.round(newRemainingTime/1000)} секунд`);
        this._setDeactivationTimer(uuid, newRemainingTime, expiryDate);
      } else {
        // Время истекло, деактивируем ключ
        this.update(uuid, { isActive: 0 })
          .then(() => console.log(`[VpnKey] Автоматическая деактивация ключа по таймеру: ${uuid}`))
          .catch(err => console.error(`[VpnKey] Ошибка при деактивации ключа ${uuid}:`, err));
      }
    }, interval);
  }

  static _generateVpnConfig(plan) {
    // Базовые параметры конфигурации
    const uuid = '62bc8aba-1979-4918-85ca-0e2eea1df559';
    const host = '167.99.215.131';
    const port = '443';
    
    // Параметры REALITY протокола
    const security = 'reality';
    const encryption = 'none';
    const type = 'tcp';
    const flow = 'xtls-rprx-vision';
    const pbk = 'IwWS24tOSoQ7dt3sSKyljB_XlN4h1c1kNlJNryWDsRU';
    const fp = 'random';
    const sni = 'www.cloudflare.com';
    const sid = '42';
    const spx = '/';
    const headerType = 'none';
    const alpn = 'null';
    
    // Формируем название для конфигурации
    const configName = `KittyPoopVPN_${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    
    // Собираем URL конфигурации
    const configUrl = `vless://${uuid}@${host}:${port}?` +
        `security=${security}&` +
        `encryption=${encryption}&` +
        `type=${type}&` +
        `flow=${flow}&` +
        `pbk=${pbk}&` +
        `fp=${fp}&` +
        `sni=${sni}&` +
        `sid=${sid}&` +
        `spx=${spx}&` +
        `headerType=${headerType}&` +
        `alpn=${alpn}#${configName}`;
    
    return configUrl;
  }

  static _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = VpnKey; 