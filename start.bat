@echo off
echo Запуск KittyPoopVPN...

echo Запуск сервера на порту 5000...
start cmd /k "cd server & npm start"

timeout /t 5 /nobreak > nul

echo Запуск клиента на порту 3000...
start cmd /k "npm start"

echo.
echo Проект запущен!
echo Сервер: http://localhost:5000
echo Клиент: http://localhost:3000 