// Страница может отдавать 200 и быть при этом сломанной: упавший скрипт,
// не загрузившийся шрифт, битая картинка. Поэтому каждый тест здесь идёт
// с двумя постоянными свидетелями: консоль браузера и сетевые ответы.
// Любая ошибка в консоли и любой неудачный запрос валят тест — даже если
// сам сценарий формально прошёл.

import { test as base, expect, type Page } from '@playwright/test';

/** Запросы, за которые страница не отвечает (аналитика третьих лиц и т.п.). */
const IGNORED_URLS: RegExp[] = [
  // Приёмник событий интерфейса. В проде /e/<событие> обслуживает nginx и
  // отвечает 204; `astro preview`, на котором идут эти тесты, статику отдаёт
  // сам и о таком пути не знает — отсюда 404. Заглушка для `astro dev` есть
  // (scripts/events-dev-endpoint.mjs), но preview плагины Vite не исполняет.
  //
  // Игнорируется ровно этот путь, а не любые 404: страница, потерявшая
  // картинку или шрифт, должна валить тест по-прежнему.
  /\/e\/[a-z][a-z0-9_]*$/,
];

/** Шум, который браузер печатает сам и который не связан с кодом страницы. */
const IGNORED_CONSOLE: RegExp[] = [
  /Download the React DevTools/i,
  // Программный WebGL в headless-Chromium иногда ворчит про производительность.
  /WebGL.*(software|swiftshader)/i,
];

function ignored(patterns: RegExp[], text: string): boolean {
  return patterns.some((re) => re.test(text));
}

export type Problems = { console: string[]; network: string[] };

/** Вешает слушателей на страницу и возвращает копилку проблем. */
export function watch(page: Page): Problems {
  const problems: Problems = { console: [], network: [] };

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ignored(IGNORED_CONSOLE, text)) return;
    // «Failed to load resource» не содержит адреса в тексте — он лежит в
    // location. Без этой проверки игнор-лист адресов не действовал бы на
    // консоль, и отфильтрованный сетевой запрос всё равно валил бы тест.
    const from = msg.location()?.url ?? '';
    if (from && ignored(IGNORED_URLS, from)) return;
    problems.console.push(text);
  });

  page.on('pageerror', (err) => {
    problems.console.push(`pageerror: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (ignored(IGNORED_URLS, url)) return;
    problems.network.push(`${req.method()} ${url} — ${req.failure()?.errorText ?? 'failed'}`);
  });

  page.on('response', (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    if (ignored(IGNORED_URLS, url)) return;
    problems.network.push(`${res.status()} ${res.request().method()} ${url}`);
  });

  return problems;
}

export function assertClean(problems: Problems): void {
  expect(problems.console, 'ошибки в консоли браузера').toEqual([]);
  expect(problems.network, 'неудачные сетевые запросы').toEqual([]);
}

/**
 * `page` из этой фикстуры уже под наблюдением: проверка выполняется в
 * teardown, поэтому её нельзя забыть дописать в конце теста.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = watch(page);
    await use(page);
    assertClean(problems);
  },
});

export { expect };
