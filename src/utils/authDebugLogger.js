// Утилита для локального логирования процесса авторизации через Telegram
// Логи хранятся в localStorage по ключу 'auth_debug_log'

export function logAuthDebug(message, data = null) {
  const logs = JSON.parse(localStorage.getItem('auth_debug_log') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    message,
    data
  });
  localStorage.setItem('auth_debug_log', JSON.stringify(logs));
}

export function getAuthDebugLogs() {
  return JSON.parse(localStorage.getItem('auth_debug_log') || '[]');
}

export function clearAuthDebugLogs() {
  localStorage.removeItem('auth_debug_log');
} 