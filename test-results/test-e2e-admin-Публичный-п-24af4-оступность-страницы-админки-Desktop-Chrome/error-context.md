# Test info

- Name: Публичный пользователь: доступность страницы админки
- Location: C:\Users\10\progi boba\vvppnn\test\e2e-admin.spec.js:3:1

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('text=Telegram').or(locator('text=Доступ запрещён')).or(locator('text=Авторизация')) resolved to 3 elements:
    1) <a href="/login" class="sc-imwsjW jLWGCH">Авторизоваться через Telegram</a> aka getByRole('link', { name: 'Авторизоваться через Telegram' })
    2) <b>Авторизация через Telegram полностью безопасна!</b> aka getByText('Авторизация через Telegram')
    3) <button tabindex="0" class="sc-tagGq flPRGi">…</button> aka getByRole('button', { name: '✈️ Войти через Telegram' })

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Telegram').or(locator('text=Доступ запрещён')).or(locator('text=Авторизация'))

    at C:\Users\10\progi boba\vvppnn\test\e2e-admin.spec.js:8:5
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
  - text: 😺 💩 🔒 🐾 😻 💩
  - heading "KittyPoopVPN" [level=1]
  - paragraph: Безопасный доступ в интернет с заботой о вас
  - text: 🔒 Авторизация через Telegram полностью безопасна! Вам не нужно повторно входить в аккаунт — просто напишите нашему боту 😺 и следуйте инструкции. Ваши данные защищены, мы не получаем доступ к переписке
  - img "замок": 🔐
  - button "✈️ Войти через Telegram"
- region "Notifications Alt+T"
```

# Test source

```ts
  1 | const { test, expect } = require('@playwright/test');
  2 |
  3 | test('Публичный пользователь: доступность страницы админки', async ({ page }) => {
  4 |   await page.goto('/admin/keys');
  5 |   // Проверяем, что либо видим форму Telegram-авторизации, либо сообщение о недоступности
  6 |   await expect(
  7 |     page.locator('text=Telegram').or(page.locator('text=Доступ запрещён')).or(page.locator('text=Авторизация'))
> 8 |   ).toBeVisible();
    |     ^ Error: expect.toBeVisible: Error: strict mode violation: locator('text=Telegram').or(locator('text=Доступ запрещён')).or(locator('text=Авторизация')) resolved to 3 elements:
  9 | }); 
```