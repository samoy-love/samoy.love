import { test, expect } from './guards';

// Сборка проходит независимо от того, помещается ли страница в экран телефона.
// Горизонтальная прокрутка и уехавшие за край карточки — самый частый способ
// сломать мобильную раскладку незаметно.
test('мобильная ширина не ломает раскладку', async ({ page }) => {
  await page.goto('/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'горизонтальная прокрутка на телефоне').toBeLessThanOrEqual(1);

  // Навигация остаётся доступной: бренд на узком экране прячется, ссылки — нет.
  await expect(page.locator('.site-nav .links a')).toHaveCount(4);
  await expect(page.locator('.site-nav .links').getByRole('link', { name: 'Контакты' })).toBeVisible();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const viewport = page.viewportSize()!;
  for (const section of ['path', 'work', 'pet', 'contact']) {
    const box = await page.locator(`section#${section}`).boundingBox();
    expect(box!.x, `секция ${section} уехала влево`).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, `секция ${section} шире экрана`).toBeLessThanOrEqual(viewport.width + 1);
  }

  // Карточки проектов на телефоне встают в одну колонку и остаются кликабельными.
  const card = page.locator('#pet article.card').first();
  await expect(card).toBeVisible();
  const cardBox = await card.boundingBox();
  expect(cardBox!.width).toBeLessThanOrEqual(viewport.width);
});
