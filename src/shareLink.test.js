import assert from "node:assert/strict";
import { decodeTimerConfig, encodeTimerConfig } from "./shareLink.js";

export default function runShareLinkTests() {
  assert.equal(
    encodeTimerConfig({ hours: "0", minutes: "5", seconds: "0", songLink: "https://x/y.mp3" }),
    "h=0&m=5&s=0&song=https%3A%2F%2Fx%2Fy.mp3",
  );

  // Out-of-range parts are clamped and an empty link is omitted.
  assert.equal(encodeTimerConfig({ hours: "99", minutes: "80", seconds: "0", songLink: "  " }), "h=23&m=59&s=0");

  const decoded = decodeTimerConfig("?h=0&m=5&s=0&song=https%3A%2F%2Fx%2Fy.mp3");
  assert.deepEqual(decoded, { hours: "0", minutes: "5", seconds: "0", songLink: "https://x/y.mp3" });

  // Works without a leading question mark.
  assert.deepEqual(decodeTimerConfig("m=10"), { hours: "0", minutes: "10", seconds: "0", songLink: "" });

  // A round trip preserves the configuration.
  const original = { hours: "1", minutes: "2", seconds: "3", songLink: "https://cdn.example.com/finale.mp3" };
  assert.deepEqual(decodeTimerConfig(encodeTimerConfig(original)), original);

  // No recognized keys means no config.
  assert.equal(decodeTimerConfig(""), null);
  assert.equal(decodeTimerConfig("?other=1"), null);
  assert.equal(decodeTimerConfig(null), null);
}
