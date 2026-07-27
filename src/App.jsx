import React, { useEffect, useRef, useState } from "react";
import PlaybackPanel from "./PlaybackPanel";
import { createChime } from "./cue";
import { getPlaybackNote, PLAYBACK_STATUS } from "./playback";
import {
  TIMER_PRESETS,
  formatDurationLabel,
  loadRecentTimers,
  saveRecentTimer,
} from "./presets";
import { decodeTimerConfig, encodeTimerConfig } from "./shareLink";
import { classifySongLink, formatTime } from "./timerUtils";

const APP_COPY = {
  idleHeadline: "Time left",
  finishedHeadline: "Time is up",
  idleNote: "Keep this tab open for playback.",
};

const TIMER_PHASE = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  FINISHED: "finished",
};

const INITIAL_TIMER_FORM = {
  hours: "0",
  minutes: "5",
  seconds: "0",
  songLink: "",
};

const INITIAL_MEDIA_TEST = { status: "idle", message: "" };
const FLASH_DURATION_MS = 2600;
const MEDIA_TEST_TIMEOUT_MS = 8000;

function App() {
  const [timerForm, setTimerForm] = useState(INITIAL_TIMER_FORM);
  const [targetTimeMs, setTargetTimeMs] = useState(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(null);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [validationMessage, setValidationMessage] = useState("");
  const [screenHeadline, setScreenHeadline] = useState(APP_COPY.idleHeadline);
  const [timerPhase, setTimerPhase] = useState(TIMER_PHASE.IDLE);
  const [playbackSource, setPlaybackSource] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState(PLAYBACK_STATUS.IDLE);
  const [showManualAudioControls, setShowManualAudioControls] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [recentTimers, setRecentTimers] = useState([]);
  const [mediaTest, setMediaTest] = useState(INITIAL_MEDIA_TEST);
  const [shareFeedback, setShareFeedback] = useState("");
  const audioRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const chimeRef = useRef(null);
  const isTimerRunning = timerPhase === TIMER_PHASE.RUNNING;
  const isTimerPaused = timerPhase === TIMER_PHASE.PAUSED;
  const isTimerFinished = timerPhase === TIMER_PHASE.FINISHED;
  const isDirectPlayback = playbackSource?.type === "direct";
  const isYouTubePlayback = playbackSource?.type === "youtube";
  const shouldShowSetup = timerPhase === TIMER_PHASE.IDLE;
  const shouldShowCountdown = timerPhase !== TIMER_PHASE.IDLE;

  function getStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  function getChime() {
    if (!chimeRef.current) {
      chimeRef.current = createChime();
    }
    return chimeRef.current;
  }

  // On first load, prefill from a shared link (if present) and restore the
  // recently-used timer history.
  useEffect(() => {
    const shared = decodeTimerConfig(window.location.search);
    if (shared) {
      setTimerForm((currentForm) => ({ ...currentForm, ...shared }));
    }
    setRecentTimers(loadRecentTimers(getStorage()));
  }, []);

  useEffect(() => {
    return () => {
      chimeRef.current?.close();
    };
  }, []);

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

  // Fire the media-independent finish cue (chime + screen flash) as soon as the
  // countdown completes, regardless of whether media playback succeeds.
  useEffect(() => {
    if (timerPhase !== TIMER_PHASE.FINISHED) {
      return undefined;
    }

    getChime().play();
    setIsFlashing(true);
    const timeoutId = window.setTimeout(() => setIsFlashing(false), FLASH_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [timerPhase]);

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
    if (name === "songLink") {
      setMediaTest(INITIAL_MEDIA_TEST);
    }
  }

  function applyPreset(preset) {
    setTimerForm((currentForm) => ({
      ...currentForm,
      hours: String(preset.hours),
      minutes: String(preset.minutes),
      seconds: String(preset.seconds),
    }));
    setValidationMessage("");
  }

  function applyRecent(entry) {
    setTimerForm({
      hours: String(entry.hours),
      minutes: String(entry.minutes),
      seconds: String(entry.seconds),
      songLink: entry.songLink,
    });
    setValidationMessage("");
    setMediaTest(INITIAL_MEDIA_TEST);
  }

  function handleTestMedia() {
    const link = timerForm.songLink.trim();
    const source = classifySongLink(link);

    if (!source) {
      setMediaTest({ status: "error", message: "Enter a valid direct media URL or YouTube link." });
      return;
    }

    if (source.type === "youtube") {
      setMediaTest({
        status: "success",
        message: `YouTube link looks valid (${source.label}). It will embed when the timer ends.`,
      });
      return;
    }

    setMediaTest({ status: "testing", message: "Testing media…" });

    const probe = new Audio();
    probe.preload = "auto";
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      probe.removeAttribute("src");
      setMediaTest(result);
    };

    const timeoutId = window.setTimeout(() => {
      finish({
        status: "error",
        message: "Media took too long to respond. It may still work, but double-check the link.",
      });
    }, MEDIA_TEST_TIMEOUT_MS);

    probe.addEventListener("loadedmetadata", () => {
      finish({ status: "success", message: `Media loaded and is ready (${source.label}).` });
    });
    probe.addEventListener("error", () => {
      finish({ status: "error", message: "We could not load this media URL. Check the link or its CORS settings." });
    });

    probe.src = source.src;
    probe.load();
  }

  async function handleShareLink() {
    const query = encodeTimerConfig(timerForm);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Shareable link copied to clipboard.");
    } catch {
      window.history.replaceState(null, "", shareUrl);
      setShareFeedback("Link ready in the address bar — copy it to share.");
    }
  }

  function pauseCountdown() {
    if (timerPhase !== TIMER_PHASE.RUNNING || !targetTimeMs) {
      return;
    }

    const remainingMs = Math.max(0, targetTimeMs - Date.now());
    setPausedRemainingMs(remainingMs);
    setDisplayTime(formatTime(remainingMs));
    setScreenHeadline("Paused");
    setTimerPhase(TIMER_PHASE.PAUSED);
  }

  function resumeCountdown() {
    if (timerPhase !== TIMER_PHASE.PAUSED || pausedRemainingMs == null) {
      return;
    }

    setTargetTimeMs(Date.now() + pausedRemainingMs);
    setPausedRemainingMs(null);
    setScreenHeadline(APP_COPY.idleHeadline);
    setTimerPhase(TIMER_PHASE.RUNNING);
  }

  function resetTimer() {
    stopPlayback({ unload: true });
    setTimerForm(INITIAL_TIMER_FORM);
    setTargetTimeMs(null);
    setPausedRemainingMs(null);
    setDisplayTime("00:00:00");
    setValidationMessage("");
    setScreenHeadline(APP_COPY.idleHeadline);
    setTimerPhase(TIMER_PHASE.IDLE);
    setPlaybackSource(null);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
    setIsFlashing(false);
    setMediaTest(INITIAL_MEDIA_TEST);
    setShareFeedback("");
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

    // Unlock the finish chime while we still have the user's click gesture.
    getChime().prime();

    stopPlayback({ unload: true });
    const nextTargetTimeMs = Date.now() + (totalSeconds * 1000);
    setValidationMessage("");
    setPlaybackSource(resolvedPlaybackSource);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
    setTargetTimeMs(nextTargetTimeMs);
    setPausedRemainingMs(null);
    setDisplayTime(formatTime(totalSeconds * 1000));
    setScreenHeadline(APP_COPY.idleHeadline);
    setTimerPhase(TIMER_PHASE.RUNNING);
    setRecentTimers(saveRecentTimer(getStorage(), timerForm));
  }

  const screenNote = getPlaybackNote(playbackSource, playbackStatus);
  const runningEyebrow = isTimerPaused
    ? "Timer Paused"
    : isTimerRunning
      ? "Timer Running"
      : "Timer Finished";

  return (
    <main className="app-shell">
      {shouldShowSetup && (
        <section className="setup-card">
          <p className="eyebrow">Timer Setup</p>
          <h1>Fill the screen with a countdown, then trigger your song.</h1>
          <form className="timer-form" onSubmit={handleSubmit}>
            <div className="preset-row field-wide">
              <span className="preset-row__label">Quick presets</span>
              <div className="preset-buttons">
                {TIMER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="chip-button"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
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
            <div className="media-test field-wide">
              <button type="button" className="ghost-button" onClick={handleTestMedia} disabled={mediaTest.status === "testing"}>
                {mediaTest.status === "testing" ? "Testing…" : "Test Media"}
              </button>
              <p className={`media-test__status media-test__status--${mediaTest.status}`} aria-live="polite">
                {mediaTest.message}
              </p>
            </div>
            <p className="hint">Direct audio/video URLs work best. YouTube links are supported in the embedded player.</p>
            <p className="form-status" aria-live="polite">{validationMessage}</p>
            <div className="setup-actions field-wide">
              <button type="submit" className="primary-button setup-actions__start">Start Timer</button>
              <button type="button" className="ghost-button" onClick={handleShareLink}>Copy Shareable Link</button>
            </div>
            <p className="share-feedback field-wide" aria-live="polite">{shareFeedback}</p>
          </form>

          {recentTimers.length > 0 && (
            <div className="recents">
              <p className="eyebrow">Recent timers</p>
              <div className="recents__list">
                {recentTimers.map((entry) => {
                  const media = classifySongLink(entry.songLink);
                  return (
                    <button
                      key={`${entry.hours}:${entry.minutes}:${entry.seconds}|${entry.songLink}`}
                      type="button"
                      className="recents__item"
                      onClick={() => applyRecent(entry)}
                    >
                      <span className="recents__duration">{formatDurationLabel(entry.hours, entry.minutes, entry.seconds)}</span>
                      <span className="recents__media">{media ? media.label : "No media"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {shouldShowCountdown && (
        <section className={`countdown-screen${isFlashing ? " countdown-screen--flash" : ""}`} aria-live="polite">
          {isFlashing && <div className="finish-flash" aria-hidden="true" />}
          <div className="countdown-meta">
            <p className="eyebrow">{runningEyebrow}</p>
            <div className="countdown-actions">
              {isTimerRunning && (
                <button type="button" className="ghost-button" onClick={pauseCountdown}>Pause</button>
              )}
              {isTimerPaused && (
                <button type="button" className="ghost-button" onClick={resumeCountdown}>Resume</button>
              )}
              <button type="button" className="ghost-button" onClick={resetTimer}>Reset</button>
            </div>
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
