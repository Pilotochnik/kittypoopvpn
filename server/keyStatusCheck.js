const { connectDB, getDB } = require('./db');

// Функция для вывода форматированных данных ключа
function printKeyInfo(key) {
    const created = new Date(key.created).toLocaleString();
    const expires = new Date(key.expires).toLocaleString();
    const isExpired = new Date(key.expires) < new Date();
    const status = key.isActive ? 'Активен' : 'Неактивен';
    const expiredStatus = isExpired ? 'Истек' : 'Действителен';
    
    console.log(`
    UUID: ${key.uuid}
    Пользователь ID: ${key.userId}
    План: ${key.plan}
    Создан: ${created}
    Истекает: ${expires}
    Статус: ${status}
    Фактически: ${expiredStatus}
    Тестовый: ${key.isTrial ? 'Да' : 'Нет'}
    ----------------------------
    `);
}

// Функция для ручного обновления статуса ключей
async function updateExpiredKeys() {
    const db = getDB();
    
    console.log('Проверка истекших ключей...');
    
    // Получаем список всех ключей
    const allKeys = await db.all('SELECT * FROM vpn_keys ORDER BY expires DESC');
    console.log(`Всего ключей в базе: ${allKeys.length}`);
    
    // Находим активные ключи, срок действия которых истек
    const now = new Date().toISOString();
    const expiredActiveKeys = allKeys.filter(
        key => key.isActive === 1 && key.expires < now
    );
    
    console.log(`Найдено ${expiredActiveKeys.length} активных ключей с истекшим сроком`);
    
    if (expiredActiveKeys.length > 0) {
        // Выводим информацию о каждом истекшем ключе
        console.log('\nИстекшие активные ключи:');
        expiredActiveKeys.forEach(printKeyInfo);
        
        // Обновляем статус истекших ключей
        const result = await db.run(`
            UPDATE vpn_keys 
            SET isActive = 0 
            WHERE expires < datetime('now') AND isActive = 1
        `);
        
        console.log(`Обновлены статусы ${result.changes} истекших VPN ключей`);
    }
    
    // Получаем список ключей, срок действия которых истечет в ближайшие 24 часа
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const tomorrowISO = tomorrow.toISOString();
    
    const expiringKeys = allKeys.filter(
        key => key.isActive === 1 && key.expires > now && key.expires < tomorrowISO
    );
    
    if (expiringKeys.length > 0) {
        console.log(`\nКлючи, истекающие в ближайшие 24 часа: ${expiringKeys.length}`);
        expiringKeys.forEach(printKeyInfo);
    } else {
        console.log('\nНет ключей, истекающих в ближайшие 24 часа');
    }
    
    // Отчет об общем распределении ключей
    const activeKeysCount = allKeys.filter(key => key.isActive === 1).length;
    const inactiveKeysCount = allKeys.filter(key => key.isActive === 0).length;
    const trialKeysCount = allKeys.filter(key => key.isTrial === 1).length;
    
    console.log('\nСтатистика ключей:');
    console.log(`Всего ключей: ${allKeys.length}`);
    console.log(`Активных ключей: ${activeKeysCount}`);
    console.log(`Неактивных ключей: ${inactiveKeysCount}`);
    console.log(`Тестовых ключей: ${trialKeysCount}`);
}

// Исполняем тестовый скрипт
async function run() {
    try {
        // Подключение к БД
        const connected = await connectDB();
        if (!connected) {
            console.error('Не удалось подключиться к базе данных. Выход...');
            process.exit(1);
        }
        
        // Проверяем и обновляем статусы ключей
        await updateExpiredKeys();
        
        console.log('\nПроверка завершена.');
    } catch (error) {
        console.error('Ошибка при выполнении проверки:', error);
    } finally {
        // Закрываем соединение с БД
        const db = getDB();
        if (db) {
            await db.close();
            console.log('Соединение с БД закрыто');
        }
        process.exit(0);
    }
}

run(); 