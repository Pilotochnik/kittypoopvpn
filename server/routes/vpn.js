const express = require('express');
const crypto = require('crypto');
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
        message: 'Пользователь не найден' 
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
        message: 'У пользователя уже есть активный пробный ключ',
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
        message: 'Некорректный формат даты истечения срока' 
      });
    }
    
    // Генерируем конфигурацию VPN
    const vpnConfig = `server_address=vpn.kittypoopvpn.com
port=51820
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
      message: 'Внутренняя ошибка сервера при создании пробного ключа'
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
        message: 'Ключ не найден' 
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
        message: 'Пользователь не найден' 
      });
    }
    
    // Получаем все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId }).sort({ created: -1 });
    
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
      created: key.created,
      expires: key.expires,
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
        message: 'Ключ не найден' 
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

module.exports = router; 