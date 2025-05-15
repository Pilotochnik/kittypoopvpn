# Инструкции по обновлению домена на сервере

## 1. Настройте NS-серверы в панели REG.RU

В панели управления REG.RU для домена kittypoopvpn.ru:
1. Нажмите "Изменить" в разделе "DNS-серверы и управление зоной"
2. Выберите "Указать свои NS-серверы" и введите серверы DigitalOcean:
   - ns1.digitalocean.com
   - ns2.digitalocean.com
   - ns3.digitalocean.com
3. Нажмите "Сохранить"

## 2. Настройте DNS-записи в панели DigitalOcean

В панели управления DigitalOcean:
1. Перейдите в раздел Networking → Domains
2. Добавьте домен kittypoopvpn.ru, если его еще нет
3. Создайте следующие A-записи:
   - kittypoopvpn.ru → 134.209.91.29
   - www.kittypoopvpn.ru → 134.209.91.29
   - api.kittypoopvpn.ru → 134.209.91.29
   - vpn.kittypoopvpn.ru → 134.209.91.29

## 3. Загрузите скрипты обновления на сервер

```bash
# Подключитесь к серверу по SSH
ssh root@134.209.91.29

# Создайте директорию для скриптов, если её нет
mkdir -p /root/scripts

# Выйдите из сервера
exit
```

Теперь загрузите скрипт обновления:

```bash
# Загрузите скрипт на сервер
scp update-domain.sh root@134.209.91.29:/root/scripts/

# Подключитесь снова к серверу
ssh root@134.209.91.29

# Сделайте скрипт исполняемым
chmod +x /root/scripts/update-domain.sh
```

## 4. Запустите скрипт обновления

```bash
# Перейдите в директорию со скриптами
cd /root/scripts

# Запустите скрипт обновления
./update-domain.sh
```

## 5. Проверьте результаты

После выполнения скрипта проверьте:
1. Работоспособность сервисов через команды:
   ```bash
   systemctl status kittypoopvpn-server.service
   systemctl status nginx
   systemctl status v2ray
   ```

2. Открываемость сайта по IP и по домену (после распространения DNS):
   - http://134.209.91.29
   - http://kittypoopvpn.ru (когда DNS распространится)

## 6. Устранение проблем

Если возникнут проблемы:

1. Проверьте логи сервисов:
   ```bash
   journalctl -u kittypoopvpn-server.service -n 100
   journalctl -u nginx -n 100
   ```

2. Проверьте конфигурацию Nginx:
   ```bash
   nginx -t
   ```

3. При необходимости восстановите файлы из резервных копий (*.bak), которые создаются скриптом:
   ```bash
   cp /var/www/kittypoopvpn/nginx.conf.bak /var/www/kittypoopvpn/nginx.conf
   ```

## 7. Вернуть изменения (в случае проблем)

```bash
# Восстановить из резервных копий
for file in server/index.js server/routes/vpn.js nginx.conf .env; do
  if [ -f "/var/www/kittypoopvpn/${file}.bak" ]; then
    cp "/var/www/kittypoopvpn/${file}.bak" "/var/www/kittypoopvpn/${file}"
  fi
done

# Перезапустить сервисы
systemctl restart kittypoopvpn-server.service nginx v2ray
``` 