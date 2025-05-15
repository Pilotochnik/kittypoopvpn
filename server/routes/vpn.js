const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const User = require('../models/User');
const VpnKey = require('../models/VpnKey');
require('dotenv').config();

const router = express.Router();

// API для создания пробного ключа
router.post('/trial-key', async (req, res) => {
  try {
    const { uuid, expiryTime, userId } = req.body;
    
    if (!uuid || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указан UUID ключа или ID пользователя' 
      });
    }
    
    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '😕 Пользователь не найден. Пожалуйста, попробуйте войти заново.' 
      });
    }
    
    // Проверяем, есть ли уже активный пробный ключ у пользователя
    const existingTrialKey = await VpnKey.findOne({ 
      userId, 
      isTrial: true,
      isActive: true
    });
    
    if (existingTrialKey) {
      return res.status(400).json({
        success: false,
        message: '😊 У вас уже есть активный тестовый ключ! Вы можете воспользоваться им до окончания срока действия.',
        key: {
          uuid: existingTrialKey.uuid,
          expires: existingTrialKey.expires
        }
      });
    }
    
    // Устанавливаем срок действия ключа - 1 час от текущего времени
    let expiry;
    if (expiryTime) {
      // Если время истечения пришло в формате ISO строки
      expiry = new Date(expiryTime);
    } else {
      // Иначе устанавливаем +1 час от текущего времени
      expiry = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    // Проверяем валидность даты
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: '⏰ Некорректный формат даты. Пожалуйста, попробуйте ещё раз!' 
      });
    }
    
    // Генерируем конфигурацию VPN
    const vpnConfig = `server_address=vpn.kittypoopvpn.com
port=4843
private_key=${crypto.randomBytes(32).toString('base64')}
dns=1.1.1.1
allowed_ips=0.0.0.0/0,::/0`;

    // Создаем запись о пробном ключе в базе данных
    const vpnKey = new VpnKey({
      uuid,
      userId: user._id,
      plan: 'trial',
      period: 0, // 0 месяцев для пробного ключа
      created: new Date(),
      expires: expiry,
      isActive: true,
      isTrial: true,
      config: vpnConfig
    });
    
    await vpnKey.save();
    
    console.log(`Создан пробный ключ ${uuid} для пользователя ${userId}, действителен до ${expiry}`);
    
    return res.json({ 
      success: true, 
      uuid, 
      expires: expiry,
      config: vpnConfig,
      message: 'Пробный ключ успешно создан'
    });
  } catch (error) {
    console.error('Ошибка при создании пробного ключа:', error);
    return res.status(500).json({ 
      success: false, 
      message: '😢 Что-то пошло не так на сервере. Пожалуйста, попробуйте позже или напишите в поддержку!' 
    });
  }
});

// API для проверки статуса пробного ключа
router.get('/key/:uuid', async (req, res) => {
  const { uuid } = req.params;
  
  try {
    const vpnKey = await VpnKey.findOne({ uuid });
    
    if (!vpnKey) {
      return res.status(404).json({ 
        success: false, 
        message: '🔑 Ключ не найден. Возможно, он был удалён или срок действия истёк.' 
      });
    }
    
    const now = new Date();
    
    // Проверяем, не истек ли срок действия ключа
    if (now > vpnKey.expires && vpnKey.isActive) {
      vpnKey.isActive = false;
      await vpnKey.save();
      
      return res.json({
        success: true,
        isActive: false,
        message: 'Срок действия ключа истек',
        expires: vpnKey.expires
      });
    }
    
    return res.json({
      success: true,
      key: {
        uuid: vpnKey.uuid,
        plan: vpnKey.plan,
        period: vpnKey.period,
        created: vpnKey.created,
        expires: vpnKey.expires,
        isActive: vpnKey.isActive,
        isTrial: vpnKey.isTrial,
        config: vpnKey.config
      },
      message: vpnKey.isActive ? 'Ключ активен' : 'Ключ неактивен'
    });
  } catch (error) {
    console.error('Ошибка при проверке статуса ключа:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера при проверке статуса ключа'
    });
  }
});

// API для получения всех ключей пользователя
router.get('/keys/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Проверка существования пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '😕 Пользователь не найден. Пожалуйста, попробуйте войти заново.' 
      });
    }
    
    // Получаем все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId });
    vpnKeys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Обновляем статус у истекших ключей
    const now = new Date();
    for (const key of vpnKeys) {
      if (now > key.expires && key.isActive) {
        key.isActive = false;
        await key.save();
      }
    }
    
    // Форматируем данные для ответа
    const formattedKeys = vpnKeys.map(key => ({
      uuid: key.uuid,
      plan: key.plan,
      period: key.period,
      created: key.createdAt,
      expires: key.expiresAt,
      isActive: key.isActive,
      isTrial: key.isTrial,
      config: key.config
    }));
    
    return res.json({
      success: true,
      keys: formattedKeys
    });
  } catch (error) {
    console.error('Ошибка при получении VPN ключей пользователя:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при получении VPN ключей'
    });
  }
});

// API для деактивации ключа
router.post('/deactivate/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const vpnKey = await VpnKey.findOne({ uuid });
    
    if (!vpnKey) {
      return res.status(404).json({ 
        success: false, 
        message: '🔑 Ключ не найден. Возможно, он был удалён или срок действия истёк.' 
      });
    }
    
    // Деактивируем ключ
    vpnKey.isActive = false;
    await vpnKey.save();
    
    return res.json({
      success: true,
      message: 'Ключ успешно деактивирован'
    });
  } catch (error) {
    console.error('Ошибка при деактивации ключа:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при деактивации ключа'
    });
  }
});

// Функция для генерации QR-кода
async function generateQRCode(data) {
  try {
    // Генерируем QR-код как SVG
    const qrCodeSvg = await QRCode.toString(data, {
      type: 'svg',
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
    return `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`;
  } catch (error) {
    console.error('Ошибка при генерации QR-кода:', error);
    return null;
  }
}

// Новый эндпоинт: генерация тестового ключа без авторизации (1 ключ на 1 IP)
router.post('/trial-key/anonymous', async (req, res) => {
  try {
    // Получаем IP пользователя
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Пытаемся получить userId из тела запроса или из авторизации (если есть)
    let userId = 'anonymous';
    if (req.body && req.body.userId) {
      userId = req.body.userId;
    } else if (req.user && req.user.id) {
      userId = req.user.id;
    }

    console.log('[TRIAL_KEY_ANO] --- Запрос на генерацию анонимного пробного ключа ---');
    console.log('[TRIAL_KEY_ANO] IP пользователя:', ip, 'userId:', userId);

    // Проверяем, есть ли уже активный пробный ключ с этого IP или userId
    let existingTrialKey = [];
    if (userId !== 'anonymous') {
      existingTrialKey = await VpnKey.find({ userId, isActive: 1, plan: 'trial' });
    } else {
      existingTrialKey = await VpnKey.find({ ip, isActive: 1, plan: 'trial' });
    }
    if (existingTrialKey && existingTrialKey.length > 0) {
      const now = new Date();
      const lastKey = existingTrialKey[0];
      const keyCreatedAt = new Date(lastKey.createdAt || lastKey.created || lastKey.expiresAt || lastKey.expires);
      const hoursSinceLastTrial = (now - keyCreatedAt) / (1000 * 60 * 60);
      if (hoursSinceLastTrial < 24) {
        return res.status(400).json({
          error: '😊 Вы уже получили тестовый ключ. Количество тестовых ключей ограничено: 1 шт. в 24 часа. Пожалуйста, попробуйте снова позже!'
        });
      }
    }

    // Создаем новый пробный ключ
    const uuid = '62bc8aba-1979-4918-85ca-0e2eea1df559';
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 час
    const config = generateVlessConfig(uuid);
    const internal_id = crypto.randomUUID();

    const newKey = await VpnKey.create({
      internal_id,
      uuid,
      userId,
      plan: 'trial',
      expiresAt: expiryDate,
      isActive: 1,
      ip,
      config
    });

    // Генерируем QR-код
    const qrCode = await generateQRCode(config);

    // Устанавливаем таймер деактивации
    await VpnKey.scheduleDeactivation(uuid, expiryDate);
    console.log('[VpnKey] Установлен таймер деактивации для ключа', uuid, 'через', 3600, 'секунд');

    res.json({
      message: 'Пробный ключ успешно создан',
      key: {
        uuid,
        config,
        expires: expiryDate,
        qrCode
      }
    });

  } catch (error) {
    console.error('[TRIAL_KEY_ANO] Ошибка:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Функция для генерации конфигурации VLESS
function generateVlessConfig(uuid) {
  const host = '167.99.215.131';
  const port = '4843';
  const encryption = 'none';
  const security = 'tls';
  const type = 'ws';
  const path = '/vless';
  const flow = 'none';
  const alpn = 'h2,h3,http/1.1';
  const sni = host;
  const fp = 'chrome';
  const pbk = '';  // публичный ключ, если используется
  const sid = '';  // идентификатор потока, если используется
  const spx = '/';  // путь к сервису, если используется
  const configName = 'KittyPoopVPN_Standard';

  // Базовые параметры
  let config = `vless://${uuid}@${host}:${port}?` +
    `encryption=${encryption}&` +
    `security=${security}&` +
    `type=${type}&` +
    `host=${host}&` +
    `path=${encodeURIComponent(path)}&` +
    `flow=${flow}&` +
    `alpn=${encodeURIComponent(alpn)}`;

  // Добавляем параметры для улучшения работы через мобильную сеть
  config += `&fp=${fp}`;
  config += `&sni=${host}`;
  
  // Добавляем опциональные параметры, если они заданы
  if (pbk) config += `&pbk=${pbk}`;
  if (sid) config += `&sid=${sid}`;
  if (spx) config += `&spx=${encodeURIComponent(spx)}`;
  
  // Добавляем имя конфигурации
  config += `#${encodeURIComponent(configName)}`;

  return config;
}

// API для генерации QR-кода для конфигурации
router.get('/qr-code/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Ищем ключ в базе данных
    const vpnKey = await VpnKey.findOne({ uuid });
    if (!vpnKey) {
      return res.status(404).json({ 
        success: false, 
        message: '🔑 Ключ не найден. Возможно, он был удалён или срок действия истёк.' 
      });
    }

    // Генерируем QR-код
    const qrCode = await generateQRCode(vpnKey.config);
    if (!qrCode) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка при генерации QR-кода'
      });
    }

    res.json({
      success: true,
      qrCode
    });
  } catch (error) {
    console.error('Ошибка при генерации QR-кода:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// Экспортируем router в качестве основного объекта для Express
const routerExport = router;

module.exports = router; 