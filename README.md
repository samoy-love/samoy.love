# samoy.love

English · [Русский](README.ru.md)

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

**Zero JavaScript by default.** Astro 7 with no framework islands at all. The
whole homepage ships 20.8 KB of gzipped JS: a 0.9 KB entry script, a 5.3 KB
transitions router and a 14.6 KB 3D scene chunk. HTML is 7.5 KB gzipped, CSS
7.9 KB. A page whose job is to load fast for a stranger on a phone has no
business shipping a framework runtime to render text that never changes.

**The hero background runs on OGL rather than three.js.** Same particle field,
14.6 KB instead of roughly 150. The scene is loaded through a dynamic
`import()`, and the decision is taken *before* the import: on a device
reporting `hardwareConcurrency <= 4` or `deviceMemory <= 4`, or with
`prefers-reduced-motion: reduce`, those kilobytes are never downloaded. Three
tiers result — full scene, animated CSS gradient, fully static — and content is
never locked behind an animation.

**Animations without JavaScript.** The timeline drawing itself, the experience
bar filling and sections appearing are CSS scroll-driven animations
(`animation-timeline: view()`), guarded by `@supports`. Scroll handlers in JS
are the classic way to make a page janky and to break it for anyone who turned
motion off; the browser does the same work on the compositor for free.

**Page transitions keep the WebGL context honest.** A project cover flies from
the card into the project page header via View Transitions. Since the router
swaps the DOM without reloading the document, the scene is torn down on
`astro:before-swap` — otherwise `requestAnimationFrame` keeps drawing into a
discarded canvas and every visit to the homepage leaks another GL context. An
end-to-end test asserts that a return trip creates exactly one.

**No third-party trackers, no cookies.** There is no analytics script on the
page, no cookie is set and there is no cookie banner to dismiss; fonts are
self-hosted, so the browser asks nothing of anyone but samoy.love. Traffic is
counted from a separate narrow nginx log format that carries only host,
request, status, bytes and response time. `$remote_addr`, `$http_user_agent`,
`$http_referer` and `$cookie_*` are physically absent from it: there is nothing
by which two visits could be tied to one person, and a field that does not
exist cannot leak through a parser mistake.

Clicks through to a project, a repository or the mailbox are counted too, by an
empty `POST /e/<event>` answered with 204 — no body, no parameters, no cookie,
no session or visitor id. It lands in the same kind of log line: host, event
name, zero bytes. This page used to promise "zero trackers"; once these
counters appeared that stopped being literally true, so the promise now names
what is actually absent instead. What happened is counted; who did it is not.

Both formats live in
[deploy-kit](https://github.com/tr0llex/deploy-kit/blob/main/nginx/conf.d/samoylove-log-metrics.conf)
and [metrics.samoy.love](https://github.com/tr0llex/metrics.samoy.love) reads them.

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

`npm test` — 17 content integrity tests. The content is spread across several
JSON files that reference each other by id, and a typo in an id does not break
the build: Astro renders nothing and the page silently loses a section. The
tests check that references resolve, that covers exist on disk, that counters
match the arrays they count, that external links are https and that accent
colours parse.

`npm run e2e` — 7 Playwright scenarios against a real production build: the
homepage opens with every section, anchor navigation actually scrolls, the hero
scene initialises WebGL and survives its first frames, cards link where they
promise, the scene comes back after a round trip having created exactly one new
context, and phone width produces no horizontal overflow. Three more scenarios
(`npm run e2e:prod`) run against the live site by hand, including a check that
the deployed version matches `/version.json`.

Every test carries the same guard: any browser console error and any failed
network request fails it. A page that returns 200 with a dead script is red
here, although its status code would look healthy.

CI gates a pull request on the unit tests with coverage, the build, a link and
asset check over the built HTML, and the full end-to-end run. Deployment reruns
the tests and the build as its own gate — a red gate means no release.

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
