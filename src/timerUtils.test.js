import assert from "node:assert/strict";
import { classifySongLink, formatTime, parseYouTubeLink } from "./timerUtils.js";

export default function runTimerUtilsTests() {
  assert.equal(parseYouTubeLink("https://www.youtube.com/watch?v=abc123xyz"), "abc123xyz");
  assert.equal(parseYouTubeLink("https://youtu.be/abc123xyz"), "abc123xyz");
  assert.equal(parseYouTubeLink("https://www.youtube.com/embed/abc123xyz"), "abc123xyz");
  assert.equal(parseYouTubeLink("https://notyoutube.com/watch?v=abc123xyz"), null);
  assert.equal(parseYouTubeLink("https://evil-youtu.be.example.com/abc123xyz"), null);
  assert.equal(parseYouTubeLink("not a url"), null);

  assert.deepEqual(classifySongLink("https://www.youtube.com/watch?v=abc123xyz"), {
    label: "YouTube: abc123xyz",
    type: "youtube",
    videoId: "abc123xyz",
    src: "https://www.youtube.com/embed/abc123xyz?autoplay=1&controls=1&rel=0",
  });

  assert.deepEqual(classifySongLink("https://cdn.example.com/finale.mp3"), {
    label: "finale.mp3",
    type: "direct",
    src: "https://cdn.example.com/finale.mp3",
  });

  assert.deepEqual(classifySongLink("https://cdn.example.com/audio/finale.mp3?download=1"), {
    label: "finale.mp3",
    type: "direct",
    src: "https://cdn.example.com/audio/finale.mp3?download=1",
  });

  assert.equal(classifySongLink("https://example.com"), null);
  assert.equal(classifySongLink("https://example.com/landing-page"), null);
  assert.equal(classifySongLink("ftp://example.com/finale.mp3"), null);

  assert.equal(formatTime(3_723_000), "01:02:03");
  assert.equal(formatTime(250), "00:00:01");
  assert.equal(formatTime(-50), "00:00:00");
}
