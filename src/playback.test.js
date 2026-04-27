import { describe, expect, it } from "vitest";
import { getPlaybackNote, PLAYBACK_STATUS } from "./playback";

describe("getPlaybackNote", () => {
  it("returns the idle note when there is no source", () => {
    expect(getPlaybackNote(null, PLAYBACK_STATUS.IDLE)).toBe("Keep this tab open for playback.");
  });

  it("returns a direct-media blocked note", () => {
    expect(getPlaybackNote({ type: "direct", label: "finale.mp3" }, PLAYBACK_STATUS.BLOCKED))
      .toBe("Playback was blocked. Press play in the browser controls.");
  });

  it("returns a YouTube playing note", () => {
    expect(getPlaybackNote({ type: "youtube", label: "YouTube: abc123xyz" }, PLAYBACK_STATUS.PLAYING))
      .toBe("Timer complete. Your YouTube video is ready to play.");
  });

  it("returns a YouTube stopped note", () => {
    expect(getPlaybackNote({ type: "youtube", label: "YouTube: abc123xyz" }, PLAYBACK_STATUS.STOPPED))
      .toBe("Playback stopped. Replay to start your YouTube video again.");
  });
});
