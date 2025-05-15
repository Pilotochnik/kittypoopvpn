#!/bin/bash

# Скрипт для обновления доменного имени с kittypoopvpn.com на kittypoopvpn.ru

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Обновление доменного имени с kittypoopvpn.com на kittypoopvpn.ru...${NC}"

# Путь к серверу
SERVER_PATH="/var/www/kittypoopvpn"
SERVER_FILES=("server/index.js" "server/routes/vpn.js" "nginx.conf" ".env")

# Изменяем конфигурационные файлы
echo -e "${YELLOW}Обновление файлов конфигурации...${NC}"

# Функция обновления файла
update_file() {
    local file_path=$1
    echo -e "Обновление файла ${file_path}..."
    
    # Создаем резервную копию
    cp "${SERVER_PATH}/${file_path}" "${SERVER_PATH}/${file_path}.bak"
    
    # Заменяем домен
    sed -i 's/kittypoopvpn\.com/kittypoopvpn.ru/g' "${SERVER_PATH}/${file_path}"
    
    # Проверяем успешность операции
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Файл ${file_path} успешно обновлен${NC}"
    else
        echo -e "${RED}✗ Ошибка при обновлении файла ${file_path}${NC}"
    fi
}

# Обновляем файл .env
echo -e "${YELLOW}Обновление переменных окружения...${NC}"
if [ -f "${SERVER_PATH}/.env" ]; then
    # Если файл существует, обновляем его
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=http://kittypoopvpn.ru|g' "${SERVER_PATH}/.env"
else
    # Если файла нет, создаем его
    echo "FRONTEND_URL=http://kittypoopvpn.ru" > "${SERVER_PATH}/.env"
fi

# Обновляем серверные файлы
for file in "${SERVER_FILES[@]}"; do
    if [ -f "${SERVER_PATH}/${file}" ]; then
        update_file "$file"
    else
        echo -e "${RED}✗ Файл ${file} не найден${NC}"
    fi
done

# Обновляем SSL-сертификат
echo -e "${YELLOW}Получение нового SSL-сертификата для kittypoopvpn.ru...${NC}"
certbot --nginx -d kittypoopvpn.ru -d www.kittypoopvpn.ru -d api.kittypoopvpn.ru -d vpn.kittypoopvpn.ru --non-interactive --agree-tos --email admin@kittypoopvpn.ru

# Обновляем конфигурацию Nginx для использования нового сертификата
echo -e "${YELLOW}Обновление конфигурации Nginx...${NC}"
sed -i 's|ssl_certificate /etc/letsencrypt/live/kittypoopvpn.com/|ssl_certificate /etc/letsencrypt/live/kittypoopvpn.ru/|g' "${SERVER_PATH}/nginx.conf"
sed -i 's|ssl_certificate_key /etc/letsencrypt/live/kittypoopvpn.com/|ssl_certificate_key /etc/letsencrypt/live/kittypoopvpn.ru/|g' "${SERVER_PATH}/nginx.conf"

# Перезапускаем сервисы
echo -e "${YELLOW}Перезапуск сервисов...${NC}"
systemctl restart kittypoopvpn-server.service
systemctl restart nginx
systemctl restart v2ray

# Проверяем статус сервисов
echo -e "${YELLOW}Статус сервисов:${NC}"
systemctl status kittypoopvpn-server.service --no-pager | head -n 5
systemctl status nginx --no-pager | head -n 5
systemctl status v2ray --no-pager | head -n 5

echo -e "${GREEN}Обновление домена завершено! Новый домен: kittypoopvpn.ru${NC}"
echo -e "${YELLOW}Примечание: Распространение DNS-записей может занять до 24 часов.${NC}"
echo -e "${YELLOW}До полного распространения DNS рекомендуется также сохранить доступ по IP-адресу.${NC}" 