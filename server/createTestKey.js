const { connectDB, getDB } = require('./db');
const crypto = require('crypto');
const VpnKey = require('./models/VpnKey');

// Создание тестового ключа с коротким сроком действия
async function createTestExpiredKey() {
    try {
        // Подключение к БД
        const connected = await connectDB();
        if (!connected) {
            console.error('Не удалось подключиться к базе данных. Выход...');
            process.exit(1);
        }
        
        const db = getDB();
        
        // Проверяем, есть ли хотя бы один пользователь
        let user = await db.get('SELECT * FROM users LIMIT 1');
        
        if (!user) {
            console.error('Нет ни одного пользователя в базе данных');
            
            // Создаем тестового пользователя, если пользователей нет
            console.log('Создаем тестового пользователя...');
            const newUser = await db.run(`
                INSERT INTO users (telegramId, firstName, lastName, username, authDate, createdAt, lastLogin)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
            `, [123456789, 'Test', 'User', 'testuser']);
            
            if (newUser.lastID) {
                console.log(`Создан тестовый пользователь с ID: ${newUser.lastID}`);
                user = await db.get('SELECT * FROM users WHERE id = ?', newUser.lastID);
            } else {
                console.error('Не удалось создать тестового пользователя');
                process.exit(1);
            }
        }
        
        // Генерируем UUID для ключа
        const uuid = `test_${crypto.randomBytes(8).toString('hex')}`;
        
        // Устанавливаем срок действия ключа - 5 секунд от текущего времени
        const now = new Date();
        const expiry = new Date(now.getTime() + 5 * 1000); // 5 секунд
        
        // Генерируем базовую конфигурацию VPN
        const vpnConfig = `client\ndev tun\nproto udp\nremote test-server.com 1194\n`;
        
        // Создаем запись о тестовом ключе в базе данных
        console.log(`Создаем тестовый ключ с истечением через 5 секунд...`);
        
        // Используем модель VpnKey для создания
        const vpnKeyData = {
            uuid,
            userId: user.id,
            plan: 'test',
            period: 0,
            created: now.toISOString(),
            expires: expiry.toISOString(),
            isActive: 1,
            isTrial: 1,
            config: vpnConfig
        };
        
        const vpnKey = await VpnKey.create(vpnKeyData);
        
        if (vpnKey) {
            console.log(`Ключ успешно создан с ID: ${vpnKey.id}`);
            console.log(`UUID ключа: ${vpnKey.uuid}`);
            console.log(`Срок действия: ${vpnKey.expires}`);
            console.log(`Ключ истечет через 5 секунд`);
            
            // Ждем 10 секунд и проверяем статус
            console.log('\nОжидаем 10 секунд...');
            
            setTimeout(async () => {
                try {
                    // Проверяем ключ используя модель VpnKey
                    const key = await VpnKey.findByUuid(uuid);
                    
                    console.log('Статус ключа после ожидания:');
                    console.log(`ID: ${key?.id}`);
                    console.log(`UUID: ${key?.uuid}`);
                    console.log(`Активен: ${key?.isActive === 1 ? 'Да' : 'Нет'}`);
                    console.log(`Истек: ${new Date(key?.expires) < new Date() ? 'Да' : 'Нет'}`);
                    
                    if (key?.isActive === 1 && new Date(key.expires) < new Date()) {
                        console.log('\n⚠️ ОШИБКА: Ключ все еще активен, хотя должен быть деактивирован!');
                        console.log('Возможная проблема: функция checkAndUpdateStatus не работает корректно');
                    } else if (key?.isActive === 0) {
                        console.log('\n✅ Тест успешен: Ключ корректно деактивирован');
                    }
                    
                    // Удаляем тестовый ключ
                    if (key) {
                        await VpnKey.delete(uuid);
                        console.log('Тестовый ключ удален из базы данных');
                    }
                } catch (error) {
                    console.error('Ошибка при проверке статуса:', error);
                } finally {
                    process.exit(0);
                }
            }, 10000);
            
        } else {
            console.error('Не удалось создать тестовый ключ');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Ошибка при создании тестового ключа:', error);
        process.exit(1);
    }
}

createTestExpiredKey(); 