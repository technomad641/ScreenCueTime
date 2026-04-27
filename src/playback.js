export const PLAYBACK_STATUS = {
  IDLE: "idle",
  PLAYING: "playing",
  PAUSED: "paused",
  BLOCKED: "blocked",
  STOPPED: "stopped",
  ENDED: "ended",
  FAILED: "failed",
};

export function getPlaybackTypeLabel(type) {
  if (type === "youtube") {
    return "YouTube";
  }

  return "Direct Media";
}

export function getPlaybackStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function isAppPlaybackControllable(playbackSource) {
  return playbackSource?.type === "direct";
}

export function getPlaybackNote(playbackSource, playbackStatus) {
  if (!playbackSource) {
    return "Keep this tab open for playback.";
  }

  if (playbackSource.type === "youtube") {
    switch (playbackStatus) {
      case PLAYBACK_STATUS.PLAYING:
        return "Timer complete. Your YouTube video is ready to play.";
      case PLAYBACK_STATUS.PAUSED:
        return "Playback paused. Press play to resume your YouTube video.";
      case PLAYBACK_STATUS.STOPPED:
        return "Playback stopped. Replay to start your YouTube video again.";
      case PLAYBACK_STATUS.BLOCKED:
        return "Playback was blocked. Press play to start your YouTube video.";
      case PLAYBACK_STATUS.FAILED:
        return "We could not start the YouTube video.";
      case PLAYBACK_STATUS.ENDED:
        return "Your YouTube video has ended.";
      default:
        return "Keep this tab open for playback.";
    }
  }

  switch (playbackStatus) {
    case PLAYBACK_STATUS.PLAYING:
      return "Timer complete. Playing your media.";
    case PLAYBACK_STATUS.PAUSED:
      return "Playback paused. Press play to resume.";
    case PLAYBACK_STATUS.STOPPED:
      return "Playback stopped. Replay to start again.";
    case PLAYBACK_STATUS.BLOCKED:
      return "Playback was blocked. Press play in the browser controls.";
    case PLAYBACK_STATUS.FAILED:
      return "We could not start this media file.";
    case PLAYBACK_STATUS.ENDED:
      return "Your media has finished playing.";
    default:
      return "Keep this tab open for playback.";
  }
}
