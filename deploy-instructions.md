# Инструкция по развертыванию KittyPoopVPN на сервере с доменом

Это подробное руководство по развертыванию KittyPoopVPN на VPS-сервере с использованием домена.

## Шаг 1: Аренда VPS

1. Рекомендуемые характеристики:
   - Минимум 1 GB RAM
   - 1 vCPU
   - 25 GB SSD
   - Ubuntu 20.04 LTS

   Подходящие провайдеры: DigitalOcean, Vultr, Linode, Hetzner, Contabo

2. После аренды VPS, запишите:
   - IP-адрес сервера
   - Данные для SSH-подключения (логин, пароль или SSH-ключ)

## Шаг 2: Настройка домена

1. Приобретите домен у любого регистратора доменов (Namecheap, GoDaddy, REG.RU и т.д.)

2. Добавьте следующие A-записи в DNS, указывающие на IP-адрес вашего VPS:
   ```
   kittypoopvpn.com        A       <IP-адрес вашего VPS>
   www.kittypoopvpn.com    A       <IP-адрес вашего VPS>
   api.kittypoopvpn.com    A       <IP-адрес вашего VPS>
   vpn.kittypoopvpn.com    A       <IP-адрес вашего VPS>
   ```

3. Подождите некоторое время для распространения DNS-записей (обычно от 15 минут до 24 часов)

## Шаг 3: Подключение к серверу

1. Подключитесь к вашему серверу через SSH:
   ```bash
   ssh root@<IP-адрес вашего VPS>
   ```

2. Обновите систему:
   ```bash
   apt update && apt upgrade -y
   ```

3. Установите Git:
   ```bash
   apt install -y git
   ```

## Шаг 4: Клонирование и подготовка репозитория

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/yourusername/kittypoopvpn.git /var/www/kittypoopvpn
   cd /var/www/kittypoopvpn
   ```

2. Отредактируйте файл deploy-config.js, заменив домены на свои:
   ```bash
   nano deploy-config.js
   ```
   Измените домен `kittypoopvpn.com` на ваш домен.

3. Также замените домен в файле nginx.conf:
   ```bash
   nano nginx.conf
   ```
   Замените все упоминания `kittypoopvpn.com` на ваш домен.

## Шаг 5: Запуск скрипта развертывания

1. Сделайте скрипты исполняемыми:
   ```bash
   chmod +x deploy.sh
   chmod +x add-vless-client.sh
   ```

2. Запустите скрипт развертывания:
   ```bash
   ./deploy.sh
   ```

3. Следите за выводом скрипта и решайте проблемы, если они возникнут.

## Шаг 6: Проверка работы

1. Проверьте статус сервисов:
   ```bash
   systemctl status kittypoopvpn-server
   systemctl status v2ray
   systemctl status nginx
   ```

2. Проверьте доступность сайта, открыв в браузере ваш домен.

3. Проверьте работу API:
   ```bash
   curl -v https://api.yourdomain.com/api/db-test
   ```

## Шаг 7: Добавление клиентов V2ray

1. Запустите скрипт добавления клиентов:
   ```bash
   ./add-vless-client.sh client1 30
   ```
   где:
   - `client1` - имя клиента
   - `30` - срок действия в днях

2. Скрипт выведет информацию о созданном клиенте, включая:
   - UUID клиента
   - Ссылку для импорта в клиентское приложение
   - QR-код для быстрой настройки

## Шаг 8: Настройка Telegram-бота

1. Создайте нового бота через [@BotFather](https://t.me/BotFather) в Telegram:
   - Отправьте `/newbot`
   - Следуйте инструкциям для создания бота
   - Получите токен бота

2. Отредактируйте файл .env в директории сервера:
   ```bash
   nano /var/www/kittypoopvpn/server/.env
   ```

3. Замените значения:
   ```
   TELEGRAM_BOT_TOKEN=ваш_токен_бота
   TELEGRAM_BOT_USERNAME=имя_вашего_бота_без_@
   ```

4. Перезапустите сервер:
   ```bash
   systemctl restart kittypoopvpn-server
   ```

## Шаг 9: Настройка бекапов (рекомендуется)

1. Установите инструмент для бекапов:
   ```bash
   apt install -y restic
   ```

2. Настройте автоматические бекапы важных файлов:
   ```bash
   mkdir -p /var/backups/kittypoopvpn
   ```

3. Создайте скрипт бекапа:
   ```bash
   nano /root/backup-vpn.sh
   ```

4. Добавьте содержимое:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/var/backups/kittypoopvpn"
   DATE=$(date +%Y-%m-%d)
   mkdir -p $BACKUP_DIR/$DATE

   # Бекап конфигураций
   cp /usr/local/etc/v2ray/config.json $BACKUP_DIR/$DATE/
   cp /etc/nginx/sites-available/yourdomain.com $BACKUP_DIR/$DATE/
   cp -r /var/www/kittypoopvpn/server/.env $BACKUP_DIR/$DATE/
   cp -r /var/www/kittypoopvpn/clients $BACKUP_DIR/$DATE/

   # Бекап SSL-сертификатов
   cp -r /etc/letsencrypt/live $BACKUP_DIR/$DATE/
   
   # Сжатие
   cd $BACKUP_DIR
   tar -czf vpn-backup-$DATE.tar.gz $DATE
   rm -rf $DATE
   
   # Удаление старых бекапов (старше 30 дней)
   find $BACKUP_DIR -name "vpn-backup-*.tar.gz" -mtime +30 -delete
   ```

5. Сделайте скрипт исполняемым:
   ```bash
   chmod +x /root/backup-vpn.sh
   ```

6. Добавьте задачу в cron для ежедневного выполнения:
   ```bash
   crontab -e
   ```
   
   Добавьте строку:
   ```
   0 2 * * * /root/backup-vpn.sh
   ```

## Дополнительная информация

### Мониторинг логов

```bash
# Логи сервера Node.js
journalctl -u kittypoopvpn-server -f

# Логи V2ray
journalctl -u v2ray -f

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Обновление системы

Регулярно обновляйте систему:

```bash
apt update && apt upgrade -y
```

### Обновление KittyPoopVPN

1. Перейдите в директорию проекта:
   ```bash
   cd /var/www/kittypoopvpn
   ```

2. Получите последние изменения:
   ```bash
   git pull
   ```

3. Перезапустите службы:
   ```bash
   systemctl restart kittypoopvpn-server
   systemctl restart v2ray
   systemctl restart nginx
   ```

### Поддержка

При возникновении проблем обращайтесь в нашу техническую поддержку по адресу: support@kittypoopvpn.com 