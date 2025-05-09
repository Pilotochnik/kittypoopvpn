const { getDB } = require('../db');

// Хранилище для управления таймерами
let statusCheckInterval = null;

/**
 * Обновляет статус всех истекших VPN ключей
 * @returns {Promise<{changes: number}>} - количество обновленных ключей
 */
async function updateExpiredKeys() {
    const db = getDB();
    
    // Обновляем статус всех ключей, у которых истек срок действия
    const result = await db.run(`
        UPDATE vpn_keys 
        SET isActive = 0 
        WHERE expires < datetime('now') AND isActive = 1
    `);
    
    return {
        changes: result.changes || 0
    };
}

/**
 * Отчищает неиспользуемые тестовые ключи, которые истекли давно
 * (опционально для очистки базы данных)
 * @param {number} daysAgo - Количество дней, после которых удалять тестовые ключи
 * @returns {Promise<{deleted: number}>} - количество удаленных ключей
 */
async function cleanupOldTrialKeys(daysAgo = 7) {
    const db = getDB();
    
    // Удаляем тестовые ключи, которые истекли более daysAgo дней назад
    const result = await db.run(`
        DELETE FROM vpn_keys
        WHERE isTrial = 1 
        AND isActive = 0 
        AND expires < datetime('now', '-${daysAgo} days')
    `);
    
    return {
        deleted: result.changes || 0
    };
}

/**
 * Возвращает статистику по всем ключам
 * @returns {Promise<Object>} - статистика ключей
 */
async function getKeysStatistics() {
    const db = getDB();
    
    // Получаем общее количество ключей
    const totalKeys = await db.get('SELECT COUNT(*) as count FROM vpn_keys');
    
    // Активные ключи
    const activeKeys = await db.get('SELECT COUNT(*) as count FROM vpn_keys WHERE isActive = 1');
    
    // Активные ключи, которые истекли, но не обновлены
    const expiredActiveKeys = await db.get(`
        SELECT COUNT(*) as count 
        FROM vpn_keys 
        WHERE isActive = 1 AND expires < datetime('now')
    `);
    
    // Тестовые ключи
    const trialKeys = await db.get('SELECT COUNT(*) as count FROM vpn_keys WHERE isTrial = 1');
    
    // Активные тестовые ключи
    const activeTrialKeys = await db.get(`
        SELECT COUNT(*) as count 
        FROM vpn_keys 
        WHERE isTrial = 1 AND isActive = 1
    `);
    
    return {
        total: totalKeys.count || 0,
        active: activeKeys.count || 0,
        expiredActive: expiredActiveKeys.count || 0,
        trial: trialKeys.count || 0,
        activeTrial: activeTrialKeys.count || 0
    };
}

/**
 * Запускает периодическую проверку статуса ключей
 * @param {number} intervalMs - интервал проверки в миллисекундах (по умолчанию 1 час)
 * @returns {Promise<void>}
 */
async function startKeyStatusChecker(intervalMs = 60 * 60 * 1000) {
    // Сначала проверяем, не запущен ли уже таймер
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    
    // Запускаем первичную проверку сразу
    console.log('Запуск проверки статуса всех VPN ключей...');
    const initialResult = await updateExpiredKeys();
    console.log(`Обновлены статусы ${initialResult.changes} истекших VPN ключей`);
    
    // Настраиваем периодическую проверку
    statusCheckInterval = setInterval(async () => {
        try {
            const result = await updateExpiredKeys();
            console.log(`[Автоматическая проверка] Обновлены статусы ${result.changes} истекших VPN ключей`);
            
            // Каждый день очищаем старые тестовые ключи
            if (new Date().getHours() === 3) { // В 3 часа ночи
                const cleanupResult = await cleanupOldTrialKeys(7);
                if (cleanupResult.deleted > 0) {
                    console.log(`[Очистка] Удалено ${cleanupResult.deleted} старых тестовых ключей`);
                }
            }
        } catch (error) {
            console.error('[Ошибка автопроверки] Не удалось обновить статусы ключей:', error);
        }
    }, intervalMs);
    
    console.log(`Автоматическая проверка статуса VPN ключей запущена с интервалом ${intervalMs/1000} секунд`);
}

/**
 * Останавливает периодическую проверку статуса ключей
 */
function stopKeyStatusChecker() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
        console.log('Автоматическая проверка статуса VPN ключей остановлена');
    }
}

// При завершении процесса останавливаем проверку
process.on('SIGINT', () => {
    stopKeyStatusChecker();
});

module.exports = {
    updateExpiredKeys,
    cleanupOldTrialKeys,
    getKeysStatistics,
    startKeyStatusChecker,
    stopKeyStatusChecker
}; 