// Theme model for ScreenCueTime. The app supports an explicit light/dark choice
// plus a "system" option that follows the OS preference. Like presets.js, every
// storage helper takes a storage object so it can be unit tested with a plain
// in-memory stub and tolerates private-mode / disabled storage.

export const THEME = {
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
};

// Cycle order for the single toggle control: System -> Light -> Dark -> System.
export const THEME_CYCLE = [THEME.SYSTEM, THEME.LIGHT, THEME.DARK];

const THEME_KEY = "screencuetime.theme";
const VALID_THEMES = new Set(THEME_CYCLE);

export function normalizeTheme(value) {
  return VALID_THEMES.has(value) ? value : THEME.SYSTEM;
}

// Collapse the stored preference into the concrete theme to paint, using the
// OS preference (a boolean) only when the preference is "system".
export function resolveTheme(preference, prefersDark) {
  const normalized = normalizeTheme(preference);
  if (normalized === THEME.SYSTEM) {
    return prefersDark ? THEME.DARK : THEME.LIGHT;
  }
  return normalized;
}

export function nextTheme(preference) {
  const index = THEME_CYCLE.indexOf(normalizeTheme(preference));
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
}

export function themeLabel(preference) {
  switch (normalizeTheme(preference)) {
    case THEME.LIGHT:
      return "Light";
    case THEME.DARK:
      return "Dark";
    default:
      return "System";
  }
}

export function loadTheme(storage) {
  if (!storage) {
    return THEME.SYSTEM;
  }
  try {
    return normalizeTheme(storage.getItem(THEME_KEY));
  } catch {
    return THEME.SYSTEM;
  }
}

export function saveTheme(storage, preference) {
  const normalized = normalizeTheme(preference);
  if (storage) {
    try {
      storage.setItem(THEME_KEY, normalized);
    } catch {
      // Ignore write failures (private mode, disabled storage, quota, etc.).
    }
  }
  return normalized;
}
