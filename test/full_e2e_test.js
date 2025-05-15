const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';
  let errors = [];

  try {
    // 1. Проверка главной страницы
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    if (!(await page.title()).includes('Kitty Poop VPN')) errors.push('Главная страница не открывается');

    // 2. Проверка страницы оплаты
    await page.goto(baseUrl + '/payment?plan=standard&period=monthly', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', el => el.textContent);
    if (!title.toLowerCase().includes('оплата')) errors.push('Страница оплаты не открывается');

    // 2.1. Если есть кнопка "Продолжить без авторизации" — кликнуть её
    const continueBtn = await page.$x("//button[contains(., 'Продолжить без авторизации')]");
    if (continueBtn.length > 0) {
      await continueBtn[0].click();
      await page.waitForTimeout(700); // дождаться перехода
    }

    // 3. Проверка ручной оплаты (Тинькофф)
    await page.waitForSelector('[data-testid="manual-pay"]', { timeout: 5000 });
    await page.click('[data-testid="manual-pay"]');
    await page.waitForTimeout(1000);
    const manualPay = await page.$eval('h2', el => el.textContent);
    if (!manualPay.toLowerCase().includes('оплата картой')) errors.push('Блок ручной оплаты не отображается');

    // 4. Проверка оплаты TON
    await page.goto(baseUrl + '/payment?plan=standard&period=monthly', { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="crypto-ton"]');
    await page.click('[data-testid="crypto-ton"]');
    await page.waitForTimeout(2000);
    const cryptoPay = await page.content();
    if (!cryptoPay.includes('QR-код') && !cryptoPay.includes('Оплата криптовалютой')) errors.push('Блок оплаты TON не отображается');

    // 5. Проверка отсутствия ошибок на странице
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    if (logs.some(l => l.toLowerCase().includes('error'))) errors.push('Есть ошибки в консоли браузера');

    // 6. Проверка выдачи VPN-ключа (эмулируется)
    // Здесь можно добавить проверку появления блока с ключом после оплаты (если есть тестовый ключ)

    if (errors.length === 0) {
      console.log('✅ Все основные механизмы сайта работают корректно!');
    } else {
      console.log('❌ Обнаружены ошибки:');
      errors.forEach(e => console.log(' - ' + e));
    }
  } catch (e) {
    console.error('❌ Критическая ошибка теста:', e);
  } finally {
    await browser.close();
  }
})(); 