const { connectDB, getDB } = require('./db');
const keyManager = require('./utils/keyManager');

async function forceCheckAllKeys() {
    try {
        console.log('Запуск принудительной проверки статуса всех VPN ключей...');
        
        // Подключение к БД
        const connected = await connectDB();
        if (!connected) {
            console.error('Не удалось подключиться к базе данных. Выход...');
            process.exit(1);
        }
        
        // Получаем статистику до обновления
        const beforeStats = await keyManager.getKeysStatistics();
        console.log('Статистика до обновления:');
        console.log(beforeStats);
        
        // Принудительно обновляем статусы всех ключей
        const updateResult = await keyManager.updateExpiredKeys();
        console.log(`Обновлены статусы ${updateResult.changes} истекших VPN ключей`);
        
        // Получаем статистику после обновления
        const afterStats = await keyManager.getKeysStatistics();
        console.log('Статистика после обновления:');
        console.log(afterStats);
        
        // Проверяем, остались ли проблемные ключи
        if (afterStats.expiredActive > 0) {
            console.log('\n⚠️ ВНИМАНИЕ: Все еще есть активные ключи с истекшим сроком действия');
            
            // Получаем список этих ключей
            const db = getDB();
            const problematicKeys = await db.all(`
                SELECT id, uuid, userId, plan, created, expires, isActive, isTrial
                FROM vpn_keys
                WHERE isActive = 1 AND expires < datetime('now')
            `);
            
            console.log('Проблемные ключи:');
            problematicKeys.forEach(key => {
                console.log(`ID: ${key.id}, UUID: ${key.uuid}, Истек: ${key.expires}`);
            });
            
            // Предлагаем принудительное исправление
            console.log('\nПытаемся принудительно деактивировать эти ключи...');
            
            for (const key of problematicKeys) {
                const result = await db.run(`
                    UPDATE vpn_keys
                    SET isActive = 0
                    WHERE id = ?
                `, [key.id]);
                
                console.log(`Ключ ID ${key.id}: ${result.changes > 0 ? 'Деактивирован' : 'Не удалось деактивировать'}`);
            }
        } else {
            console.log('\n✅ Все ключи в порядке, нет активных ключей с истекшим сроком действия');
        }
        
        console.log('\nПроверка завершена.');
        process.exit(0);
        
    } catch (error) {
        console.error('Ошибка при проверке статуса ключей:', error);
        process.exit(1);
    }
}

forceCheckAllKeys(); 