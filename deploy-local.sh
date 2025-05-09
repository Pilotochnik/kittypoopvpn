#!/bin/bash

# Скрипт для локальной сборки и деплоя на сервер

# Конфигурационные переменные
SERVER_IP="134.209.91.29"
SERVER_USER="root"
SERVER_PATH="/var/www/kittypoopvpn"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Сборка проекта локально...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Ошибка при сборке. Используем альтернативную сборку...${NC}"
  # Альтернативная сборка с уменьшенным потреблением памяти
  export NODE_OPTIONS=--max_old_space_size=1024
  npm run build
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Сборка успешно завершена!${NC}"
  
  echo -e "${YELLOW}Упаковка сборки...${NC}"
  tar -czf build.tar.gz build/
  
  echo -e "${YELLOW}Загрузка на сервер...${NC}"
  scp build.tar.gz ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
  
  echo -e "${YELLOW}Распаковка на сервере...${NC}"
  ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && rm -rf build && tar -xzf build.tar.gz && rm build.tar.gz"
  
  echo -e "${GREEN}Деплой успешно завершен!${NC}"
else
  echo -e "${YELLOW}Ошибка при сборке проекта.${NC}"
  exit 1
fi 