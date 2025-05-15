const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath);

// Создаем таблицу для токенов, если она не существует
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

class Token {
  static async create(data) {
    return new Promise((resolve, reject) => {
      const { user, refreshToken } = data;
      
      const stmt = db.prepare(`
        INSERT INTO refresh_tokens (user_id, refresh_token)
        VALUES (?, ?)
      `);
      
      stmt.run([user, refreshToken], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          user,
          refreshToken
        });
      });
      
      stmt.finalize();
    });
  }
  
  static async findOne(filter) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM refresh_tokens WHERE ';
      const params = [];
      
      if (filter.user) {
        query += 'user_id = ?';
        params.push(filter.user);
      } else if (filter.refreshToken) {
        query += 'refresh_token = ?';
        params.push(filter.refreshToken);
      } else {
        reject(new Error('Не указаны параметры для поиска'));
        return;
      }
      
      query += ' LIMIT 1';
      
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve({
          id: row.id,
          user: row.user_id,
          refreshToken: row.refresh_token,
          createdAt: row.created_at
        });
      });
    });
  }
  
  static async deleteOne(filter) {
    return new Promise((resolve, reject) => {
      let query = 'DELETE FROM refresh_tokens WHERE ';
      const params = [];
      
      if (filter.user) {
        query += 'user_id = ?';
        params.push(filter.user);
      } else if (filter.refreshToken) {
        query += 'refresh_token = ?';
        params.push(filter.refreshToken);
      } else {
        reject(new Error('Не указаны параметры для удаления'));
        return;
      }
      
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          deletedCount: this.changes
        });
      });
    });
  }
  
  async save() {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE refresh_tokens SET refresh_token = ? WHERE id = ?
      `);
      
      stmt.run([this.refreshToken, this.id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id: this.id,
          user: this.user,
          refreshToken: this.refreshToken
        });
      });
      
      stmt.finalize();
    });
  }
}

module.exports = Token; 