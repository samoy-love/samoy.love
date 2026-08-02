// Тесты целостности контента.
//
// Данные страницы разложены по нескольким JSON, и они ссылаются друг на друга:
// вехи пути указывают идентификаторы ачивок, профиль — избранные ачивки,
// проекты — файлы обложек и описаний. Опечатка в идентификаторе не ломает
// сборку: Astro просто отрисует пустоту, и это заметно не сразу.
// Здесь такие расхождения ловятся до выкатки.

import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import achievements from './achievements.json';
import profile from './profile.json';
import projects from './projects.json';
import timeline from './timeline.json';
import work from './work.json';

const repoPath = (rel: string) => fileURLToPath(new URL(`../../${rel}`, import.meta.url));
const ids = new Set(achievements.map((a) => a.id));

describe('ачивки', () => {
  it('идентификаторы уникальны', () => {
    expect(ids.size).toBe(achievements.length);
  });

  it('редкость только из допустимого набора', () => {
    for (const a of achievements) {
      expect(['common', 'rare']).toContain(a.rarity);
    }
  });

  it('у каждой есть название и пояснение', () => {
    for (const a of achievements) {
      expect(a.title.trim()).not.toBe('');
      expect(a.note.trim()).not.toBe('');
    }
  });
});

describe('путь персонажа', () => {
  it('ссылается только на существующие ачивки', () => {
    for (const step of timeline) {
      for (const id of step.achievements) {
        expect(ids, `веха «${step.title}» ссылается на несуществующую ачивку ${id}`).toContain(id);
      }
    }
  });

  it('у каждой вехи заполнены период, текст и факт', () => {
    for (const step of timeline) {
      expect(step.period.trim()).not.toBe('');
      expect(step.text.trim()).not.toBe('');
      expect(step.fact.trim()).not.toBe('');
    }
  });
});

describe('профиль', () => {
  it('избранные ачивки существуют', () => {
    for (const id of profile.featuredAchievements) {
      expect(ids, `в профиле указана несуществующая ачивка ${id}`).toContain(id);
    }
  });

  it('счётчик pet-проектов совпадает с их числом', () => {
    // Цифры в hero — самая заметная часть страницы, и разъезжаются они молча.
    const stat = profile.stats.find((s) => s.label.includes('pet-проекта'));
    expect(stat, 'в статах нет строки про pet-проекты').toBeDefined();
    expect(Number(stat!.value)).toBe(projects.length);
  });

  it('счётчик рабочих продуктов совпадает с числом кейсов', () => {
    const stat = profile.stats.find((s) => s.label.includes('продукта'));
    expect(stat).toBeDefined();
    expect(Number(stat!.value)).toBe(work.length);
  });

  it('контакты заданы и выглядят правдоподобно', () => {
    expect(profile.contacts.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
    expect(profile.contacts.telegram).toMatch(/^https:\/\/t\.me\//);
    expect(profile.contacts.github).toMatch(/^https:\/\/github\.com\//);
  });
});

describe('pet-проекты', () => {
  it('slug уникальны', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('порядок сортировки уникален', () => {
    const orders = projects.map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('обложка существует на диске', () => {
    for (const p of projects) {
      const file = repoPath(`public${p.cover}`);
      expect(existsSync(file), `нет файла обложки ${p.cover} (проект ${p.slug})`).toBe(true);
    }
  });

  it('есть описание в content/projects', () => {
    for (const p of projects) {
      const md = repoPath(`src/content/projects/${p.slug}.md`);
      expect(existsSync(md), `нет описания для проекта ${p.slug}`).toBe(true);
    }
  });

  it('внешние ссылки только по https', () => {
    for (const p of projects) {
      for (const url of Object.values(p.links)) {
        if (typeof url === 'string' && url.startsWith('http')) {
          expect(url, `небезопасная ссылка в проекте ${p.slug}`).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('акцентный цвет задан в oklch', () => {
    for (const p of projects) {
      expect(p.accent, `цвет проекта ${p.slug} не в oklch`).toMatch(/^oklch\(/);
    }
  });
});

describe('рабочие кейсы', () => {
  it('у каждого есть роль, арк и результаты', () => {
    for (const c of work) {
      expect(c.arc.trim()).not.toBe('');
      expect(c.role.trim()).not.toBe('');
      expect(c.results.length).toBeGreaterThan(0);
    }
  });

  it('скриншот либо существует, либо не указан', () => {
    // Пустая строка — осознанное «скриншота пока нет», а вот битый путь
    // даст пустую картинку на странице.
    for (const c of work) {
      if (c.screen) {
        expect(existsSync(repoPath(`public${c.screen}`)), `нет скриншота ${c.screen}`).toBe(true);
      }
    }
  });
});
