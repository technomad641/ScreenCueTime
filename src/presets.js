// Quick-start timer presets plus a small localStorage-backed history of the
// most recently used timers. All storage helpers accept a storage object so
// they can be unit tested with a plain in-memory stub.

export const TIMER_PRESETS = [
  { id: "1-min", label: "1 min", hours: 0, minutes: 1, seconds: 0 },
  { id: "5-min", label: "5 min", hours: 0, minutes: 5, seconds: 0 },
  { id: "10-min", label: "10 min", hours: 0, minutes: 10, seconds: 0 },
  { id: "pomodoro", label: "Pomodoro (25)", hours: 0, minutes: 25, seconds: 0 },
  { id: "break", label: "Break (5)", hours: 0, minutes: 5, seconds: 0 },
];

const RECENTS_KEY = "screencuetime.recents";
const MAX_RECENTS = 5;

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRecent(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const hours = clamp(toInt(entry.hours), 0, 23);
  const minutes = clamp(toInt(entry.minutes), 0, 59);
  const seconds = clamp(toInt(entry.seconds), 0, 59);
  const songLink = typeof entry.songLink === "string" ? entry.songLink.trim() : "";

  if (hours + minutes + seconds <= 0) {
    return null;
  }

  return { hours, minutes, seconds, songLink };
}

export function recentKey(entry) {
  return `${entry.hours}:${entry.minutes}:${entry.seconds}|${entry.songLink}`;
}

export function formatDurationLabel(hours, minutes, seconds) {
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }
  return parts.length ? parts.join(" ") : "0s";
}

export function loadRecentTimers(storage) {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(RECENTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeRecent)
      .filter(Boolean)
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function saveRecentTimer(storage, entry) {
  const normalized = normalizeRecent(entry);
  const existing = loadRecentTimers(storage);
  if (!normalized) {
    return existing;
  }

  const deduped = existing.filter((item) => recentKey(item) !== recentKey(normalized));
  const next = [normalized, ...deduped].slice(0, MAX_RECENTS);

  if (storage) {
    try {
      storage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // Ignore write failures (private mode, disabled storage, quota, etc.).
    }
  }

  return next;
}
