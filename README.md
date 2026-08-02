# samoy.love

[![CI](https://github.com/tr0llex/Samoy.love-Homepage/actions/workflows/ci.yml/badge.svg)](https://github.com/tr0llex/Samoy.love-Homepage/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tr0llex/Samoy.love-Homepage/branch/main/graph/badge.svg)](https://codecov.io/gh/tr0llex/Samoy.love-Homepage)

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
| `deploy/nginx/` | конфиги боевого сервера |

Контент правится в JSON — добавить проект или ачивку можно без единой строки кода.
Тесты проверяют, что ссылки между файлами не разъехались: например, что веха пути
не ссылается на несуществующую ачивку, а у проекта есть обложка и описание.

## Деплой

Выкатка — общим пайплайном [deploy-kit](https://github.com/tr0llex/deploy-kit),
описание цели в `.deploy-kit/prod.env`. Раскладка nginx и порядок первичной
настройки сервера — [DEPLOY.md](DEPLOY.md).
