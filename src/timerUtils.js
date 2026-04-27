const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const DIRECT_MEDIA_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".oga",
  ".m4a",
  ".aac",
  ".flac",
  ".opus",
  ".mp4",
  ".m4v",
  ".webm",
  ".mpeg",
  ".mpg",
];

function isSupportedDirectMediaUrl(url) {
  if (!["http:", "https:"].includes(url.protocol)) {
    return false;
  }

  const pathname = url.pathname.toLowerCase();
  return DIRECT_MEDIA_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function deriveDirectMediaLabel(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] || url.hostname;
}

export function parseYouTubeLink(input) {
  try {
    const url = new URL(input);
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }

    if (url.hostname.toLowerCase().endsWith("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2] || null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

export function classifySongLink(input) {
  const youtubeId = parseYouTubeLink(input);
  if (youtubeId) {
    return {
      label: `YouTube: ${youtubeId}`,
      type: "youtube",
      videoId: youtubeId,
      src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0`,
    };
  }

  try {
    const url = new URL(input);

    if (!isSupportedDirectMediaUrl(url)) {
      return null;
    }

    return {
      label: deriveDirectMediaLabel(url),
      type: "direct",
      src: url.toString(),
    };
  } catch {
    return null;
  }
}

export function formatTime(msRemaining) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
