const { test, expect } = require('@playwright/test');

test('Публичный пользователь: доступность страницы админки', async ({ page }) => {
  await page.goto('/admin/keys');
  // Проверяем, что либо видим форму Telegram-авторизации, либо сообщение о недоступности
  await expect(
    page.locator('text=Telegram').or(page.locator('text=Доступ запрещён')).or(page.locator('text=Авторизация'))
  ).toBeVisible();
}); 