# ScreenCueTime

ScreenCueTime is a fullscreen countdown timer built with React and Vite. You set a duration, provide a song link, and the app switches from setup mode into an immersive timer screen that triggers playback when the countdown finishes.

* * *

## Overview

This project is designed for moments where the timer itself is part of the experience: stage cues, event countdowns, watch parties, classroom prompts, workout blocks, or any setup where a large visible timer should end with a song or media cue.

The app keeps the flow intentionally simple:

- Configure hours, minutes, and seconds (or tap a quick-start preset)
- Paste a direct audio URL or a YouTube link, and optionally test it first
- Start the timer
- Pause and resume the countdown as needed
- Leave the tab open while the countdown runs
- Let the app trigger playback — plus a chime and screen flash — when time reaches zero

* * *

## Architecture

```text
Timer Form -> Countdown State -> Countdown Display -> Playback Trigger
```

The app is a single-page frontend that splits its responsibilities across a small set of focused modules:

| Area | Responsibility |
| --- | --- |
| `src/App.jsx` | Timer state, countdown lifecycle (run/pause/resume/finish), and playback orchestration |
| `src/timerUtils.js` | Media classification, URL validation, source labels, and time formatting |
| `src/playback.js` | Playback status model and user-facing playback messaging |
| `src/PlaybackPanel.jsx` | Visible finished-state media panel with app-level controls |
| `src/cue.js` | Media-independent finish chime built on the Web Audio API |
| `src/presets.js` | Quick-start presets and the `localStorage`-backed recent-timer history |
| `src/shareLink.js` | Encode/decode a timer configuration to and from URL query parameters |
| `src/styles.css` | Fullscreen layout, responsive setup form, countdown screen styling |
| `src/main.jsx` | React bootstrap and root render |

* * *

## Features

- Fullscreen countdown experience with a large, high-contrast timer display
- Timer setup using hours, minutes, and seconds inputs
- Quick-start presets (1/5/10 min, Pomodoro, break) that fill the duration in one tap
- Recently-used timers remembered in `localStorage` for one-tap reuse
- Media-independent finish cue: a synthesized chime plus a full-screen flash so the finish lands even without media
- Pause and resume controls for the running countdown
- Test Media action that verifies a link loads before the timer starts
- Shareable links that encode the duration and song link in the URL for bookmarking or sharing
- Support for direct audio URLs and YouTube links
- Structured playback source metadata with lightweight display labels
- Automatic playback attempt when the timer reaches zero
- Explicit playback status tracking for countdown completion and media state
- Visible finished-state playback panel for direct media
- App-level direct media controls for play, pause, stop, and replay
- Visible YouTube player inside the finished-state playback panel
- App-level YouTube playback commands for play, pause, stop, and replay
- Manual audio controls fallback if browser autoplay is blocked
- Reset flow that stops playback and returns the app to setup mode
- Responsive layout for desktop and mobile screens

* * *

## Prerequisites

- Node.js 16 or newer
- npm 7 or newer

* * *

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Vite will print a local development URL, typically `http://localhost:5173`.

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build locally

```bash
npm run preview
```

* * *

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server |
| `npm run test` | Runs the unit test suite |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the production build locally for verification |

* * *

## How It Works

1. The user enters a duration (or taps a preset) and a song link. Prior timers can be reloaded from the recent-timer list, and a shared link can prefill the whole setup from the URL.
2. Optionally, the user tests the media so a broken link is caught before the timer starts.
3. The app validates that the timer is greater than zero.
4. The app classifies the song link as either:
   - a direct audio URL, or
   - a YouTube URL that can be embedded
   - and derives a simple label for the playback UI
5. A target timestamp is calculated from the current time.
6. While the timer is running, the UI updates roughly every 250 ms, and the countdown can be paused and resumed.
7. When the countdown reaches zero:
   - a synthesized chime plays and the screen flashes, independent of any media, so the finish always lands, and
   - direct audio is played through a visible playback panel with app-level controls, or
   - YouTube is launched through a visible embedded player with app controls
8. If autoplay is blocked, the app keeps recovery controls visible so playback can be started manually.

* * *

## Supported Media Input

### Direct audio URLs

Direct audio links are the most reliable option for end-of-timer playback.

Examples:

- `https://example.com/song.mp3`
- `https://cdn.example.com/finale.wav`
- `https://example.com/audio/cue.ogg`

### YouTube links

The app extracts the video ID from common YouTube URLs and embeds the video player when the timer completes.

Examples:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

* * *

## Browser Playback Notes

- Keep the tab open while the timer is running.
- Direct audio URLs are more dependable than YouTube for automatic playback.
- Some browsers block autoplay until the user has interacted with the page.
- Embedded YouTube playback can still be affected by browser policy or provider restrictions.
- If direct audio autoplay is blocked, the app shows audio controls so playback can be started manually.

* * *

## Project Structure

```text
.
├── index.html
├── package.json
├── package-lock.json
├── scripts
│   └── run-tests.mjs
├── src
│   ├── App.jsx
│   ├── PlaybackPanel.jsx
│   ├── cue.js
│   ├── playback.js
│   ├── playback.test.js
│   ├── presets.js
│   ├── presets.test.js
│   ├── shareLink.js
│   ├── shareLink.test.js
│   ├── main.jsx
│   ├── styles.css
│   ├── timerUtils.js
│   └── timerUtils.test.js
├── dist
│   └── index.html
└── vite.config.js
```

* * *

## Tech Stack

| Tool | Purpose |
| --- | --- |
| React 18 | UI and state management |
| Vite 4 | Development server and frontend build pipeline |
| Plain CSS | Styling and responsive layout |

* * *

## Local Development Notes

- The repo still contains IntelliJ project files, but the product itself is a frontend Vite app.
- The app does not require a backend service.
- Production hosting can be any static site platform that serves the Vite build output.

* * *

## References

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
