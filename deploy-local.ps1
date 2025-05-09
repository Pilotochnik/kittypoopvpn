# PowerShell скрипт для локальной сборки и деплоя на сервер

# Конфигурационные переменные
$SERVER_IP = "134.209.91.29"
$SERVER_USER = "root"
$SERVER_PATH = "/var/www/kittypoopvpn"
$SSH_KEY_PATH = $null  # Укажите путь к вашему SSH ключу, если используете ключи

# Функция для вывода цветного текста
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Yellow "Сборка проекта локально..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Yellow "Ошибка при сборке. Используем альтернативную сборку..."
    # Альтернативная сборка с уменьшенным потреблением памяти
    $env:NODE_OPTIONS = "--max_old_space_size=1024"
    npm run build
}

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "Сборка успешно завершена!"
    
    Write-ColorOutput Yellow "Упаковка сборки..."
    Compress-Archive -Path build/* -DestinationPath build.zip -Force
    
    Write-ColorOutput Yellow "Загрузка на сервер..."
    
    # Используем scp для загрузки файла на сервер
    if ($SSH_KEY_PATH) {
        scp -i $SSH_KEY_PATH build.zip ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
    } else {
        scp build.zip ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
    }
    
    Write-ColorOutput Yellow "Распаковка на сервере..."
    # Используем ssh для выполнения команд на сервере
    if ($SSH_KEY_PATH) {
        ssh -i $SSH_KEY_PATH ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && rm -rf build && unzip -o build.zip -d . && rm build.zip"
    } else {
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && rm -rf build && unzip -o build.zip -d . && rm build.zip"
    }
    
    Write-ColorOutput Green "Деплой успешно завершен!"
    
    # Удаляем временный zip-файл
    Remove-Item build.zip
} else {
    Write-ColorOutput Red "Ошибка при сборке проекта."
    exit 1
} 