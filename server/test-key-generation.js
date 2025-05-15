const VpnKey = require('./models/VpnKey');
const { connectDB } = require('./db');

async function testKeyGeneration() {
    try {
        // Подключаемся к БД
        await connectDB();
        
        // Тестируем генерацию ключей для разных планов
        const plans = ['trial', 'standard', 'premium'];
        
        console.log('Тестирование генерации VPN-ключей:\n');
        
        for (const plan of plans) {
            console.log(`\nТестирование плана: ${plan}`);
            console.log('='.repeat(50));
            
            const config = VpnKey._generateVpnConfig(plan);
            
            console.log('Сгенерированная конфигурация:');
            console.log(config);
            console.log('\nПараметры конфигурации:');
            
            // Парсим URL для проверки параметров
            const url = new URL(config);
            const params = new URLSearchParams(url.search);
            
            console.log({
                protocol: url.protocol,
                uuid: url.username,
                host: url.hostname,
                port: url.port,
                encryption: params.get('encryption'),
                security: params.get('security'),
                type: params.get('type'),
                path: params.get('path'),
                flow: params.get('flow'),
                alpn: params.get('alpn'),
                fp: params.get('fp'),
                sni: params.get('sni'),
                name: decodeURIComponent(url.hash.substring(1))
            });
        }
        
    } catch (error) {
        console.error('Ошибка при тестировании:', error);
    }
}

testKeyGeneration(); 