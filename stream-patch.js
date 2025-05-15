// Этот файл нужно запустить один раз перед `npm start` для исправления модуля hash-base
const fs = require('fs');
const path = require('path');

// Путь к проблемному файлу
const hashBasePath = path.resolve(__dirname, 'node_modules/hash-base/index.js');

// Проверяем существование файла
if (fs.existsSync(hashBasePath)) {
  console.log('Патчим файл hash-base/index.js...');
  
  // Читаем содержимое файла
  let content = fs.readFileSync(hashBasePath, 'utf8');
  
  // Заменяем импорт stream на stream-browserify
  content = content.replace(
    "var Stream = require('stream')",
    "var Stream = require('stream-browserify')"
  );
  
  // Записываем измененный файл
  fs.writeFileSync(hashBasePath, content, 'utf8');
  
  console.log('Файл успешно изменен!');
} else {
  console.error('Файл hash-base/index.js не найден!');
} 