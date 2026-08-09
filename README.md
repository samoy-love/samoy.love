# samoy.love

Русский · [English](README.en.md)

[![CI](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml/badge.svg)](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tr0llex/samoy.love/branch/main/graph/badge.svg)](https://codecov.io/gh/tr0llex/samoy.love)
[![прод](https://img.shields.io/website?url=https%3A%2F%2Fsamoy.love&up_message=online&up_color=2ea043&down_message=offline&label=samoy.love)](https://samoy.love)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Личная страница и витрина проектов Алексея Самойлова, теамлида в Почте
Mail.ru — вживую на **[samoy.love](https://samoy.love)**, для тех, кто решает,
хочет ли иметь с ним дело.

Резюме в документе отвечает на вопрос «что делал» и совсем не отвечает на
вопрос «как делает». Поэтому ответ — сама страница: карьера разложена как
level-путь, рабочие продукты — основной квест, pet-проекты — сайд-квесты, а
код можно прочитать целиком. Домен читается как фамилия владельца —
Самойлов, samoy.love, — и остальное хозяйство живёт под тем же именем.

![samoy.love](docs/img/home.svg)

## Как устроено

**Ноль JavaScript по умолчанию.** Astro 7, фреймворковых островов нет. Вся
главная — 20,8 КБ JS в gzip (входной скрипт, роутер переходов, чанк 3D-сцены),
HTML 7,5 КБ, CSS 7,9 КБ.

**3D-фон hero на OGL, а не на three.js** — 14,6 КБ против примерно 150. На
слабых устройствах (`hardwareConcurrency`/`deviceMemory <= 4`) или при
`prefers-reduced-motion: reduce` сцена не грузится вовсе: три уровня — полная
сцена, анимированный CSS-градиент, статика.

**Анимации без JavaScript** — CSS scroll-driven animations
(`animation-timeline: view()`) вместо обработчиков скролла.

**Переходы между страницами через View Transitions**, с явным гашением WebGL-
контекста при уходе со страницы — сквозной тест проверяет, что он не течёт.

**Ни чужих трекеров, ни cookie.** Аналитики и cookie нет, шрифты — на своём
домене. Посещаемость и переходы по ссылкам считаются анонимно через узкий
формат nginx-лога (без IP, UA, referer, cookie) и пустой `POST /e/<событие>`.
Оба формата лежат в
[deploy-kit](https://github.com/tr0llex/deploy-kit/blob/main/nginx/conf.d/samoylove-log-metrics.conf),
читает их [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love).

Подробности решений и бюджеты производительности — в
[docs/design.md](docs/design.md).

## Стек

`Astro 7` · `TypeScript` · `OGL (WebGL)` · `CSS scroll-driven animations` ·
`View Transitions` · `Vitest` · `Playwright` · `nginx`

## Быстрый старт

Node 22 или новее.

```bash
npm install
npm run dev          # дев-сервер
npm run build        # прод-сборка в dist/
npm run preview      # предпросмотр сборки
npm test             # тесты целостности контента
npm run e2e          # сквозные тесты (нужен npx playwright install chromium)
npm run og           # перегенерировать og-картинку
```

## Структура

| Путь | Назначение |
| --- | --- |
| `src/data/*.json` | профиль, путь, ачивки, рабочие кейсы, pet-проекты |
| `src/content/projects/*.md` | длинные описания проектов |
| `src/components/` | секции страницы |
| `src/islands/` | 3D-сцена и наклон карточек — единственный клиентский JS |
| `src/pages/` | главная, страницы проектов, 404 |
| `scripts/make-og.mjs` | генератор og-картинки из данных профиля |
| `e2e/` | сценарии Playwright и страж консоли и сети |
| `docs/design.md` | решения по дизайну и бюджеты производительности |
| `.deploy-kit/prod.env` | описание цели выкатки |

Добавить проект или ачивку можно без единой строки кода: контент — это JSON.

## Тесты

`npm test` — тесты целостности контента: данные разложены по нескольким JSON
и ссылаются друг на друга по идентификаторам, тесты проверяют, что ссылки
разрешаются, обложки лежат на диске, счётчики совпадают, а внешние ссылки
идут по https.

`npm run e2e` — сценарии Playwright по прод-сборке: главная со всеми
секциями, навигация, инициализация WebGL-сцены и отсутствие утечки контекста
при переходах, мобильная раскладка. Ещё несколько сценариев (`npm run
e2e:prod`) запускаются по живому сайту руками, включая сверку версии с
`/version.json`.

Во всех тестах работает один и тот же страж: любая ошибка в консоли браузера и
любой неудачный сетевой запрос валят тест.

CI гейтит пулл-реквест юнит-тестами с покрытием, сборкой и сквозным прогоном.
Выкатка прогоняет тесты и сборку ещё раз, уже как собственный гейт.

## Выкатка

Пуш в `main` собирает артефакт, раскладывает его рядом с текущим релизом и
атомарно переключает симлинк `current`, после чего сверяет `/version.json` и
проверяет соседние домены на том же хосте.

```bash
dk                       # что сейчас на проде
dk deploy samoy.love     # выкатить
dk rollback samoy.love   # откатить
```

Сама механика живёт в [deploy-kit](https://github.com/tr0llex/deploy-kit),
там же конфигурация nginx. Своих скриптов деплоя в этом репозитории нет.

## Часть samoy.love

Не россыпь пет-проектов, а одна система: один домен, один сервер, один
релизный пайплайн, одна статус-страница, один мониторинг.

| Проект | Что это | Код |
| --- | --- | --- |
| [samoy.love](https://samoy.love) | личная страница и витрина | [samoy.love](https://github.com/tr0llex/samoy.love) |
| [launcher.samoy.love](https://launcher.samoy.love) | ChillHub — лаунчер игр для Windows с обновлениями по диффу | [chillhub](https://github.com/tr0llex/chillhub) |
| [snakes.samoy.love](https://snakes.samoy.love) | мультиплеерный захват территории, бинарный WebSocket-протокол | [snakes](https://github.com/tr0llex/snakes) |
| [metro.samoy.love](https://metro.samoy.love) | офлайн-PWA со схемой московского метро | [metro-map](https://github.com/tr0llex/metro-map) |
| [status.samoy.love](https://status.samoy.love) | состояние сервисов: аптайм, версии, инциденты | [status.samoy.love](https://github.com/tr0llex/status.samoy.love) |
| [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love) | мониторинг и посещаемость без чужих трекеров | [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love) |
| — | общий релизный пайплайн | [deploy-kit](https://github.com/tr0llex/deploy-kit) |

## Контакты и лицензия

[alex@samoy.love](mailto:alex@samoy.love) · [t.me/tr0llex](https://t.me/tr0llex) ·
[github.com/tr0llex](https://github.com/tr0llex)

Это личная инфраструктура, и репозиторий читательский: PR не ожидаются,
вопросы — пожалуйста.

[MIT](LICENSE) © 2026 Алексей Самойлов
