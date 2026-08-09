# samoy.love

[Русский](README.md) · English

[![CI](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml/badge.svg)](https://github.com/tr0llex/samoy.love/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tr0llex/samoy.love/branch/main/graph/badge.svg)](https://codecov.io/gh/tr0llex/samoy.love)
[![prod](https://img.shields.io/website?url=https%3A%2F%2Fsamoy.love&up_message=online&up_color=2ea043&down_message=offline&label=samoy.love)](https://samoy.love)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

The personal homepage and project showcase of Alexey Samoylov, engineering team
lead at Mail.ru Mail — live at **[samoy.love](https://samoy.love)**, written for
anyone deciding whether they want to work with him.

A CV in a document answers "what did he do"; it does not answer "how does he
build". So the page is the answer: a career laid out as a level path, work
products as the main quest, side projects as side quests, and a codebase that
can be read end to end. The domain reads as the owner's surname — Samoylov,
samoy.love — and the rest of the household lives under the same name.

![samoy.love](docs/img/home.svg)

## How it works

**Zero JavaScript by default.** Astro 7, no framework islands. The whole
homepage ships 20.8 KB of gzipped JS (entry script, transitions router, 3D
scene chunk), 7.5 KB HTML, 7.9 KB CSS.

**The hero background runs on OGL rather than three.js** — 14.6 KB instead of
roughly 150. On weaker devices (`hardwareConcurrency`/`deviceMemory <= 4`) or
with `prefers-reduced-motion: reduce` the scene never loads: three tiers — full
scene, animated CSS gradient, fully static.

**Animations without JavaScript** — CSS scroll-driven animations
(`animation-timeline: view()`) instead of scroll handlers.

**Page transitions via View Transitions**, with the WebGL context explicitly
torn down on navigation — an end-to-end test asserts it never leaks.

**No third-party trackers, no cookies.** No analytics script, no cookies,
fonts are self-hosted. Traffic and link clicks are counted anonymously through
a narrow nginx log format (no IP, UA, referer, cookie) and an empty
`POST /e/<event>`. Both formats live in
[deploy-kit](https://github.com/tr0llex/deploy-kit/blob/main/nginx/conf.d/samoylove-log-metrics.conf),
read by [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love).

Design decisions and performance budgets — in
[docs/design.md](docs/design.md) (Russian).

## Stack

`Astro 7` · `TypeScript` · `OGL (WebGL)` · `CSS scroll-driven animations` ·
`View Transitions` · `Vitest` · `Playwright` · `nginx`

## Quick start

Node 22 or newer.

```bash
npm install
npm run dev          # dev server
npm run build        # production build into dist/
npm run preview      # preview the build
npm test             # content integrity tests
npm run e2e          # end-to-end tests (needs npx playwright install chromium)
npm run og           # regenerate the og image from profile data
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/data/*.json` | profile, level path, achievements, work cases, side projects |
| `src/content/projects/*.md` | long-form project descriptions |
| `src/components/` | page sections |
| `src/islands/` | 3D scene and card tilt — the only client-side JS |
| `src/pages/` | homepage, project pages, 404 |
| `scripts/make-og.mjs` | og image generator, built from the profile data |
| `e2e/` | Playwright scenarios and the console/network guard |
| `docs/design.md` | design decisions and performance budgets (Russian) |
| `.deploy-kit/prod.env` | deployment target description |

Adding a project or an achievement takes no code: the JSON is the content.

## Tests

`npm test` — content integrity tests: the content is spread across several
JSON files that reference each other by id; the tests check that references
resolve, that covers exist on disk, that counters match, and that external
links are https.

`npm run e2e` — Playwright scenarios against a production build: the homepage
with every section, navigation, WebGL scene initialisation and no context leak
on transitions, mobile layout. A few more scenarios (`npm run e2e:prod`) run
against the live site by hand, including a check that the deployed version
matches `/version.json`.

Every test carries the same guard: any browser console error and any failed
network request fails it.

CI gates a pull request on the unit tests with coverage, the build, and the
end-to-end run. Deployment reruns the tests and the build as its own gate.

## Deployment

A push to `main` builds an artifact, unpacks it next to the current release and
atomically flips the `current` symlink, then verifies `/version.json` and the
neighbouring domains on the same host.

```bash
dk                       # what is on prod right now
dk deploy samoy.love     # roll out
dk rollback samoy.love   # roll back
```

The mechanism itself lives in [deploy-kit](https://github.com/tr0llex/deploy-kit),
nginx configuration included. This repository has no deployment scripts of its
own.

## Part of samoy.love

Not a pile of side projects but one system: one domain, one server, one release
pipeline, one status page, one monitoring stack.

| Project | What it is | Code |
| --- | --- | --- |
| [samoy.love](https://samoy.love) | personal homepage and showcase | [samoy.love](https://github.com/tr0llex/samoy.love) |
| [launcher.samoy.love](https://launcher.samoy.love) | ChillHub — a Windows game launcher with diff updates | [chillhub](https://github.com/tr0llex/chillhub) |
| [snakes.samoy.love](https://snakes.samoy.love) | multiplayer territory capture, binary WebSocket protocol | [snakes](https://github.com/tr0llex/snakes) |
| [metro.samoy.love](https://metro.samoy.love) | offline PWA of the Moscow metro map | [metro-map](https://github.com/tr0llex/metro-map) |
| [status.samoy.love](https://status.samoy.love) | service status: uptime, versions, incidents | [status.samoy.love](https://github.com/tr0llex/status.samoy.love) |
| [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love) | monitoring and traffic stats without third-party trackers | [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love) |
| — | the shared release pipeline | [deploy-kit](https://github.com/tr0llex/deploy-kit) |

## Contacts and licence

[alex@samoy.love](mailto:alex@samoy.love) · [t.me/tr0llex](https://t.me/tr0llex) ·
[github.com/tr0llex](https://github.com/tr0llex)

This is personal infrastructure and the repository is meant for reading: pull
requests are not expected, questions are welcome.

[MIT](LICENSE) © 2026 Alexey Samoylov
