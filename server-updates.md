# Инструкции по обновлению сервера

Этот файл содержит изменения для внесения в server/index.js
Используйте его как руководство для ручного применения изменений

## 1. Вначале добавить константу для URL фронтенда

```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://kittypoopvpn.ru';
```

## 2. Изменить URL для перенаправления после авторизации в Telegram (строки около 105-106)

Заменить:
```javascript
const returnUrl = `${process.env.FRONTEND_URL || 'https://kittypoopvpn.ru'}/auth-success?token=${authToken}&redirect=/profile`;
```

На:
```javascript
const returnUrl = `${FRONTEND_URL}/auth-success?token=${authToken}&redirect=/profile`;
```

## 3. Обновить кнопки в inline_keyboard:

```javascript
reply_markup: {
  inline_keyboard: [
    [{ text: '👤 Личный кабинет', url: returnUrl }],
    [{ text: '🌐 Перейти на сайт', url: FRONTEND_URL }]
  ]
}
```

## 4. Обновить формат отображения ключей в Telegram боте

### 4.1 Создать файл bot_helpers.js в директории server/utils/

Скопировать содержимое файла telegram_bot_fix.js в новый файл bot_helpers.js

### 4.2 Импортировать helper-функции в начале server/index.js

```javascript
// Импортируем вспомогательные функции для Telegram-бота
const { 
  sendKeyDetailsTelegram, 
  handleMyProfileCallback, 
  handleShowKeyCallback 
} = require('./utils/bot_helpers');
```

### 4.3 Изменить обработчик callback_query для 'my_profile'

Найти обработчик:
```javascript
if (data === 'my_profile') {
  // ... код обработки профиля ...
}
```

Заменить на:
```javascript
if (data === 'my_profile') {
  await handleMyProfileCallback(bot, chatId, userId);
}
```

### 4.4 Добавить обработчик для show_key_XXXX

После обработчика show_config_XXX добавить:
```javascript
else if (data.startsWith('show_key_')) {
  // Извлекаем UUID ключа из callback data
  const keyUuid = data.replace('show_key_', '');
  await handleShowKeyCallback(bot, chatId, userId, keyUuid);
}
```

### 4.5 Изменить отправку информации о новом ключе в функции sendVpnKeyToUser

Найти функцию sendVpnKeyToUser и изменить ее, заменив отправку сообщения на:

```javascript
if (user.telegramId) {
  // Отправляем полную информацию о ключе через Telegram
  await sendKeyDetailsTelegram(bot, user.telegramId, vpnKeyData, false);
  console.log(`VPN ключ отправлен пользователю через Telegram`);
}
```

## 5. Обновление URL в коде

Изменить все ссылки с kittypoopvpn.com на kittypoopvpn.ru
Для этого можно использовать команду:

```bash
find /var/www/kittypoopvpn/server -type f -name "*.js" -exec sed -i 's/kittypoopvpn\.com/kittypoopvpn.ru/g' {} \;
```

## 6. В обработке создания платежа добавить поддержку анонимных пользователей

Найти метод `app.post('/api/crypto-payment'` или подобный и заменить проверку пользователя:

```javascript
// Определяем, нужно ли проверять существование пользователя
let user = null;

// Если userId не anonymous-user, проверяем существование пользователя
if (userId && userId !== 'anonymous-user') {
  user = await User.findById(userId);
  if (!user) {
    console.error('Пользователь не найден:', userId);
    return res.status(404).json({ 
      success: false, 
      message: 'Пользователь не найден' 
    });
  }
} else {
  console.log('Создание анонимного платежа без привязки к пользователю');
}
``` 