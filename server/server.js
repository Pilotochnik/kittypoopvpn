const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const { connectDB } = require('./db');
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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Подключаем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/vpn', vpnRoutes);

// Маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.json({ message: 'Kitty Poop VPN API работает!' });
});

// Запуск сервера
async function startServer() {
  try {
    // Подключаемся к MongoDB
    await connectDB();
    
    // Запускаем сервер Express
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
    process.exit(1);
  }
}

// Запускаем сервер
startServer(); 