const { test, expect } = require('@playwright/test');

test('Публичный пользователь: переход к оплате', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=Выберите свой тариф')).toBeVisible();
  await page.click('text=ВЫБРАТЬ', { timeout: 5000 });
  // Проверяем, что появляется шаг Telegram-авторизации
  await expect(page.locator('text=Telegram')).toBeVisible();
}); 