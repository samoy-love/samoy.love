import { test, expect } from './guards';

// Единственный сетевой побочный эффект сайта — пустой POST на /e/<событие>.
// До этого файла он не проверялся нигде: в проде путь обслуживает nginx, на
// `astro preview` его нет (плагины Vite там не исполняются), и guards.ts просто
// прощал 404 — то есть отсутствие запроса и сломанный запрос выглядели одинаково.
//
// Заглушка стоит на стороне браузера, а не сервера: page.route ловит sendBeacon
// так же, как обычный запрос, и показывает и метод, и адрес.
test.describe('счётчики событий', () => {
  test('переход в карточку pet-проекта считается', async ({ page }) => {
    const beacons: string[] = [];
    await page.route('**/e/*', async (route) => {
      const req = route.request();
      beacons.push(`${req.method()} ${new URL(req.url()).pathname}`);
      // Ровно то, что вернул бы прод.
      await route.fulfill({ status: 204, headers: { 'Cache-Control': 'no-store' } });
    });

    await page.goto('/');
    await page
      .locator('#pet article.card')
      .first()
      .getByRole('link', { name: 'Подробнее →' })
      .click();
    await expect(page).toHaveURL(/\/projects\/chillhub\/$/);

    // Событие уходит рядом с переходом, поэтому ждём его, а не читаем сразу.
    await expect.poll(() => beacons).toContain('POST /e/project_open');
  });
});
