#!/bin/bash

# Скрипт для полного развертывания KittyPoopVPN на серверах с доменами
echo "🚀 Начало развертывания KittyPoopVPN..."

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
echo "📦 Установка необходимых пакетов..."
apt install -y curl wget git nginx certbot python3-certbot-nginx nodejs npm ufw

# Настройка брандмауэра
echo "🔒 Настройка брандмауэра..."
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 443/tcp
ufw allow 443/udp
ufw enable

# Клонирование репозитория
echo "📥 Клонирование репозитория..."
mkdir -p /var/www/kittypoopvpn
git clone https://github.com/yourusername/kittypoopvpn.git /var/www/kittypoopvpn || {
  cd /var/www/kittypoopvpn
  git pull
}

# Получение и установка SSL-сертификатов
echo "🔐 Установка SSL-сертификатов..."
DOMAIN="kittypoopvpn.com"
EMAIL="admin@kittypoopvpn.com"

# Создание конфигурации Nginx для получения сертификата
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN api.$DOMAIN vpn.$DOMAIN;
    
    location / {
        return 200 "KittyPoopVPN server";
    }
}
EOF

# Создание символической ссылки
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Получение сертификата для всех поддоменов
certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d vpn.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Копирование конфигурации Nginx из репозитория
cp /var/www/kittypoopvpn/nginx.conf /etc/nginx/sites-available/$DOMAIN
nginx -t && systemctl restart nginx

# Настройка и запуск серверной части
echo "🖥️ Настройка серверной части..."
cd /var/www/kittypoopvpn/server

# Установка зависимостей сервера
npm install

# Создание .env файла для сервера
cat > .env <<EOF
PORT=5000
FRONTEND_URL=https://$DOMAIN
TELEGRAM_BOT_TOKEN=7651266107:AAEEPCBB9CvPOfY9H3vjENOiR2q4jWU-Iik
TELEGRAM_BOT_USERNAME=Kittypoopvpn_bot
EOF

# Настройка systemd для автоматического запуска сервера
cat > /etc/systemd/system/kittypoopvpn-server.service <<EOF
[Unit]
Description=KittyPoopVPN Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/kittypoopvpn/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузка systemd и запуск сервера
systemctl daemon-reload
systemctl enable kittypoopvpn-server
systemctl start kittypoopvpn-server

# Настройка и сборка клиентской части
echo "🖥️ Настройка клиентской части..."
cd /var/www/kittypoopvpn

# Установка зависимостей клиента
npm install

# Создание .env файла для клиента
cat > .env <<EOF
REACT_APP_API_URL=https://api.$DOMAIN
PUBLIC_URL=https://$DOMAIN
REACT_APP_TELEGRAM_BOT_USERNAME=Kittypoopvpn_bot
EOF

# Сборка клиентской части
npm run build

# Настройка и установка V2ray
echo "🔄 Установка и настройка V2ray..."
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)

# Создание конфигурации V2ray
mkdir -p /usr/local/etc/v2ray
cat > /usr/local/etc/v2ray/config.json <<EOF
{
  "inbounds": [
    {
      "port": 10086,
      "protocol": "vless",
      "settings": {
        "clients": [],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "none"
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
EOF

# Запуск и активация V2ray
systemctl enable v2ray
systemctl restart v2ray

echo "✅ Развертывание KittyPoopVPN завершено!"
echo "🌐 Сайт доступен по адресу: https://$DOMAIN"
echo "🔒 API доступен по адресу: https://api.$DOMAIN"
echo "🔑 VPN-сервер доступен по адресу: https://vpn.$DOMAIN" 