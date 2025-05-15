const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { httpLogger } = require('./utils/logger');
const { monitoringMiddleware } = require('./utils/monitoring');
const VpnKey = require('./models/VpnKey');
const Payment = require('./models/Payment');
const User = require('./models/User');
require('dotenv').config();

// Импорт роутеров
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const vpnRoutes = require('./routes/vpn');

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем любые локальные адреса для разработки
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    // Также разрешаем из переменной окружения, если она задана
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Логирование и мониторинг
app.use(httpLogger);
app.use(monitoringMiddleware);

// Подключаем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/vpn', vpnRoutes);

// Маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.json({ message: 'Kitty Poop VPN API работает!' });
});

// Функция инициализации базы данных и таймеров
async function initializeDatabase() {
  try {
    // Подключаемся к базе данных
    await connectDB();
    console.log('SQLite успешно подключена');
    
    // Пересоздаем таблицы
    await User.createTable();
    await VpnKey.recreateTable();
    await Payment.recreateTable();
    
    // Даем небольшую паузу для гарантии создания таблиц
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Только после создания таблиц восстанавливаем таймеры
    try {
      await VpnKey.restoreDeactivationTimers();
      console.log('Таймеры деактивации успешно восстановлены');
    } catch (error) {
      console.error('Ошибка при восстановлении таймеров:', error);
      // Продолжаем работу даже при ошибке с таймерами
    }
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

// Запуск сервера только если не в тестовом режиме
if (process.env.NODE_ENV !== 'test') {
  async function startServer() {
    try {
      // Инициализируем базу данных и таймеры
      await initializeDatabase();
      
      // Запускаем сервер
      app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
      });
    } catch (error) {
      console.error('Не удалось запустить сервер:', error);
      process.exit(1);
    }
  }
  startServer();
}

// Экспортируем приложение для тестов
module.exports = app; 