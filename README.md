# ScreenCue Timer

A React + Vite web app for running an immersive fullscreen countdown timer and triggering a song when the timer completes.

## Features

- Fullscreen countdown experience with a large timer display
- Timer setup for hours, minutes, and seconds
- Song link input during setup
- Support for direct media URLs and YouTube links
- Reset flow to stop playback and start over
- Responsive layout for desktop and mobile

## Tech Stack

- React 18
- Vite 4
- Plain CSS

## Getting Started

### Prerequisites

- Node.js 16+
- npm 7+

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173/`.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Usage

1. Enter the timer duration.
2. Paste a song link.
3. Start the timer.
4. Keep the tab open until the countdown completes.

Direct audio links are the most reliable for autoplay. Some browsers may block autoplay until the user interacts with the page. When that happens, the app exposes audio controls so playback can be started manually.

## Project Structure

```text
.
├── index.html
├── package.json
├── src
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── vite.config.js
```

## Notes

- YouTube playback depends on browser and embed restrictions.
