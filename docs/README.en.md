[Русский](../README.md) · **English**

# samoy.love

A personal homepage built as a role-playing résumé: a career as a level path,
work projects as the main quest, side projects as side quests.

**[samoy.love](https://samoy.love)** ·
[![CI](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml/badge.svg)](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tr0llex/samoy.love/branch/main/graph/badge.svg)](https://codecov.io/gh/tr0llex/samoy.love)

![samoy.love character sheet](../public/og.png)

> The domain reads as the owner's surname: Samoylov — samoy.love.

## What this is

Alexey Samoylov, engineering team lead at Mail.ru Mail (one of Russia's largest
email services), previously a backend engineer. The page frames a career as
character progression: a level path from school to team lead, work cases, side
projects, and achievements that unlock as you scroll.

It is not cartoon gamification — no pixel art, no health bars. Only the
structure is playful; the visual language stays dark and restrained. Design
decisions are documented in the [design document](design.md) (in Russian).

## Ecosystem

Several projects on one server, sharing a single deployment pipeline.

| Project | What it is | Stack |
|---|---|---|
| [samoy.love](https://samoy.love) | this page | Astro, OGL |
| [snakes.samoy.love](https://snakes.samoy.love) | multiplayer territory capture: 16 players, AI bots | Go, binary WebSocket, Canvas |
| [metro.samoy.love](https://metro.samoy.love) | offline PWA of the Moscow metro map | React, Canvas, custom Go layout solver |
| [launcher.samoy.love](https://launcher.samoy.love) | ChillHub — a game launcher with diff-based updates | Go, WPF, Blake3 |
| [status.samoy.love](https://status.samoy.love) | service status | — |

They all ship through [deploy-kit](https://github.com/tr0llex/deploy-kit):
one target description, one `release.sh` on the server, nginx configs included.

## Engineering

- **Zero JavaScript by default.** Astro 7, no framework islands at all. Client
  code totals 21 KB gzipped: a 1.0 KB entry script, a 5.5 KB transitions
  router, and a 14.5 KB 3D scene chunk loaded via dynamic `import()` only where
  it makes sense. The homepage HTML is 6.6 KB gzipped, CSS is 7.8 KB.
- **The hero background uses OGL rather than three.js** — 14.5 KB instead of
  roughly 150 for the same result.
- **Three degradation tiers.** Full: 3D scene, a timeline that draws itself as
  you scroll, card tilt. Lite (`hardwareConcurrency ≤ 4` or data saver): an
  animated gradient instead of WebGL. Static (`prefers-reduced-motion`):
  everything still and visible at once. Content is never locked behind an
  animation.
- **Animations without JavaScript.** The timeline, the experience bar, and
  section reveals are CSS scroll-driven animations (`animation-timeline: view()`).
- **Page transitions.** A project cover flies from the card into the project
  page header via View Transitions. The router swaps the DOM without reloading,
  so the 3D scene is torn down on `astro:before-swap` and releases its WebGL
  context.
- **No trackers, no cookie banners.** Nothing leaves for third parties.

## Tests

`npm test` — 17 content integrity tests. The content lives in several JSON
files that reference each other, and a typo in an identifier does not break the
build: Astro simply renders nothing. These tests catch that before a release.

`npm run e2e` builds the project, serves the production output and walks the
page as a user would. Covered: the homepage opens with every section; anchor
navigation actually scrolls; the hero scene initialises WebGL and survives its
first frames; cards link where they promise; after navigating to a project and
back, the scene comes up again having created exactly one new context; at phone
width nothing overflows horizontally.

One check runs across every test: any browser console error and any failed
network request fails the test. A page returning 200 with a broken script is
red here, although its status code would look healthy.

## Deployment

A push to `main` builds an artifact, unpacks it next to the current release and
atomically flips a symlink, verifying the deployed version afterwards.

```bash
dk deploy samoy.love
dk rollback samoy.love
```

## Running locally

```bash
npm install
npm run dev
npm run build
npm test
```

Detailed instructions are in the [Russian README](../README.md).
