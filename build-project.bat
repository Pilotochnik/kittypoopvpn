@echo off
echo ==================================================
echo     СБОРКА ПРОЕКТА KITTYPOOPVPN
echo ==================================================
echo.

echo [1/4] Проверка проекта перед сборкой...
call test-project.bat

echo.
echo [2/4] Очистка старых сборок...
if exist "build" (
  echo Удаление папки build...
  rmdir /s /q build
)

echo.
echo [3/4] Сборка клиентской части...
call npm run build
if %errorlevel% neq 0 (
  echo ОШИБКА: Не удалось собрать клиентскую часть проекта!
  goto error
) else (
  echo OK: Клиентская часть успешно собрана.
)

echo.
echo [4/4] Подготовка серверной части...
if not exist "server\dist" mkdir server\dist
copy server\*.js server\dist\
copy server\models\*.js server\dist\models\
copy server\utils\*.js server\dist\utils\

echo.
echo ==================================================
echo     РЕЗУЛЬТАТЫ СБОРКИ
echo ==================================================
echo.
echo Проект успешно собран!
echo.
echo Файлы для публикации:
echo - build/          (статические файлы клиента)
echo - server/dist/    (файлы сервера)
echo.
echo После публикации не забудьте настроить:
echo 1. URL клиента в .env файле сервера
echo 2. Токен Telegram-бота в .env файле сервера
echo.
goto end

:error
echo.
echo ==================================================
echo     ОШИБКА СБОРКИ
echo ==================================================
echo.
echo Сборка проекта не удалась. Исправьте указанные ошибки и повторите сборку.
echo.

:end
pause 