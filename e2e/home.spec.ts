import { test, expect } from './guards';

test.describe('главная страница', () => {
  test('открывается и показывает имя и все секции', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Алексей Самойлов');
    await expect(page.locator('.class-line')).toContainText('Teamlead');

    // Порядок разделов — часть смысла страницы: путь → работа → pet → контакты.
    for (const [id, title] of [
      ['path', 'Путь персонажа'],
      ['work', 'Рабочие проекты'],
      ['pet', 'Pet-проекты'],
      ['contact', 'Давайте поговорим'],
    ] as const) {
      await expect(page.locator(`section#${id} h2`)).toHaveText(title);
    }
  });

  test('навигация по якорям доскролливает до секций', async ({ page }) => {
    await page.goto('/');

    for (const [label, id] of [
      ['Путь', 'path'],
      ['Работа', 'work'],
      ['Pet-проекты', 'pet'],
      ['Контакты', 'contact'],
    ] as const) {
      await page.locator('.site-nav .links').getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      // Якорь работает тогда, когда секция реально оказалась в кадре.
      await expect(page.locator(`section#${id}`)).toBeInViewport({ ratio: 0.1 });
    }
  });

  test('3D-сцена в hero инициализируется', async ({ page }) => {
    // Уровень эффектов выбирается по железу: на слабой машине WebGL-модуль
    // осознанно не грузится. Фиксируем «сильное» устройство, иначе тест
    // проверял бы разное на разных агентах.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      const contexts: string[] = [];
      (window as unknown as { __ctx: string[] }).__ctx = contexts;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (this.id === 'hero-canvas') contexts.push(type);
        // @ts-expect-error пробрасываем аргументы как есть
        return original.call(this, type, ...rest);
      };
    });

    await page.goto('/');

    const canvas = page.locator('#hero-canvas');
    // При неудачной инициализации Hero.astro удаляет канвас и уходит на CSS-фон;
    // живой канвас с ненулевым размером — и есть признак успеха.
    await expect(canvas).toBeAttached();
    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
    expect(box?.height ?? 0).toBeGreaterThan(200);

    const contexts = await page.evaluate(() => (window as unknown as { __ctx: string[] }).__ctx);
    expect(contexts.some((c) => c.startsWith('webgl'))).toBe(true);

    // Канвас должен пережить несколько кадров, а не упасть на первом же тике.
    await page.waitForFunction(() => document.getElementById('hero-canvas') !== null);
    await expect(canvas).toBeAttached();
  });

  test('карточки pet-проектов ведут на обещанные страницы', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('#pet article.card');
    await expect(cards).toHaveCount(3);

    for (const [title, slug, demo] of [
      ['ChillHub', 'chillhub', 'https://launcher.samoy.love'],
      ['Hello Kitty Метро', 'metro', 'https://metro.samoy.love'],
      ['Snakes', 'snakes', 'https://snakes.samoy.love'],
    ] as const) {
      const card = cards.filter({ has: page.getByRole('heading', { name: title, level: 3 }) });
      await expect(card).toHaveCount(1);
      await expect(card.locator('a.go.demo')).toHaveAttribute('href', demo);
      await expect(card.locator(`a[href="/projects/${slug}/"]`).first()).toBeVisible();
    }
  });

  test('страница проекта открывается по ссылке с карточки', async ({ page }) => {
    await page.goto('/');

    await page.locator('#pet article.card').first().getByRole('link', { name: 'Подробнее →' }).click();

    await expect(page).toHaveURL(/\/projects\/chillhub\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ChillHub');
  });
});
