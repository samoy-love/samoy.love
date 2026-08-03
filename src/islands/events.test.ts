// Счётчики событий интерфейса.
//
// Это единственный код на странице, который сам ходит в сеть, и единственный
// с закрытым списком допустимых значений — то есть ровно то место, где молчащая
// ошибка стоит дороже всего: незнакомое имя сервер сворачивает в общий ряд
// "other", и ряд события просто не появляется, ничего при этом не ломая.
// Поэтому проверяем и адрес запроса, и то, что список действительно закрыт.
//
// DOM здесь не нужен: initEventTracking принимает любой ParentNode, а слушателю
// достаточно объекта с closest() — так тест обходится без jsdom.

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SITE_EVENTS, initEventTracking, trackEvent } from './events';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Подменяет navigator одним sendBeacon и возвращает шпиона. */
function stubBeacon() {
  const sendBeacon = vi.fn();
  vi.stubGlobal('navigator', { sendBeacon });
  return sendBeacon;
}

/**
 * Заглушка корня: запоминает делегированный обработчик и умеет «кликать».
 * `dataEvent === null` — клик мимо любого [data-event].
 */
function fakeRoot() {
  let handler: ((e: unknown) => void) | null = null;
  const root = {
    addEventListener(type: string, fn: (e: unknown) => void) {
      if (type === 'click') handler = fn;
    },
  } as unknown as ParentNode;

  const click = (dataEvent: string | null) => {
    const target = dataEvent === null ? null : { dataset: { event: dataEvent } };
    handler?.({ target: { closest: () => target } });
  };

  return { root, click };
}

describe('список событий', () => {
  it('имена уникальны', () => {
    expect(new Set(SITE_EVENTS).size).toBe(SITE_EVENTS.length);
  });

  it('имена подходят под серверный шаблон', () => {
    // Тот же шаблон, что в nginx и в scripts/events-dev-endpoint.mjs: всё,
    // что под него не подходит, прод сворачивает в "other" — ряд события
    // просто не появится, и заметить это по метрикам нельзя.
    for (const name of SITE_EVENTS) {
      expect(name, `имя ${name} не подходит под шаблон /e/<событие>`).toMatch(
        /^[a-z][a-z0-9_]{2,39}$/,
      );
    }
  });
});

describe('отправка события', () => {
  it('уходит пустым POST на /e/<событие>', () => {
    const sendBeacon = stubBeacon();
    trackEvent('project_open');
    // Ни тела, ни параметров: адрес — единственное, что уезжает на сервер.
    expect(sendBeacon).toHaveBeenCalledWith('/e/project_open');
  });

  it('без sendBeacon падает на fetch с keepalive', () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal('fetch', fetchMock);

    trackEvent('contact_open');

    // keepalive обязателен: почти каждое событие сопровождает уход со страницы.
    expect(fetchMock).toHaveBeenCalledWith('/e/contact_open', {
      method: 'POST',
      keepalive: true,
    });
  });

  it('не бросает, если счётчик заблокирован', () => {
    vi.stubGlobal('navigator', {
      sendBeacon: () => {
        throw new Error('blocked by extension');
      },
    });
    // Из-за счётчика не должна не открыться ссылка — это весь его приоритет.
    expect(() => trackEvent('project_open')).not.toThrow();
  });

  it('молчит там, где navigator нет', () => {
    vi.stubGlobal('navigator', undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    trackEvent('project_open');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('делегированный слушатель', () => {
  it('отправляет событие из data-event ближайшего предка', () => {
    const sendBeacon = stubBeacon();
    const { root, click } = fakeRoot();

    initEventTracking(root);
    click('project_open');

    expect(sendBeacon).toHaveBeenCalledWith('/e/project_open');
  });

  it('молчит на клике мимо [data-event]', () => {
    const sendBeacon = stubBeacon();
    const { root, click } = fakeRoot();

    initEventTracking(root);
    click(null);

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('не отправляет имя вне списка', () => {
    // Список закрыт с обеих сторон: разметка задаётся атрибутом, и без этой
    // проверки любой data-event уезжал бы на сервер отдельным путём.
    const sendBeacon = stubBeacon();
    const { root, click } = fakeRoot();

    initEventTracking(root);
    click('../../admin');
    click('source_open_v2');

    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
