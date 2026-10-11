# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

- The repo owner has authorized **pushing changes directly to `main`** on this repo. Commit and push directly (no pull request required) unless the owner asks for a PR or branch in a given task. Still run `npm run build` (which runs the tests) green before pushing.

## Commands

- `npm run dev` — Vite dev server (usually http://localhost:5173)
- `npm run test` — run the full unit suite via the custom runner (`scripts/run-tests.mjs`)
- `npm run build` — **runs tests first, then** `vite build`; a failing test fails the build
- `npm run preview` — serve the production build from `dist/`

### Running a single test suite

There is no Jest/Vitest and no name filter. Each `*.test.js` file default-exports a zero-arg function that runs `node:assert` checks and throws on failure. Run one in isolation with:

```bash
node --input-type=module -e 'import run from "./src/timerUtils.test.js"; run();'
```

To add a suite, create `src/<name>.test.js` exporting such a function **and** register it in the `testSuites` array in `scripts/run-tests.mjs` — the runner only executes what is listed there.

## Architecture

Single-page React 18 + Vite frontend, no backend. The design deliberately keeps `src/App.jsx` as the only stateful/orchestration layer and pushes every testable decision into pure sibling modules.

- **`src/App.jsx`** — the whole application. Owns all timer state via a `TIMER_PHASE` state machine (`idle → running ⇄ paused → finished`), the countdown lifecycle (computes a target timestamp, ticks ~every 250ms), and playback orchestration. It wires the pure modules together and holds refs to the `<audio>` element, YouTube player, and chime. Treat the pure modules as the place to put logic; App should mostly coordinate.
- **`src/timerUtils.js`** — media classification and time formatting. `classifySongLink` returns a typed descriptor (`{type: "direct"|"youtube", src, label, ...}`) or `null` for anything that isn't playable media. `parseYouTubeLink` validates against an allowlist of exact hostnames — this intentionally rejects lookalike hosts (e.g. `evil-youtu.be.example.com`); preserve that when touching it.
- **`src/playback.js`** — `PLAYBACK_STATUS` model and user-facing playback messages.
- **`src/cue.js`** — media-independent finish chime built on the Web Audio API, so the finish always lands even when media fails or autoplay is blocked.
- **`src/PlaybackPanel.jsx`** — the visible finished-state media panel (direct audio and embedded YouTube) with app-level play/pause/stop/replay.
- **`src/presets.js`** — quick-start duration presets plus the `localStorage`-backed recent-timer history.
- **`src/shareLink.js`** — encodes/decodes a timer config to/from URL query params; App prefills the form from the URL on first load.

`timerUtils`, `playback`, `presets`, and `shareLink` each have a matching `*.test.js` and are the units under test — `App.jsx`, `PlaybackPanel.jsx`, and `cue.js` are not unit-tested (they are DOM/browser-bound).

## Notes

- `.gitignore` still carries Gradle/IntelliJ/Eclipse entries from an earlier JVM template; the project is purely a Vite frontend. Ignore that cruft.
- Browser constraints shape the design: keep the tab open while running, autoplay may be blocked (App keeps manual controls visible as fallback), and direct audio URLs are more reliable than YouTube embeds.

## gstack

This repo uses the [gstack](https://github.com/garrytan/gstack) skill suite (installed globally at `~/.claude/skills/gstack`).

- **For all web browsing, use the `/browse` skill** (drives a real browser via gstack). Do **not** use the built-in `mcp__claude-in-chrome__*` tools.
- Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/design-review`, `/devex-review`, `/review`, `/deslop-shared-libs`, `/test-audit`, `/ship`, `/eval-plan`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/scrape`, `/qa`, `/qa-only`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.
