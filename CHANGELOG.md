# Changelog

## 1.1.0 — Phase 1 UI

A flagship-quality, Apple-inspired redesign of the interface. No changes to the
timer state machine or the pure-module architecture.

### Added
- Light / dark / system theming with a persisted toggle, a `:root` design-token
  system, and a no-flash theme bootstrap (`theme.js`, `ThemeToggle`).
- Tabular, animated countdown numerals that never jitter (`CountdownDisplay`).
- A perimeter progress ring that drains as time runs down (`ProgressRing`).
- View-Transition phase morphs, a fullscreen presenter mode with auto-hiding
  controls, and a finish bloom synced to the chime.
- Accessibility + responsive pass: focus management on phase change, polite
  `aria-live` milestone announcements, Space to pause/resume, and a
  reduced-motion kill-switch.

### Changed
- `styles.css` rebuilt as a tokenized system (system font stack with an Inter
  fallback) replacing the previous fixed dark glass theme.

### Tests
- New `theme` unit suite registered in the custom runner.
