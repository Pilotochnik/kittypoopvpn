const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const axios = require('axios');
const blockchainService = require('./blockchainService');
const { connectDB, getDB } = require('./db');
const keyManager = require('./utils/keyManager');
require('dotenv').config();

// Импорт моделей MongoDB
const User = require('./models/User');
const VpnKey = require('./models/VpnKey');
const Payment = require('./models/Payment');

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 5000;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Kittypoopvpn_bot';
// Frontend URL - используем домен .ru вместо IP-адреса
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://kittypoopvpn.ru';

// Хранилище для таймеров проверки платежей
const paymentTimers = new Map(); 