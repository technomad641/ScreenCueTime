import React from "react";
import { THEME, themeLabel } from "./theme";

const ICON = {
  [THEME.SYSTEM]: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  [THEME.LIGHT]: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  [THEME.DARK]: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
};

// A single control that cycles System -> Light -> Dark. The label is announced
// to assistive tech so the current choice is never icon-only.
function ThemeToggle({ preference, onCycle }) {
  const label = themeLabel(preference);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onCycle}
      aria-label={`Theme: ${label}. Activate to change.`}
      title={`Theme: ${label}`}
    >
      <span className="theme-toggle__icon">{ICON[preference] || ICON[THEME.SYSTEM]}</span>
      <span className="theme-toggle__label">{label}</span>
    </button>
  );
}

export default ThemeToggle;
