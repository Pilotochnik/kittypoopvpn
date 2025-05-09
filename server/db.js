// Используем SQLite вместо MongoDB
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'database.sqlite');

// Подключение к базе данных
let db = null;

// Функция подключения к SQLite
const connectDB = async () => {
  try {
    console.log('Попытка подключения к SQLite...');
    
    // Открываем базу данных
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Создаем таблицы, если они не существуют
    await createTables();
    
    console.log('SQLite успешно подключена');
    return true;
  } catch (error) {
    console.error('Ошибка подключения к SQLite:', error.message);
    return false;
  }
};

// Функция для создания таблиц
const createTables = async () => {
  // Создаем таблицу пользователей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegramId INTEGER UNIQUE,
      email TEXT UNIQUE,
      firstName TEXT,
      lastName TEXT,
      username TEXT,
      authDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME DEFAULT CURRENT_TIMESTAMP,
      isActive INTEGER DEFAULT 1
    )
  `);
  
  // Создаем таблицу VPN ключей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vpn_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE,
      userId INTEGER,
      plan TEXT,
      period INTEGER,
      created DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires DATETIME,
      isActive INTEGER DEFAULT 1,
      isTrial INTEGER DEFAULT 0,
      config TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  
  // Создаем таблицу платежей
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paymentId TEXT UNIQUE,
      userId INTEGER,
      status TEXT DEFAULT 'pending',
      amount REAL,
      currency TEXT,
      cryptoAmount REAL,
      cryptoAddress TEXT,
      plan TEXT,
      period INTEGER,
      expiryTime DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      transactionId TEXT,
      vpnKeyUuid TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (vpnKeyUuid) REFERENCES vpn_keys(uuid)
    )
  `);
  
  console.log('Таблицы базы данных созданы или уже существуют');
};

// Функция для получения подключения к базе данных
const getDB = () => {
  if (!db) {
    throw new Error('База данных не инициализирована');
  }
  return db;
};

// Корректное закрытие соединения при завершении процесса
process.on('SIGINT', async () => {
  if (db) {
    await db.close();
    console.log('Соединение с SQLite закрыто через SIGINT');
  }
  process.exit(0);
});

module.exports = { connectDB, getDB }; 