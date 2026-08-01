// Генерация og-картинки (1200×630) для превью ссылок в мессенджерах и соцсетях.
// SVG рисуется здесь же и растрируется в PNG: SVG как og:image не поддерживают
// ни Telegram, ни LinkedIn, ни X.
//
// Запуск: npm run og  (результат — public/og.png, коммитится в репозиторий)

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const profile = JSON.parse(readFileSync(new URL('../src/data/profile.json', import.meta.url)));

const stats = profile.stats
  .map((s, i) => {
    const x = 80 + i * 268;
    return `
      <text x="${x}" y="516" font-family="JetBrains Mono, monospace" font-size="54" font-weight="700" fill="#5fd9e8">${s.value}</text>
      <text x="${x}" y="556" font-family="Inter, sans-serif" font-size="21" fill="#9aa4b2">${s.short ?? s.label}</text>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="0%" r="80%">
      <stop offset="0%" stop-color="#1d4f5e" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#14171f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="5%" cy="100%" r="70%">
      <stop offset="0%" stop-color="#3a2a5e" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#14171f" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" fill="none" stroke="#5fd9e8" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#14171f"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <text x="80" y="132" font-family="JetBrains Mono, monospace" font-size="26" fill="#5fd9e8">~/samoy.love</text>

  <text x="80" y="252" font-family="Inter, sans-serif" font-size="92" font-weight="800" fill="#eef1f6">${profile.name}</text>
  <text x="80" y="322" font-family="Inter, sans-serif" font-size="40" font-weight="600" fill="#f0b46a">${profile.class}</text>

  <text x="80" y="392" font-family="Inter, sans-serif" font-size="27" fill="#9aa4b2">Go · архитектура · команда. И pet-проекты по вечерам.</text>

  <rect x="80" y="440" width="1040" height="1" fill="#2b3140"/>
  ${stats}
</svg>`;

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('public/og.png готов');
