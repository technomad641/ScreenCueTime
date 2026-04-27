import React, { useEffect, useRef, useState } from "react";
import PlaybackPanel from "./PlaybackPanel";
import { getPlaybackNote, PLAYBACK_STATUS } from "./playback";
import { classifySongLink, formatTime } from "./timerUtils";

const APP_COPY = {
  idleHeadline: "Time left",
  finishedHeadline: "Time is up",
  idleNote: "Keep this tab open for playback.",
};

const TIMER_PHASE = {
  IDLE: "idle",
  RUNNING: "running",
  FINISHED: "finished",
};

const INITIAL_TIMER_FORM = {
  hours: "0",
  minutes: "5",
  seconds: "0",
  songLink: "",
};

function App() {
  const [timerForm, setTimerForm] = useState(INITIAL_TIMER_FORM);
  const [targetTimeMs, setTargetTimeMs] = useState(null);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [validationMessage, setValidationMessage] = useState("");
  const [screenHeadline, setScreenHeadline] = useState(APP_COPY.idleHeadline);
  const [timerPhase, setTimerPhase] = useState(TIMER_PHASE.IDLE);
  const [playbackSource, setPlaybackSource] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState(PLAYBACK_STATUS.IDLE);
  const [showManualAudioControls, setShowManualAudioControls] = useState(false);
  const audioRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const isTimerActive = timerPhase === TIMER_PHASE.RUNNING;
  const isTimerFinished = timerPhase === TIMER_PHASE.FINISHED;
  const isDirectPlayback = playbackSource?.type === "direct";
  const isYouTubePlayback = playbackSource?.type === "youtube";
  const shouldShowSetup = timerPhase === TIMER_PHASE.IDLE;
  const shouldShowCountdown = timerPhase !== TIMER_PHASE.IDLE;

  useEffect(() => {
    if (timerPhase !== TIMER_PHASE.RUNNING || !targetTimeMs) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const remainingMs = targetTimeMs - Date.now();
      setDisplayTime(formatTime(remainingMs));

      if (remainingMs > 0) {
        return;
      }

      window.clearInterval(intervalId);
      setDisplayTime("00:00:00");
      setScreenHeadline(APP_COPY.finishedHeadline);
      setTimerPhase(TIMER_PHASE.FINISHED);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [targetTimeMs, timerPhase]);

  useEffect(() => {
    if (timerPhase !== TIMER_PHASE.FINISHED || !playbackSource) {
      return;
    }

    if (isYouTubePlayback) {
      setPlaybackStatus(PLAYBACK_STATUS.PLAYING);
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.src = playbackSource.src;
    audio.play()
      .then(() => {
        setPlaybackStatus(PLAYBACK_STATUS.PLAYING);
      })
      .catch(() => {
        setShowManualAudioControls(true);
        setPlaybackStatus(PLAYBACK_STATUS.BLOCKED);
      });
  }, [isYouTubePlayback, playbackSource, timerPhase]);

  function sendYouTubeCommand(func, args = []) {
    const playerWindow = youtubePlayerRef.current?.contentWindow;
    if (!playerWindow) {
      return;
    }

    playerWindow.postMessage(JSON.stringify({
      event: "command",
      func,
      args,
    }), "*");
  }

  function stopPlayback({ unload = false } = {}) {
    if (isYouTubePlayback) {
      if (!unload) {
        sendYouTubeCommand("stopVideo");
      }
      setPlaybackStatus(playbackSource ? PLAYBACK_STATUS.STOPPED : PLAYBACK_STATUS.IDLE);
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (unload) {
        audio.removeAttribute("src");
        audio.load();
      }
    }
    setShowManualAudioControls(false);
    setPlaybackStatus(playbackSource ? PLAYBACK_STATUS.STOPPED : PLAYBACK_STATUS.IDLE);
  }

  function playPlayback() {
    if (isYouTubePlayback) {
      sendYouTubeCommand("playVideo");
      setPlaybackStatus(PLAYBACK_STATUS.PLAYING);
      return;
    }

    if (!isDirectPlayback) {
      return;
    }

    const audio = audioRef.current;
    if (!audio || !playbackSource) {
      return;
    }

    if (audio.src !== playbackSource.src) {
      audio.src = playbackSource.src;
    }

    audio.play()
      .then(() => {
        setPlaybackStatus(PLAYBACK_STATUS.PLAYING);
      })
      .catch(() => {
        setShowManualAudioControls(true);
        setPlaybackStatus(PLAYBACK_STATUS.BLOCKED);
      });
  }

  function pausePlayback() {
    if (isYouTubePlayback) {
      sendYouTubeCommand("pauseVideo");
      setPlaybackStatus(PLAYBACK_STATUS.PAUSED);
      return;
    }

    if (!isDirectPlayback) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setPlaybackStatus(PLAYBACK_STATUS.PAUSED);
  }

  function replayPlayback() {
    if (isYouTubePlayback) {
      sendYouTubeCommand("seekTo", [0, true]);
      sendYouTubeCommand("playVideo");
      setPlaybackStatus(PLAYBACK_STATUS.PLAYING);
      return;
    }

    if (!isDirectPlayback) {
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
    }

    playPlayback();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setTimerForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function resetTimer() {
    stopPlayback({ unload: true });
    setTimerForm(INITIAL_TIMER_FORM);
    setTargetTimeMs(null);
    setDisplayTime("00:00:00");
    setValidationMessage("");
    setScreenHeadline(APP_COPY.idleHeadline);
    setTimerPhase(TIMER_PHASE.IDLE);
    setPlaybackSource(null);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const hours = Number.parseInt(timerForm.hours || "0", 10);
    const minutes = Number.parseInt(timerForm.minutes || "0", 10);
    const seconds = Number.parseInt(timerForm.seconds || "0", 10);
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    if (totalSeconds <= 0) {
      setValidationMessage("Enter a timer greater than zero.");
      return;
    }

    const resolvedPlaybackSource = classifySongLink(timerForm.songLink.trim());
    if (!resolvedPlaybackSource) {
      setValidationMessage("Enter a valid direct media URL or YouTube link.");
      return;
    }

    stopPlayback({ unload: true });
    const nextTargetTimeMs = Date.now() + (totalSeconds * 1000);
    setValidationMessage("");
    setPlaybackSource(resolvedPlaybackSource);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
    setTargetTimeMs(nextTargetTimeMs);
    setDisplayTime(formatTime(totalSeconds * 1000));
    setScreenHeadline(APP_COPY.idleHeadline);
    setTimerPhase(TIMER_PHASE.RUNNING);
  }

  const screenNote = getPlaybackNote(playbackSource, playbackStatus);

  return (
    <main className="app-shell">
      {shouldShowSetup && (
        <section className="setup-card">
          <p className="eyebrow">Timer Setup</p>
          <h1>Fill the screen with a countdown, then trigger your song.</h1>
          <form className="timer-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Hours</span>
              <input type="number" name="hours" min="0" max="23" value={timerForm.hours} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Minutes</span>
              <input type="number" name="minutes" min="0" max="59" value={timerForm.minutes} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Seconds</span>
              <input type="number" name="seconds" min="0" max="59" value={timerForm.seconds} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field field-wide">
              <span>Song Link</span>
              <input
                type="url"
                name="songLink"
                value={timerForm.songLink}
                onChange={handleChange}
                placeholder="https://example.com/song.mp3 or https://www.youtube.com/watch?v=..."
                required
              />
            </label>
            <p className="hint">Direct audio/video URLs work best. YouTube links are supported in the embedded player.</p>
            <p className="form-status" aria-live="polite">{validationMessage}</p>
            <button type="submit" className="primary-button">Start Timer</button>
          </form>
        </section>
      )}

      {shouldShowCountdown && (
        <section className="countdown-screen" aria-live="polite">
          <div className="countdown-meta">
            <p className="eyebrow">{isTimerActive ? "Timer Running" : "Timer Finished"}</p>
            <button type="button" className="ghost-button" onClick={resetTimer}>Reset</button>
          </div>
          <div className="countdown-content">
            <p className="countdown-label">{screenHeadline}</p>
            <div className="countdown-value">{displayTime}</div>
            <p className="countdown-note">{screenNote}</p>
            {isTimerFinished && playbackSource && (
              <PlaybackPanel
                playbackSource={playbackSource}
                playbackStatus={playbackStatus}
                note={screenNote}
                controlsDisabled={false}
                onPlay={playPlayback}
                onPause={pausePlayback}
                onStop={stopPlayback}
                onReplay={replayPlayback}
              >
                {isDirectPlayback && (
                  <audio
                    ref={audioRef}
                    preload="auto"
                    controls
                    onEnded={() => setPlaybackStatus(PLAYBACK_STATUS.ENDED)}
                    onPlay={() => setPlaybackStatus(PLAYBACK_STATUS.PLAYING)}
                    onPause={() => {
                      if (playbackStatus === PLAYBACK_STATUS.PLAYING) {
                        setPlaybackStatus(PLAYBACK_STATUS.PAUSED);
                      }
                    }}
                    className="playback-panel__native-player"
                  />
                )}
                {isYouTubePlayback && (
                  <iframe
                    ref={youtubePlayerRef}
                    className="playback-panel__video-frame"
                    src={playbackSource.src}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={playbackSource.label}
                  />
                )}
              </PlaybackPanel>
            )}
          </div>
        </section>
      )}

      {!isTimerFinished && (
        <audio
          ref={audioRef}
          preload="auto"
          controls={showManualAudioControls}
          onEnded={() => setPlaybackStatus(PLAYBACK_STATUS.ENDED)}
          onPlay={() => setPlaybackStatus(PLAYBACK_STATUS.PLAYING)}
          onPause={() => {
            if (playbackStatus === PLAYBACK_STATUS.PLAYING) {
              setPlaybackStatus(PLAYBACK_STATUS.PAUSED);
            }
          }}
          className={showManualAudioControls ? "audio-player" : "hidden-player"}
        />
      )}
    </main>
  );
}

export default App;
