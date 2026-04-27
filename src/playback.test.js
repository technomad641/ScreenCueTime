import assert from "node:assert/strict";
import {
  getPlaybackNote,
  getPlaybackStatusLabel,
  getPlaybackTypeLabel,
  isAppPlaybackControllable,
  PLAYBACK_STATUS,
} from "./playback.js";

export default function runPlaybackTests() {
  assert.equal(getPlaybackTypeLabel("direct"), "Direct Media");
  assert.equal(getPlaybackTypeLabel("youtube"), "YouTube");

  assert.equal(getPlaybackStatusLabel(PLAYBACK_STATUS.BLOCKED), "Blocked");

  assert.equal(isAppPlaybackControllable({ type: "direct" }), true);
  assert.equal(isAppPlaybackControllable({ type: "youtube" }), false);
  assert.equal(isAppPlaybackControllable(null), false);

  assert.equal(getPlaybackNote(null, PLAYBACK_STATUS.IDLE), "Keep this tab open for playback.");
  assert.equal(
    getPlaybackNote({ type: "direct", label: "finale.mp3" }, PLAYBACK_STATUS.BLOCKED),
    "Playback was blocked. Press play in the browser controls.",
  );
  assert.equal(
    getPlaybackNote({ type: "youtube", label: "YouTube: abc123xyz" }, PLAYBACK_STATUS.PLAYING),
    "Timer complete. Your YouTube video is ready to play.",
  );
  assert.equal(
    getPlaybackNote({ type: "youtube", label: "YouTube: abc123xyz" }, PLAYBACK_STATUS.STOPPED),
    "Playback stopped. Replay to start your YouTube video again.",
  );
}
