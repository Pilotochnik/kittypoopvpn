const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { logger } = require('./utils/logger');

let db = null;

// Путь к файлу базы данных
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

// Функция подключения к базе данных
async function connectDB() {
    try {
        if (db) {
            return db;
        }

        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        logger.info('SQLite успешно подключена');
        return db;
    } catch (error) {
        logger.error('Ошибка подключения к SQLite:', error);
        throw error;
    }
}

// Функция получения экземпляра базы данных
function getDB() {
    if (!db) {
        throw new Error('База данных не инициализирована');
    }
    return db;
}

// Функция закрытия соединения с базой данных
async function closeDB() {
    try {
        if (db) {
            await db.close();
            db = null;
            logger.info('Соединение с SQLite закрыто');
        }
    } catch (error) {
        logger.error('Ошибка при закрытии соединения с SQLite:', error);
        throw error;
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB
}; 