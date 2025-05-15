/**
 * Полифилл для работы с crypto в браузере
 * Используется библиотека crypto-browserify и другие полифиллы
 */
import { Buffer } from 'buffer';
import process from 'process';
import streamBrowserify from 'stream-browserify';

// Добавляем глобальные объекты, которые доступны в Node.js, но отсутствуют в браузере
window.Buffer = Buffer;
window.process = process;
window.Stream = streamBrowserify;

// Предотвращение ошибок с модулями Node.js
window.global = window;
window.global.Buffer = Buffer;
window.global.process = process;
window.global.Stream = streamBrowserify; 