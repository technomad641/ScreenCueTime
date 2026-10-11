import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import CountdownDisplay from "./CountdownDisplay";
import PlaybackPanel from "./PlaybackPanel";
import ProgressRing from "./ProgressRing";
import ThemeToggle from "./ThemeToggle";
import { createChime } from "./cue";
import { getPlaybackNote, PLAYBACK_STATUS } from "./playback";
import {
  TIMER_PRESETS,
  formatDurationLabel,
  loadRecentTimers,
  saveRecentTimer,
} from "./presets";
import { decodeTimerConfig, encodeTimerConfig } from "./shareLink";
import { THEME, loadTheme, nextTheme, resolveTheme, saveTheme } from "./theme";
import { classifySongLink, formatTime } from "./timerUtils";
import { runViewTransition } from "./viewTransition";

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
const CONTROLS_IDLE_MS = 2800;

function App() {
  const [timerForm, setTimerForm] = useState(INITIAL_TIMER_FORM);
  const [targetTimeMs, setTargetTimeMs] = useState(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(null);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [remainingFraction, setRemainingFraction] = useState(1);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [announcement, setAnnouncement] = useState("");
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
  const [themePreference, setThemePreference] = useState(THEME.SYSTEM);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const audioRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const chimeRef = useRef(null);
  const countdownRef = useRef(null);
  const lastAnnouncedRef = useRef(null);
  const isTimerRunning = timerPhase === TIMER_PHASE.RUNNING;
  const isTimerPaused = timerPhase === TIMER_PHASE.PAUSED;
  const isTimerFinished = timerPhase === TIMER_PHASE.FINISHED;
  const isDirectPlayback = playbackSource?.type === "direct";
  const isYouTubePlayback = playbackSource?.type === "youtube";
  const shouldShowSetup = timerPhase === TIMER_PHASE.IDLE;
  const shouldShowCountdown = timerPhase !== TIMER_PHASE.IDLE;
  const metaHidden = controlsHidden && (isTimerRunning || isTimerPaused);

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

  // Run a phase change as an animated View Transition. flushSync forces React to
  // commit the DOM synchronously inside the transition callback so the API can
  // snapshot before/after; runViewTransition no-ops the animation when the API
  // is unavailable or the user prefers reduced motion.
  function transition(apply) {
    runViewTransition(() => flushSync(apply));
  }

  // On first load, prefill from a shared link (if present), restore the
  // recently-used timer history, and restore the saved theme preference.
  useEffect(() => {
    const shared = decodeTimerConfig(window.location.search);
    if (shared) {
      setTimerForm((currentForm) => ({ ...currentForm, ...shared }));
    }
    setRecentTimers(loadRecentTimers(getStorage()));
    setThemePreference(loadTheme(getStorage()));
  }, []);

  useEffect(() => {
    return () => {
      chimeRef.current?.close();
    };
  }, []);

  // Paint the resolved theme onto the document root, and keep following the OS
  // while the preference is "system".
  useEffect(() => {
    const root = document.documentElement;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.setAttribute("data-theme", resolveTheme(themePreference, query.matches));
    };
    apply();
    query.addEventListener?.("change", apply);
    return () => query.removeEventListener?.("change", apply);
  }, [themePreference]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Auto-hide the on-screen controls after a short idle while the countdown is
  // running or paused, so presenter mode stays uncluttered; any input reveals
  // them again. Controls never hide once the timer has finished.
  useEffect(() => {
    if (!isTimerRunning && !isTimerPaused) {
      setControlsHidden(false);
      return undefined;
    }

    let timeoutId;
    const reveal = () => {
      setControlsHidden(false);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setControlsHidden(true), CONTROLS_IDLE_MS);
    };

    reveal();
    window.addEventListener("mousemove", reveal);
    window.addEventListener("keydown", reveal);
    window.addEventListener("touchstart", reveal, { passive: true });
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("keydown", reveal);
      window.removeEventListener("touchstart", reveal);
    };
  }, [isTimerRunning, isTimerPaused]);

  // Move focus to the countdown region when it takes over the screen so keyboard
  // and screen-reader users land in the right place.
  useEffect(() => {
    if (timerPhase === TIMER_PHASE.RUNNING) {
      countdownRef.current?.focus({ preventScroll: true });
    }
  }, [timerPhase]);

  // Space toggles pause/resume, except when a form control or button is focused
  // (there the key already has its own meaning).
  useEffect(() => {
    if (!isTimerRunning && !isTimerPaused) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.code !== "Space" && event.key !== " ") {
        return;
      }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || tag === "SELECT") {
        return;
      }
      event.preventDefault();
      if (isTimerRunning) {
        pauseCountdown();
      } else {
        resumeCountdown();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, isTimerPaused, targetTimeMs, pausedRemainingMs, totalDurationMs]);

  useEffect(() => {
    if (timerPhase !== TIMER_PHASE.RUNNING || !targetTimeMs) {
      return undefined;
    }

    const tick = () => {
      const remainingMs = targetTimeMs - Date.now();
      setDisplayTime(formatTime(remainingMs));
      setRemainingFraction(totalDurationMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalDurationMs)) : 0);
      announceRemaining(remainingMs);

      if (remainingMs > 0) {
        return;
      }

      window.clearInterval(intervalId);
      setDisplayTime("00:00:00");
      setRemainingFraction(0);
      setScreenHeadline(APP_COPY.finishedHeadline);
      setAnnouncement("Time is up.");
      transition(() => setTimerPhase(TIMER_PHASE.FINISHED));
    };

    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTimeMs, timerPhase, totalDurationMs]);

  // Fire the media-independent finish cue (chime + screen bloom) as soon as the
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

  // Announce the remaining time politely at meaningful moments only: every 15s
  // milestone and each of the final ten seconds — never on every 250ms tick.
  function announceRemaining(remainingMs) {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const atMilestone = totalSeconds > 0 && (totalSeconds <= 10 || totalSeconds % 15 === 0);
    if (!atMilestone || lastAnnouncedRef.current === totalSeconds) {
      return;
    }
    lastAnnouncedRef.current = totalSeconds;
    setAnnouncement(`${formatTime(totalSeconds * 1000)} remaining.`);
  }

  function cycleTheme() {
    const next = nextTheme(themePreference);
    saveTheme(getStorage(), next);
    setThemePreference(next);
  }

  function toggleFullscreen() {
    const target = countdownRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

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
    setRemainingFraction(totalDurationMs > 0 ? Math.min(1, remainingMs / totalDurationMs) : 0);
    setScreenHeadline("Paused");
    setAnnouncement("Paused.");
    transition(() => setTimerPhase(TIMER_PHASE.PAUSED));
  }

  function resumeCountdown() {
    if (timerPhase !== TIMER_PHASE.PAUSED || pausedRemainingMs == null) {
      return;
    }

    setTargetTimeMs(Date.now() + pausedRemainingMs);
    setPausedRemainingMs(null);
    setScreenHeadline(APP_COPY.idleHeadline);
    setAnnouncement("Resumed.");
    lastAnnouncedRef.current = null;
    transition(() => setTimerPhase(TIMER_PHASE.RUNNING));
  }

  function resetTimer() {
    stopPlayback({ unload: true });
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setTargetTimeMs(null);
    setPausedRemainingMs(null);
    setTotalDurationMs(0);
    setRemainingFraction(1);
    setDisplayTime("00:00:00");
    setValidationMessage("");
    setScreenHeadline(APP_COPY.idleHeadline);
    setPlaybackSource(null);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
    setIsFlashing(false);
    setMediaTest(INITIAL_MEDIA_TEST);
    setShareFeedback("");
    setAnnouncement("");
    lastAnnouncedRef.current = null;
    transition(() => {
      setTimerForm(INITIAL_TIMER_FORM);
      setTimerPhase(TIMER_PHASE.IDLE);
    });
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
    const durationMs = totalSeconds * 1000;
    const nextTargetTimeMs = Date.now() + durationMs;
    setValidationMessage("");
    setPlaybackSource(resolvedPlaybackSource);
    setPlaybackStatus(PLAYBACK_STATUS.IDLE);
    setTargetTimeMs(nextTargetTimeMs);
    setPausedRemainingMs(null);
    setTotalDurationMs(durationMs);
    setRemainingFraction(1);
    setDisplayTime(formatTime(durationMs));
    setScreenHeadline(APP_COPY.idleHeadline);
    setAnnouncement(`Timer started. ${formatTime(durationMs)} remaining.`);
    lastAnnouncedRef.current = null;
    setRecentTimers(saveRecentTimer(getStorage(), timerForm));
    transition(() => setTimerPhase(TIMER_PHASE.RUNNING));
  }

  const screenNote = getPlaybackNote(playbackSource, playbackStatus);
  const runningEyebrow = isTimerPaused
    ? "Paused"
    : isTimerRunning
      ? "On air"
      : "Cue ready";

  const showProgressRing = isTimerRunning || isTimerPaused;

  return (
    <main className="app-shell">
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>

      {shouldShowSetup && (
        <section className="setup-card">
          <header className="setup-head">
            <div className="brand">
              <span className="brand__mark" aria-hidden="true" />
              <span className="brand__name">ScreenCueTime</span>
            </div>
            <ThemeToggle preference={themePreference} onCycle={cycleTheme} />
          </header>
          <p className="eyebrow">Timer setup</p>
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
            <div className="duration-grid field-wide">
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
            </div>
            <label className="field field-wide">
              <span>Song link</span>
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
                {mediaTest.status === "testing" ? "Testing…" : "Test media"}
              </button>
              <p className={`media-test__status media-test__status--${mediaTest.status}`} aria-live="polite">
                {mediaTest.message}
              </p>
            </div>
            <p className="hint">Direct audio/video URLs work best. YouTube links are supported in the embedded player.</p>
            <p className="form-status" aria-live="polite">{validationMessage}</p>
            <div className="setup-actions field-wide">
              <button type="submit" className="primary-button setup-actions__start">Start timer</button>
              <button type="button" className="ghost-button" onClick={handleShareLink}>Copy shareable link</button>
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
        <section
          ref={countdownRef}
          tabIndex={-1}
          className={[
            "countdown-screen",
            isFlashing ? "countdown-screen--flash" : "",
            metaHidden ? "countdown-screen--immersive" : "",
            isTimerFinished ? "countdown-screen--finished" : "",
          ].filter(Boolean).join(" ")}
        >
          {showProgressRing && <ProgressRing remaining={remainingFraction} />}
          {isFlashing && <div className="finish-bloom" aria-hidden="true" />}
          <div className="countdown-meta">
            <p className="eyebrow eyebrow--live">{runningEyebrow}</p>
            <div className="countdown-actions">
              {isTimerRunning && (
                <button type="button" className="ghost-button" onClick={pauseCountdown}>Pause</button>
              )}
              {isTimerPaused && (
                <button type="button" className="ghost-button" onClick={resumeCountdown}>Resume</button>
              )}
              {!isTimerFinished && (
                <button type="button" className="ghost-button" onClick={toggleFullscreen}>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </button>
              )}
              <ThemeToggle preference={themePreference} onCycle={cycleTheme} />
              <button type="button" className="ghost-button" onClick={resetTimer}>Reset</button>
            </div>
          </div>
          <div className="countdown-content">
            <p className="countdown-label">{screenHeadline}</p>
            <CountdownDisplay value={displayTime} />
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
