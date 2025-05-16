const { test, expect } = require('@playwright/test');

test('Главная страница и навигация', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kitty Poop VPN' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Тарифы' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Профиль' })).toBeVisible();

  // Переход на FAQ
  await page.getByRole('link', { name: 'FAQ по настройке' }).click();
  await expect(page.getByRole('heading', { name: 'Часто задаваемые вопросы' })).toBeVisible();

  // Переход на About
  await page.getByRole('link', { name: 'О нас' }).click();
  await expect(page.getByRole('heading', { name: 'О проекте' })).toBeVisible();
}); 