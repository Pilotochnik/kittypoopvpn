# Настройка Telegram Web App для KittyPoopVPN

## Подготовка проекта

1. **Установка полифиллов для Node.js модулей в браузере**:
   ```bash
   npm install crypto-browserify buffer stream-browserify util assert process path-browserify os-browserify stream-http https-browserify browserify-zlib react-app-rewired --save
   ```

2. **Патч модуля hash-base** (выполнить один раз):
   ```bash
   node stream-patch.js
   ```

3. **Создание файла .env** в корне проекта:
   ```
   # Настройки Telegram
   REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token_here
   REACT_APP_TELEGRAM_BOT_USERNAME=Kittypoopvpn_bot
   REACT_APP_TELEGRAM_BOT_TOKEN_PART=7651266107
   
   # URL для веб-приложения в Telegram
   REACT_APP_WEBAPP_URL=https://your-domain.com
   
   # API URL
   REACT_APP_API_URL=http://localhost:5000/api
   ```

## Настройка Telegram бота для Web App

1. **Создайте бота через BotFather**:
   - Отправьте `/newbot` в BotFather
   - Следуйте инструкциям для создания бота
   - Сохраните полученный токен бота

2. **Настройте команды бота**:
   - Отправьте `/setcommands` в BotFather
   - Выберите вашего бота
   - Отправьте список команд:
     ```
     start - Начать работу с ботом
     webapp - Открыть веб-приложение
     ```

3. **Включите Mini App**:
   - Отправьте `/newapp` в BotFather или используйте `/mybots` -> ваш бот -> Bot Settings -> Mini Apps
   - Введите название (например, "KittyPoopVPN")
   - Введите краткое описание
   - Укажите URL вашего сайта (должен быть с HTTPS в продакшн)
   - Загрузите фото 640x360px
   
4. **Добавьте кнопку меню**:
   - Отправьте `/setmenubutton` в BotFather
   - Выберите вашего бота
   - Отправьте URL вашего веб-приложения
   - Введите текст для кнопки (например, "Открыть VPN")

## Деплой на продакшн с HTTPS

1. **Соберите проект**:
   ```bash
   npm run build
   ```

2. **Настройка NGINX**:
   ```nginx
   server {
     listen 443 ssl;
     server_name your-domain.com;
     
     ssl_certificate /path/to/ssl/cert.pem;
     ssl_certificate_key /path/to/ssl/key.pem;
     
     location / {
       root /path/to/build;
       index index.html;
       try_files $uri $uri/ /index.html;
     }
     
     location /api {
       proxy_pass http://localhost:5000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

3. **Обновите .env файл** с правильным URL:
   ```
   REACT_APP_WEBAPP_URL=https://your-domain.com
   ```

## Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите на кнопку меню или отправьте команду `/webapp`
3. Веб-приложение должно открыться внутри Telegram
4. Убедитесь, что авторизация через Telegram работает

## Распространенные проблемы

1. **Ошибка CORS**: Убедитесь, что ваш сервер разрешает запросы с домена Telegram (t.me)

2. **Ошибка SSL**: Для продакшн необходим SSL-сертификат. Используйте Let's Encrypt для получения бесплатного сертификата.

3. **Ошибка с модулями Node.js**: При добавлении новых модулей, которые используют Node.js API, может потребоваться добавление дополнительных полифиллов в config-overrides.js.

4. **Проблемы с авторизацией**: Убедитесь, что токен бота правильно настроен и TELEGRAM_BOT_TOKEN_PART содержит первую часть токена до двоеточия. 