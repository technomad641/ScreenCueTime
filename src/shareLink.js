// Encode/decode a timer configuration (duration + song link) into URL query
// parameters so a presenter can bookmark or share a ready-to-go cue.

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function encodeTimerConfig({ hours, minutes, seconds, songLink } = {}) {
  const params = new URLSearchParams();
  params.set("h", String(clamp(toInt(hours), 0, 23)));
  params.set("m", String(clamp(toInt(minutes), 0, 59)));
  params.set("s", String(clamp(toInt(seconds), 0, 59)));

  const trimmedLink = typeof songLink === "string" ? songLink.trim() : "";
  if (trimmedLink) {
    params.set("song", trimmedLink);
  }

  return params.toString();
}

export function decodeTimerConfig(search) {
  if (!search || typeof search !== "string") {
    return null;
  }

  let params;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    return null;
  }

  const hasAny = ["h", "m", "s", "song"].some((key) => params.has(key));
  if (!hasAny) {
    return null;
  }

  return {
    hours: String(clamp(toInt(params.get("h")), 0, 23)),
    minutes: String(clamp(toInt(params.get("m")), 0, 59)),
    seconds: String(clamp(toInt(params.get("s")), 0, 59)),
    songLink: params.get("song") || "",
  };
}
