import assert from "node:assert/strict";
import {
  TIMER_PRESETS,
  formatDurationLabel,
  loadRecentTimers,
  recentKey,
  saveRecentTimer,
} from "./presets.js";

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

export default function runPresetsTests() {
  assert.ok(TIMER_PRESETS.length > 0);
  assert.ok(TIMER_PRESETS.every((preset) => typeof preset.id === "string" && typeof preset.label === "string"));

  assert.equal(formatDurationLabel(0, 25, 0), "25m");
  assert.equal(formatDurationLabel(1, 5, 30), "1h 5m 30s");
  assert.equal(formatDurationLabel(0, 0, 0), "0s");

  assert.equal(
    recentKey({ hours: 0, minutes: 5, seconds: 0, songLink: "https://x/y.mp3" }),
    "0:5:0|https://x/y.mp3",
  );

  const empty = createMemoryStorage();
  assert.deepEqual(loadRecentTimers(empty), []);
  assert.deepEqual(loadRecentTimers(null), []);

  // Saving normalizes string form values and clamps out-of-range parts.
  const afterSave = saveRecentTimer(empty, { hours: "0", minutes: "5", seconds: "0", songLink: " https://x/y.mp3 " });
  assert.deepEqual(afterSave, [{ hours: 0, minutes: 5, seconds: 0, songLink: "https://x/y.mp3" }]);
  assert.deepEqual(loadRecentTimers(empty), afterSave);

  // A zero-length timer is rejected and does not get stored.
  const stillOne = saveRecentTimer(empty, { hours: "0", minutes: "0", seconds: "0", songLink: "https://x/z.mp3" });
  assert.equal(stillOne.length, 1);

  // Re-saving the same config dedupes and moves it to the front.
  saveRecentTimer(empty, { hours: "0", minutes: "10", seconds: "0", songLink: "" });
  const reSaved = saveRecentTimer(empty, { hours: "0", minutes: "5", seconds: "0", songLink: "https://x/y.mp3" });
  assert.equal(reSaved.length, 2);
  assert.deepEqual(reSaved[0], { hours: 0, minutes: 5, seconds: 0, songLink: "https://x/y.mp3" });

  // History is capped at five entries, newest first.
  const capped = createMemoryStorage();
  for (let minute = 1; minute <= 7; minute += 1) {
    saveRecentTimer(capped, { hours: "0", minutes: String(minute), seconds: "0", songLink: "" });
  }
  const cappedList = loadRecentTimers(capped);
  assert.equal(cappedList.length, 5);
  assert.equal(cappedList[0].minutes, 7);

  // Corrupt stored data is ignored rather than throwing.
  const corrupt = createMemoryStorage({ "screencuetime.recents": "not json" });
  assert.deepEqual(loadRecentTimers(corrupt), []);
}
