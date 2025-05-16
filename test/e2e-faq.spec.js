const { test, expect } = require('@playwright/test');

test('Страница FAQ', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: 'Часто задаваемые вопросы' })).toBeVisible();
  await expect(page.locator('text=Как работает оплата криптовалютой?')).toBeVisible();
}); 