#!/bin/bash

# Скрипт для обновления серверной части из Git-репозитория

# Конфигурационные переменные
REPO_URL="https://github.com/Pilotochnik/kittypoopvpn.git"
SERVER_PATH="/var/www/kittypoopvpn"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Обновление из Git...${NC}"

# Проверяем, инициализирован ли Git
if [ ! -d "${SERVER_PATH}/.git" ]; then
  echo -e "${YELLOW}Git не инициализирован. Инициализируем...${NC}"
  cd ${SERVER_PATH}
  git init
  git remote add origin ${REPO_URL}
  git fetch
  # Сохраняем локальные изменения
  git stash
  git checkout master
else
  echo -e "${YELLOW}Git репозиторий существует. Обновляем...${NC}"
  cd ${SERVER_PATH}
  # Сохраняем локальные изменения
  git stash
  git pull origin master
fi

# Устанавливаем зависимости и перезапускаем сервисы
echo -e "${YELLOW}Обновление зависимостей...${NC}"
cd ${SERVER_PATH}
npm install
cd ${SERVER_PATH}/server
npm install

echo -e "${YELLOW}Перезапуск сервисов...${NC}"
systemctl restart kittypoopvpn-server.service
systemctl restart nginx

echo -e "${GREEN}Обновление успешно завершено!${NC}"

# Выводим статус служб
echo -e "${YELLOW}Статус служб:${NC}"
systemctl status kittypoopvpn-server.service --no-pager
systemctl status nginx --no-pager
systemctl status v2ray --no-pager 