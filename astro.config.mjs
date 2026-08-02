// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { eventsDevEndpoint } from './scripts/events-dev-endpoint.mjs';

export default defineConfig({
  site: 'https://samoy.love',
  compressHTML: true,
  integrations: [sitemap()],
  vite: {
    // В проде /e/<событие> обслуживает nginx. Локально его нет, и без
    // заглушки каждое нажатие давало бы 404 в консоли.
    plugins: [eventsDevEndpoint()],

    build: {
      // НОЛЬ — ЧТОБЫ СКРИПТЫ БЫЛИ ВНЕШНИМИ ФАЙЛАМИ, А НЕ ИНЛАЙНОМ.
      //
      // Astro по умолчанию вклеивает мелкие собранные скрипты прямо в HTML.
      // Из-за этого заголовок CSP был обязан разрешать script-src
      // 'unsafe-inline' — то есть не отличал наши три модуля от чужого
      // скрипта, вставленного через XSS. Ровно эту дыру 'unsafe-inline' и
      // должен закрывать.
      //
      // С нулём все скрипты уезжают в /_astro/*.js, инлайн-скриптов в сборке
      // не остаётся вовсе, и CSP в deploy-kit отдаёт script-src 'self'.
      // Тот же приём уже применён у metro (см. nginx/sites/metro.conf).
      //
      // <script type="application/ld+json"> в шаблоне остаётся инлайном и это
      // нормально: браузер его не исполняет, script-src на него не действует.
      //
      // Проверяется машиной: `npm run check:no-inline-scripts` в CI и в гейтах
      // выкатки. Если Astro снова начнёт что-то вклеивать, упадёт сборка,
      // а не прод.
      assetsInlineLimit: 0,
    },
  },
});
