@echo off
echo ==================================================
echo     ТЕСТИРОВАНИЕ ПРОЕКТА KITTYPOOPVPN
echo ==================================================
echo.

echo [1/7] Проверка структуры проекта...
if not exist "src" (
  echo ОШИБКА: Каталог src не найден!
  goto error
) else (
  echo OK: Каталог src найден.
)

if not exist "server" (
  echo ОШИБКА: Каталог server не найден!
  goto error
) else (
  echo OK: Каталог server найден.
)

if not exist "src\context\AuthContext.js" (
  echo ОШИБКА: AuthContext.js не найден!
  goto error
) else (
  echo OK: AuthContext.js найден.
)

echo.
echo [2/7] Проверка файлов конфигурации...
if not exist "package.json" (
  echo ОШИБКА: package.json не найден!
  goto error
) else (
  echo OK: package.json найден.
)

if not exist "server\package.json" (
  echo ОШИБКА: server/package.json не найден!
  goto error
) else (
  echo OK: server/package.json найден.
)

echo.
echo [3/7] Проверка важных компонентов...
if not exist "src\components\TrialKeyGenerator.js" (
  echo ОШИБКА: TrialKeyGenerator.js не найден!
  goto error
) else (
  echo OK: TrialKeyGenerator.js найден.
)

if not exist "src\pages\MyKeysPage.js" (
  echo ОШИБКА: MyKeysPage.js не найден!
  goto error
) else (
  echo OK: MyKeysPage.js найден.
)

if not exist "src\pages\AuthSuccessPage.js" (
  echo ОШИБКА: AuthSuccessPage.js не найден!
  goto error
) else (
  echo OK: AuthSuccessPage.js найден.
)

echo.
echo [4/7] Проверка серверных файлов...
if not exist "server\index.js" (
  echo ОШИБКА: server/index.js не найден!
  goto error
) else (
  echo OK: server/index.js найден.
)

if not exist "server\db.js" (
  echo ОШИБКА: server/db.js не найден!
  goto error
) else (
  echo OK: server/db.js найден.
)

if not exist "server\models\User.js" (
  echo ОШИБКА: server/models/User.js не найден!
  goto error
) else (
  echo OK: server/models/User.js найден.
)

if not exist "server\models\VpnKey.js" (
  echo ОШИБКА: server/models/VpnKey.js не найден!
  goto error
) else (
  echo OK: server/models/VpnKey.js найден.
)

echo.
echo [5/7] Проверка скрипта запуска...
if not exist "start.bat" (
  echo ОШИБКА: start.bat не найден!
  goto error
) else (
  echo OK: start.bat найден.
)

echo.
echo [6/7] Проверка установленных пакетов...
echo Проверка пакетов клиента...
call npm list react react-dom react-router-dom styled-components framer-motion
if %errorlevel% neq 0 (
  echo ВНИМАНИЕ: Не все пакеты клиента установлены.
) else (
  echo OK: Все пакеты клиента найдены.
)

echo.
echo Проверка пакетов сервера...
cd server
call npm list express cors node-telegram-bot-api crypto
if %errorlevel% neq 0 (
  echo ВНИМАНИЕ: Не все пакеты сервера установлены.
) else (
  echo OK: Все пакеты сервера найдены.
)
cd ..

echo.
echo [7/7] Проверка порта 5000...
netstat -ano | findstr :5000
if %errorlevel% equ 0 (
  echo ВНИМАНИЕ: Порт 5000 уже занят. Возможно, сервер уже запущен или порт используется другим приложением.
) else (
  echo OK: Порт 5000 свободен.
)

echo.
echo ==================================================
echo     РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ
echo ==================================================
echo.
echo Все проверки успешно завершены!
echo Для запуска проекта выполните: start.bat
echo.
goto end

:error
echo.
echo ==================================================
echo     ОШИБКА ТЕСТИРОВАНИЯ
echo ==================================================
echo.
echo Проверка не пройдена. Исправьте указанные ошибки и повторите тестирование.
echo.

:end
pause 