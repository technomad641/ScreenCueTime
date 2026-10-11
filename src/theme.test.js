import assert from "node:assert/strict";
import {
  THEME,
  loadTheme,
  nextTheme,
  normalizeTheme,
  resolveTheme,
  saveTheme,
  themeLabel,
} from "./theme.js";

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

export default function runThemeTests() {
  // normalizeTheme falls back to system for anything unknown.
  assert.equal(normalizeTheme("light"), THEME.LIGHT);
  assert.equal(normalizeTheme("dark"), THEME.DARK);
  assert.equal(normalizeTheme("system"), THEME.SYSTEM);
  assert.equal(normalizeTheme("neon"), THEME.SYSTEM);
  assert.equal(normalizeTheme(undefined), THEME.SYSTEM);

  // resolveTheme honors explicit choices and follows the OS only for system.
  assert.equal(resolveTheme(THEME.LIGHT, true), THEME.LIGHT);
  assert.equal(resolveTheme(THEME.DARK, false), THEME.DARK);
  assert.equal(resolveTheme(THEME.SYSTEM, true), THEME.DARK);
  assert.equal(resolveTheme(THEME.SYSTEM, false), THEME.LIGHT);
  assert.equal(resolveTheme("garbage", true), THEME.DARK);

  // nextTheme cycles System -> Light -> Dark -> System.
  assert.equal(nextTheme(THEME.SYSTEM), THEME.LIGHT);
  assert.equal(nextTheme(THEME.LIGHT), THEME.DARK);
  assert.equal(nextTheme(THEME.DARK), THEME.SYSTEM);
  assert.equal(nextTheme("garbage"), THEME.LIGHT);

  assert.equal(themeLabel(THEME.DARK), "Dark");
  assert.equal(themeLabel("garbage"), "System");

  // Storage round-trips and tolerates a missing storage object.
  assert.equal(loadTheme(null), THEME.SYSTEM);
  assert.equal(saveTheme(null, THEME.DARK), THEME.DARK);

  const storage = createMemoryStorage();
  assert.equal(loadTheme(storage), THEME.SYSTEM);
  assert.equal(saveTheme(storage, THEME.LIGHT), THEME.LIGHT);
  assert.equal(loadTheme(storage), THEME.LIGHT);
  assert.equal(saveTheme(storage, "garbage"), THEME.SYSTEM);
  assert.equal(loadTheme(storage), THEME.SYSTEM);

  // A storage object that throws must never break the app.
  const hostileStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(loadTheme(hostileStorage), THEME.SYSTEM);
  assert.equal(saveTheme(hostileStorage, THEME.DARK), THEME.DARK);
}
