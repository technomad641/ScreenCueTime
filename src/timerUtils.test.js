import { describe, expect, it } from "vitest";
import { classifySongLink, formatTime, parseYouTubeLink } from "./timerUtils";

describe("parseYouTubeLink", () => {
  it("extracts IDs from watch URLs", () => {
    expect(parseYouTubeLink("https://www.youtube.com/watch?v=abc123xyz")).toBe("abc123xyz");
  });

  it("extracts IDs from short URLs", () => {
    expect(parseYouTubeLink("https://youtu.be/abc123xyz")).toBe("abc123xyz");
  });

  it("extracts IDs from embed URLs", () => {
    expect(parseYouTubeLink("https://www.youtube.com/embed/abc123xyz")).toBe("abc123xyz");
  });

  it("rejects lookalike domains", () => {
    expect(parseYouTubeLink("https://notyoutube.com/watch?v=abc123xyz")).toBeNull();
    expect(parseYouTubeLink("https://evil-youtu.be.example.com/abc123xyz")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseYouTubeLink("not a url")).toBeNull();
  });
});

describe("classifySongLink", () => {
  it("classifies YouTube links as embedded playback", () => {
    expect(classifySongLink("https://www.youtube.com/watch?v=abc123xyz")).toEqual({
      label: "YouTube: abc123xyz",
      type: "youtube",
      videoId: "abc123xyz",
      src: "https://www.youtube.com/embed/abc123xyz?autoplay=1&controls=1&rel=0",
    });
  });

  it("classifies direct media links by supported extension", () => {
    expect(classifySongLink("https://cdn.example.com/finale.mp3")).toEqual({
      label: "finale.mp3",
      type: "direct",
      src: "https://cdn.example.com/finale.mp3",
    });
  });

  it("derives labels from nested direct media paths", () => {
    expect(classifySongLink("https://cdn.example.com/audio/finale.mp3?download=1")).toEqual({
      label: "finale.mp3",
      type: "direct",
      src: "https://cdn.example.com/audio/finale.mp3?download=1",
    });
  });

  it("rejects generic web pages", () => {
    expect(classifySongLink("https://example.com")).toBeNull();
    expect(classifySongLink("https://example.com/landing-page")).toBeNull();
  });

  it("rejects unsupported protocols", () => {
    expect(classifySongLink("ftp://example.com/finale.mp3")).toBeNull();
  });
});

describe("formatTime", () => {
  it("formats hours, minutes, and seconds", () => {
    expect(formatTime(3_723_000)).toBe("01:02:03");
  });

  it("rounds partial seconds up while time remains", () => {
    expect(formatTime(250)).toBe("00:00:01");
  });

  it("clamps negative time to zero", () => {
    expect(formatTime(-50)).toBe("00:00:00");
  });
});
