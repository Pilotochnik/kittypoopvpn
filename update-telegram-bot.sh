#!/bin/bash

# Скрипт для обновления Telegram бота на сервере
# Переводит отображение ключей VPN полностью в Telegram, без необходимости перехода на сайт

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Обновление Telegram бота для KittyPoopVPN...${NC}"

# Путь к серверу
SERVER_PATH="/var/www/kittypoopvpn"

# Создаем директорию utils, если она не существует
mkdir -p ${SERVER_PATH}/server/utils

# Бэкап оригинальных файлов
echo -e "${YELLOW}Создание резервных копий файлов...${NC}"
cp ${SERVER_PATH}/server/index.js ${SERVER_PATH}/server/index.js.bak.$(date +%Y%m%d%H%M%S)

# Создаем новый файл bot_helpers.js
echo -e "${YELLOW}Создание файла bot_helpers.js...${NC}"
cat > ${SERVER_PATH}/server/utils/bot_helpers.js << 'EOL'
const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const VpnKey = require('../models/VpnKey');

/**
 * Отправляет подробную информацию о ключе VPN пользователю через Telegram
 * с конфигурацией и QR-кодом для быстрой настройки
 */
async function sendKeyDetailsTelegram(bot, chatId, key, isReturnToProfile = true) {
  try {
    const expiryDate = new Date(key.expires);
    const now = new Date();
    const isExpired = now > expiryDate;
    
    // Определяем тип плана и эмодзи
    let planType, planEmoji;
    switch (key.plan) {
      case 'basic':
        planType = 'Базовый';
        planEmoji = '🔵';
        break;
      case 'premium':
        planType = 'Премиум';
        planEmoji = '🟣';
        break;
      case 'unlimited':
        planType = 'Безлимитный';
        planEmoji = '⭐';
        break;
      default:
        planType = 'Пробный';
        planEmoji = '🔶';
    }
    
    // Форматируем дату истечения
    const formattedExpiry = expiryDate.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Прогресс-бар использования срока подписки
    let progressBar = '';
    if (!isExpired && key.isActive === 1) {
      const totalDuration = (new Date(key.expires) - new Date(key.created));
      const elapsed = (Date.now() - new Date(key.created));
      const percentage = Math.min(100, Math.max(0, Math.floor(elapsed / totalDuration * 100)));
      
      // Создаем прогресс-бар из эмодзи
      const fullBlocks = Math.floor(percentage / 10);
      progressBar = '▓'.repeat(fullBlocks) + '░'.repeat(10 - fullBlocks) + ` ${percentage}%`;
    }
    
    // Определяем статус ключа
    let status, statusEmoji;
    if (key.isActive === 1 && !isExpired) {
      status = 'Активен';
      statusEmoji = '✅';
    } else if (isExpired) {
      status = 'Истек';
      statusEmoji = '⏱️';
    } else {
      status = 'Отключен';
      statusEmoji = '❌';
    }
    
    // Создаем QR-код для конфигурации VPN
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(key.config)}`;
    
    // Отправляем QR-код с кратким описанием
    await bot.sendPhoto(chatId, qrCodeUrl, {
      caption: `${planEmoji} *${planType} VPN ключ*\n\nQR-код для быстрой настройки. Отсканируйте его в приложении V2ray.`,
      parse_mode: 'Markdown'
    });
    
    // Формируем полное сообщение с информацией о ключе
    const keyMessage = `
${planEmoji} *${planType} VPN ключ*

🔑 *ID ключа:* \`vpn_${key.uuid}\`
${statusEmoji} *Статус:* ${status}
📅 *Срок действия:* ${formattedExpiry}
${key.period ? `⏳ *Период:* ${key.period} мес.\n` : ''}
${progressBar ? `📊 *Осталось:* ${progressBar}\n` : ''}
${key.isTrial === 1 ? '⚠️ Это пробный ключ (действует 1 час)\n' : ''}

📋 *VLESS-ключ для подключения:*
\`\`\`
${key.config}
\`\`\`

📱 *Инструкция по установке:*
1. Скачайте приложение V2rayTUN (iOS) или V2rayNG (Android)
2. Выберите "Импортировать из буфера обмена" или "Сканировать QR-код"
3. Вставьте конфигурацию выше или отсканируйте QR-код
4. Подключитесь к серверу
`;
    
    // Определяем кнопки в зависимости от статуса ключа
    const keyboardButtons = [];
    
    // Кнопка "Назад" будет всегда
    if (isReturnToProfile) {
      keyboardButtons.push([
        { text: '« Назад к списку ключей', callback_data: 'my_profile' }
      ]);
    } else {
      keyboardButtons.push([
        { text: '« Назад в главное меню', callback_data: 'back_to_main' }
      ]);
    }
    
    // Отправляем сообщение с информацией о ключе
    await bot.sendMessage(chatId, keyMessage, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboardButtons
      }
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при отправке информации о ключе:', error);
    return false;
  }
}

/**
 * Обновленная функция обработки callback_query для команды my_profile,
 * которая отправляет полную информацию о VPN ключах пользователя через Telegram
 */
async function handleMyProfileCallback(bot, chatId, userId) {
  try {
    // Получаем данные пользователя
    const user = await User.findByTelegramId(userId);
    
    if (!user) {
      await bot.sendMessage(chatId, 
        '❌ *Вы не зарегистрированы в системе*\n\n' +
        'Для использования сервиса необходимо авторизоваться через Telegram.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Получаем все ключи пользователя
    const vpnKeys = await VpnKey.find({ userId: user.id });
    
    // Если у пользователя нет ключей
    if (!vpnKeys || vpnKeys.length === 0) {
      await bot.sendMessage(chatId, 
        '🔍 *У вас пока нет VPN ключей*\n\n' +
        'Вы можете получить бесплатный пробный ключ на 1 час или приобрести полную подписку.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔑 Получить пробный ключ', callback_data: 'trial_key' }],
              [{ text: '« Назад в главное меню', callback_data: 'back_to_main' }]
            ]
          }
        }
      );
      return;
    }
    
    // Сортируем ключи: сначала активные, потом по дате истечения
    vpnKeys.sort((a, b) => {
      // Если один активен, а другой нет, активный идет первым
      if (a.isActive !== b.isActive) {
        return b.isActive - a.isActive;
      }
      // Иначе сортируем по дате истечения (сначала те, что истекают позже)
      return new Date(b.expires) - new Date(a.expires);
    });
    
    // Отправляем информацию о пользователе
    const userInfoMessage = `
🔹 *Профиль пользователя* 🔹

👤 *${user.firstName || ''} ${user.lastName || ''}*
${user.username ? `@${user.username}` : ''}
ID: \`${user.telegramId}\`

🔑 *Ваши VPN ключи:* ${vpnKeys.length}
`;
    
    await bot.sendMessage(chatId, userInfoMessage, { parse_mode: 'Markdown' });
    
    // Создаем краткий список ключей с кнопками для просмотра деталей
    const keyboardButtons = [];
    const now = new Date();
    
    // Добавляем кнопки для каждого ключа
    vpnKeys.forEach((key, index) => {
      const expiryDate = new Date(key.expires);
      const isExpired = now > expiryDate;
      
      // Определяем статус и эмодзи
      let statusEmoji;
      if (key.isActive === 1 && !isExpired) {
        statusEmoji = '✅';
      } else if (isExpired) {
        statusEmoji = '⏱️';
      } else {
        statusEmoji = '❌';
      }
      
      // Определяем тип плана и эмодзи
      let planEmoji;
      switch (key.plan) {
        case 'basic':
          planEmoji = '🔵';
          break;
        case 'premium':
          planEmoji = '🟣';
          break;
        case 'unlimited':
          planEmoji = '⭐';
          break;
        default:
          planEmoji = '🔶';
      }
      
      const buttonText = `${planEmoji} ${statusEmoji} VPN ключ #${index+1} - ${key.isTrial === 1 ? 'Пробный' : 'Подписка'}`;
      keyboardButtons.push([
        { text: buttonText, callback_data: `show_key_${key.uuid}` }
      ]);
    });
    
    // Добавляем кнопку для создания пробного ключа и возврата в меню
    keyboardButtons.push([{ text: '🔑 Получить пробный ключ', callback_data: 'trial_key' }]);
    keyboardButtons.push([{ text: '« Назад в главное меню', callback_data: 'back_to_main' }]);
    
    await bot.sendMessage(chatId, 
      '*Управление ключами*\n\n' +
      'Выберите ключ для просмотра подробной информации:', 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboardButtons
        }
      }
    );
  } catch (error) {
    console.error('Ошибка при обработке профиля:', error);
    await bot.sendMessage(chatId, 
      '❌ *Произошла ошибка*\n\n' +
      'Не удалось загрузить ваш профиль. Пожалуйста, попробуйте позже.',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '« Назад', callback_data: 'back_to_main' }]
          ]
        }
      }
    );
  }
}

/**
 * Обработчик callback_query для просмотра деталей ключа
 */
async function handleShowKeyCallback(bot, chatId, userId, keyUuid) {
  try {
    // Находим ключ в базе данных
    const key = await VpnKey.findByUuid(keyUuid);
    
    if (!key) {
      await bot.sendMessage(chatId, 
        '❌ *Ключ не найден*\n\n' +
        'Указанный ключ не найден в базе данных. Возможно, он был удален.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'my_profile' }]
            ]
          }
        }
      );
      return;
    }
    
    // Проверяем, принадлежит ли ключ этому пользователю
    const user = await User.findByTelegramId(userId);
    
    if (!user || key.userId !== user.id) {
      await bot.sendMessage(chatId, 
        '❌ *Доступ запрещен*\n\n' +
        'У вас нет доступа к этому ключу.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '« Назад', callback_data: 'my_profile' }]
            ]
          }
        }
      );
      return;
    }
    
    // Отправляем детальную информацию о ключе
    await sendKeyDetailsTelegram(bot, chatId, key);
  } catch (error) {
    console.error('Ошибка при показе информации о ключе:', error);
    await bot.sendMessage(chatId, 
      '❌ *Произошла ошибка*\n\n' +
      'Не удалось получить информацию о ключе. Пожалуйста, попробуйте позже.',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '« Назад', callback_data: 'my_profile' }]
          ]
        }
      }
    );
  }
}

module.exports = {
  sendKeyDetailsTelegram,
  handleMyProfileCallback,
  handleShowKeyCallback
};
EOL

# Обновление index.js
echo -e "${YELLOW}Обновление index.js...${NC}"

# Добавление импорта в начало файла после существующих импортов
sed -i '/require.*dotenv/a\
// Импортируем вспомогательные функции для Telegram-бота\
const { \
  sendKeyDetailsTelegram, \
  handleMyProfileCallback, \
  handleShowKeyCallback \
} = require("./utils/bot_helpers");' ${SERVER_PATH}/server/index.js

# Обновление обработчика my_profile
sed -i '/if (data === "my_profile") {/,/^ *}$/c\
  if (data === "my_profile") {\
    await handleMyProfileCallback(bot, chatId, userId);\
  }' ${SERVER_PATH}/server/index.js

# Добавление нового обработчика show_key_
sed -i '/else if (data.startsWith("show_config_")) {/i\
  else if (data.startsWith("show_key_")) {\
    // Извлекаем UUID ключа из callback data\
    const keyUuid = data.replace("show_key_", "");\
    await handleShowKeyCallback(bot, chatId, userId, keyUuid);\
  }' ${SERVER_PATH}/server/index.js

# Обновление функции sendVpnKeyToUser
# Это будет сложнее, потому что структура функции может различаться,
# поэтому ищем начало блока и затем выполняем замену
sed -i '/user.telegramId.*{/,/console.log.*VPN ключ отправлен/c\
    if (user.telegramId) {\
      // Отправляем полную информацию о ключе через Telegram\
      await sendKeyDetailsTelegram(bot, user.telegramId, vpnKeyData, false);\
      console.log(`VPN ключ отправлен пользователю через Telegram`);' ${SERVER_PATH}/server/index.js

# Обновление доменных имен
echo -e "${YELLOW}Обновление доменных имен...${NC}"
find ${SERVER_PATH}/server -type f -name "*.js" -exec sed -i 's/kittypoopvpn\.com/kittypoopvpn.ru/g' {} \;

# Перезапуск сервисов
echo -e "${YELLOW}Перезапуск сервисов...${NC}"
systemctl restart kittypoopvpn-server

echo -e "${GREEN}Обновление Telegram бота завершено!${NC}"
echo -e "${YELLOW}Проверьте логи сервера для выявления возможных ошибок:${NC}"
echo -e "journalctl -u kittypoopvpn-server -f" 