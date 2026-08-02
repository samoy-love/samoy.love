# samoy.love

[![CI](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml/badge.svg)](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tr0llex/samoy.love/branch/main/graph/badge.svg)](https://codecov.io/gh/tr0llex/samoy.love)

Личная страница — **https://samoy.love**

Игровое резюме: путь от backend-разработчика до руководителя команды в Почте
Mail.ru, рабочие кейсы и pet-проекты. Статика, ноль трекеров.

## Стек

Astro 7 (нулевой JS по умолчанию, острова интерактивности), OGL для 3D-фона hero,
CSS scroll-driven animations, Inter и JetBrains Mono. Тесты — Vitest.

## Запуск

```bash
npm install
npm run dev          # дев-сервер
npm run build        # прод-сборка в dist/
npm run preview      # предпросмотр сборки
npm test             # тесты целостности контента
npm run og           # перегенерировать og-картинку из данных профиля
```

## Где что лежит

| Путь | Что это |
|---|---|
| `src/data/*.json` | весь контент: профиль, путь, ачивки, рабочие кейсы, pet-проекты |
| `src/content/projects/*.md` | длинные описания проектов |
| `src/components/` | секции страницы |
| `src/islands/` | 3D-сцена hero и tilt карточек — единственный клиентский JS |
| `scripts/make-og.mjs` | генератор og-картинки |
| `docs/design.md` | дизайн-документ: концепция, композиция, решения |
| `.deploy-kit/prod.env` | описание цели выкатки |

Контент правится в JSON — добавить проект или ачивку можно без единой строки кода.
Тесты проверяют, что ссылки между файлами не разъехались: например, что веха пути
не ссылается на несуществующую ачивку, а у проекта есть обложка и описание.

## Деплой

Выкатка — общим пайплайном [deploy-kit](https://github.com/tr0llex/deploy-kit):
пуш в `main` собирает артефакт, раскладывает его рядом с текущим релизом и
атомарно переключает симлинк, сверяя версию после переключения.

```bash
dk deploy samoy.love   # локально, тем же путём, что и CI
dk rollback samoy.love
```

Описание цели — `.deploy-kit/prod.env`, конфигурация nginx — в
[deploy-kit/nginx](https://github.com/tr0llex/deploy-kit/tree/main/nginx).
