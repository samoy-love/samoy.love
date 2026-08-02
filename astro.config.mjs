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
  },
});
