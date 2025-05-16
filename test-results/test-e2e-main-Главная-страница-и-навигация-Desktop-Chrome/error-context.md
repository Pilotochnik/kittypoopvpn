# Test info

- Name: Главная страница и навигация
- Location: C:\Users\10\progi boba\vvppnn\test\e2e-main.spec.js:3:1

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: getByRole('link', { name: 'Тарифы' }) resolved to 2 elements:
    1) <a href="/pricing" class="sc-dQEtJz hfHhzK">Тарифы</a> aka getByRole('banner').getByRole('link', { name: 'Тарифы' })
    2) <a class="" href="/pricing">Тарифы</a> aka getByRole('list').getByRole('link', { name: 'Тарифы' })

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('link', { name: 'Тарифы' })

    at C:\Users\10\progi boba\vvppnn\test\e2e-main.spec.js:6:60
```

# Page snapshot

```yaml
- text: 💩 💩 💩 💩 💩 🐱 🐱
- banner:
  - link "Kitty Poop VPN":
    - /url: /
  - navigation:
    - link "Главная":
      - /url: /
    - link "Тарифы":
      - /url: /pricing
    - link "О нас":
      - /url: /about
    - link "FAQ по настройке":
      - /url: /faq
    - link "Авторизоваться через Telegram":
      - /url: /login
- button "×"
- heading "Меню" [level=3]
- navigation:
  - list:
    - listitem:
      - link "Главная":
        - /url: /
    - listitem:
      - link "Тарифы":
        - /url: /pricing
    - listitem:
      - link "О нас":
        - /url: /about
    - listitem:
      - link "Войти":
        - /url: /login
    - listitem:
      - link "Регистрация":
        - /url: /register
- main:
  - text: 🔒 🌐 🐱
  - heading "Kitty Poop VPN" [level=1]
  - paragraph: Безопасный и быстрый VPN-сервис для анонимного серфинга в интернете
  - link "Купить VPN":
    - /url: /pricing
  - link "Узнать больше":
    - /url: /faq
  - heading "Попробуйте бесплатно на 1 час" [level=2]
  - heading "Пробный ключ на 1 час" [level=2]
  - paragraph: Хотите попробовать наш VPN перед покупкой? Получите бесплатный ключ на 1 час!
  - paragraph: ⚠️ Ключ будет активен только в течение 1 часа с момента генерации. Один пробный ключ на пользователя (повторная выдача возможна через 24 часа).
  - button "Получить пробный ключ"
  - text: TRIAL
  - heading "Почему выбирают нас" [level=2]
  - text: 🔒
  - heading "Высокий уровень безопасности" [level=3]
  - paragraph: Мы используем современные протоколы шифрования для обеспечения полной анонимности ваших данных.
  - text: ⚡
  - heading "Высокая скорость соединения" [level=3]
  - paragraph: Наши серверы расположены по всему миру, что позволяет обеспечить максимальную скорость для любого местоположения.
  - text: 🌐
  - heading "Доступ к любым сайтам" [level=3]
  - paragraph: Обходите географические ограничения и получайте доступ к заблокированным сайтам и сервисам.
  - text: 🤝
  - heading "Удобство использования" [level=3]
  - paragraph: Простой процесс установки и настройки, интуитивно понятный интерфейс для пользователей любого уровня.
  - text: 💸
  - heading "Гибкая система оплаты" [level=3]
  - paragraph: Различные варианты оплаты, включая криптовалюты для сохранения вашей анонимности.
  - text: 🐱
  - heading "Уникальный стиль" [level=3]
  - paragraph: Яркий молодежный дизайн сервиса делает использование VPN не только безопасным, но и приятным.
  - heading "Наша VPN-сеть" [level=2]
  - text: Северная Америка Восточная Азия Австралия Европа Южная Америка Центральная Азия Восточная Европа Западная Европа
  - img
  - text: Глобальная сеть серверов Kitty Poop VPN Наша сеть VPN серверов расположена в более чем 20 странах мира, что обеспечивает стабильное соединение с высокой скоростью передачи данных. Все серверы оснащены современными технологиями шифрования для обеспечения максимальной безопасности ваших данных.
- region "Notifications Alt+T"
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test('Главная страница и навигация', async ({ page }) => {
   4 |   await page.goto('/');
   5 |   await expect(page.getByRole('heading', { name: 'Kitty Poop VPN' })).toBeVisible();
>  6 |   await expect(page.getByRole('link', { name: 'Тарифы' })).toBeVisible();
     |                                                            ^ Error: expect.toBeVisible: Error: strict mode violation: getByRole('link', { name: 'Тарифы' }) resolved to 2 elements:
   7 |   await expect(page.getByRole('link', { name: 'Профиль' })).toBeVisible();
   8 |
   9 |   // Переход на FAQ
  10 |   await page.getByRole('link', { name: 'FAQ по настройке' }).click();
  11 |   await expect(page.getByRole('heading', { name: 'Часто задаваемые вопросы' })).toBeVisible();
  12 |
  13 |   // Переход на About
  14 |   await page.getByRole('link', { name: 'О нас' }).click();
  15 |   await expect(page.getByRole('heading', { name: 'О проекте' })).toBeVisible();
  16 | }); 
```