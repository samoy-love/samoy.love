import { test, expect } from '../guards';

test('прод отдаёт живую страницу, а не просто 200', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Алексей Самойлов');
  for (const id of ['path', 'work', 'pet', 'contact']) {
    await expect(page.locator(`section#${id}`)).toBeAttached();
  }
  await expect(page.locator('#pet article.card')).toHaveCount(3);

  await page.locator('.site-nav .links').getByRole('link', { name: 'Контакты' }).click();
  await expect(page.locator('section#contact')).toBeInViewport({ ratio: 0.1 });
});

test('прод отдаёт страницу проекта', async ({ page }) => {
  await page.goto('/projects/metro/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Метро');
});

test('версия на проде совпадает с /version.json', async ({ request }) => {
  const res = await request.get('/version.json');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.version, 'в /version.json нет версии').toBeTruthy();
});
