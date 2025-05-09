#!/bin/bash

# Скрипт для добавления нового клиента VLESS в конфигурацию V2ray
# Использование: ./add-vless-client.sh <имя_клиента> <срок_действия_в_днях>

set -e

# Проверка аргументов
if [ $# -lt 1 ]; then
    echo "Использование: $0 <имя_клиента> <срок_действия_в_днях>"
    echo "Пример: $0 client_1 30"
    exit 1
fi

# Имя клиента
CLIENT_NAME=$1

# Срок действия (по умолчанию 30 дней)
DAYS=${2:-30}

# Генерация UUID
UUID=$(uuidgen)

# Путь к конфигурации V2ray
CONFIG_PATH="/usr/local/etc/v2ray/config.json"

# Проверка наличия файла конфигурации
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Ошибка: Файл конфигурации V2ray не найден: $CONFIG_PATH"
    exit 1
fi

# Получение списка существующих клиентов
CLIENTS=$(jq -r '.inbounds[0].settings.clients' $CONFIG_PATH)

# Домен сервера
DOMAIN="vpn.kittypoopvpn.com"

# Дата истечения срока действия
EXPIRY_DATE=$(date -d "+$DAYS days" +"%Y-%m-%d")

# Создание нового клиента
NEW_CLIENT=$(cat <<EOF
{
  "id": "$UUID",
  "email": "$CLIENT_NAME",
  "flow": "",
  "level": 0
}
EOF
)

# Добавление клиента в конфигурацию
if [ "$CLIENTS" == "[]" ]; then
    # Если нет клиентов, создаем новый массив
    jq --argjson client "$NEW_CLIENT" '.inbounds[0].settings.clients = [$client]' $CONFIG_PATH > $CONFIG_PATH.tmp
else
    # Добавляем к существующим клиентам
    jq --argjson client "$NEW_CLIENT" '.inbounds[0].settings.clients += [$client]' $CONFIG_PATH > $CONFIG_PATH.tmp
fi

# Применение изменений
mv $CONFIG_PATH.tmp $CONFIG_PATH
chmod 644 $CONFIG_PATH

# Перезапуск V2ray
systemctl restart v2ray

# Генерация ссылки для подключения
VLESS_LINK="vless://$UUID@$DOMAIN:443?security=tls&encryption=none&headerType=none&type=tcp&sni=$DOMAIN#KittyPoopVPN_$CLIENT_NAME"

# Вывод информации
echo "✅ Клиент VLESS успешно добавлен!"
echo "---------------------------------------------"
echo "Имя: $CLIENT_NAME"
echo "UUID: $UUID"
echo "Срок действия: $EXPIRY_DATE"
echo "Домен: $DOMAIN"
echo "Порт: 443"
echo "Протокол: VLESS"
echo "---------------------------------------------"
echo "Ссылка для подключения:"
echo "$VLESS_LINK"
echo "---------------------------------------------"
echo "QR-код можно сгенерировать по ссылке:"
echo "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=$(urlencode "$VLESS_LINK")"
echo "---------------------------------------------"

# Функция для URL-кодирования строки
urlencode() {
    local length="${#1}"
    for (( i = 0; i < length; i++ )); do
        local c="${1:i:1}"
        case $c in
            [a-zA-Z0-9.~_-]) printf "$c" ;;
            *) printf '%%%02X' "'$c" ;;
        esac
    done
}

# Сохранение информации о клиенте
mkdir -p /var/www/kittypoopvpn/clients
cat > "/var/www/kittypoopvpn/clients/$CLIENT_NAME.json" <<EOF
{
  "name": "$CLIENT_NAME",
  "uuid": "$UUID",
  "expires": "$EXPIRY_DATE",
  "created": "$(date +"%Y-%m-%d")",
  "link": "$VLESS_LINK"
}
EOF 