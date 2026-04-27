import React from "react";
import { getPlaybackStatusLabel, getPlaybackTypeLabel } from "./playback";

function PlaybackPanel({
  playbackSource,
  playbackStatus,
  note,
  controlsDisabled,
  onPlay,
  onPause,
  onStop,
  onReplay,
  children,
}) {
  if (!playbackSource) {
    return null;
  }

  const playButtonLabel = playbackStatus === "blocked" ? "Play Now" : "Play";

  return (
    <section className="playback-panel" aria-label="Playback panel">
      <div className="playback-panel__header">
        <div>
          <p className="eyebrow">Now Ready</p>
          <h2 className="playback-panel__title">{playbackSource.label}</h2>
        </div>
        <div className="playback-badges">
          <span className="playback-badge">{getPlaybackTypeLabel(playbackSource.type)}</span>
          <span className="playback-badge playback-badge--status">{getPlaybackStatusLabel(playbackStatus)}</span>
        </div>
      </div>
      <p className="playback-panel__note">{note}</p>
      <div className="playback-controls">
        <button type="button" className="ghost-button" onClick={onPlay} disabled={controlsDisabled}>{playButtonLabel}</button>
        <button type="button" className="ghost-button" onClick={onPause} disabled={controlsDisabled}>Pause</button>
        <button type="button" className="ghost-button" onClick={onStop} disabled={controlsDisabled}>Stop</button>
        <button type="button" className="primary-button playback-controls__replay" onClick={onReplay} disabled={controlsDisabled}>Replay</button>
      </div>
      {children}
    </section>
  );
}

export default PlaybackPanel;
