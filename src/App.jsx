import React, { useEffect, useRef, useState } from "react";

const APP_COPY = {
  idleHeadline: "Time left",
  finishedHeadline: "Time is up",
  idleNote: "Keep this tab open for playback.",
  youtubeFinishedNote: "Timer complete. Embedded player started.",
  directFinishedNote: "Timer complete. Playing your song.",
  manualPlaybackNote: "Timer complete, but autoplay was blocked. Press play in the browser.",
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

function parseYouTubeLink(input) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1) || null;
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

function classifySongLink(input) {
  const youtubeId = parseYouTubeLink(input);
  if (youtubeId) {
    return {
      type: "youtube",
      src: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0`,
    };
  }

  try {
    const url = new URL(input);
    return { type: "direct", src: url.toString() };
  } catch {
    return null;
  }
}

function formatTime(msRemaining) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function App() {
  const [timerForm, setTimerForm] = useState(INITIAL_TIMER_FORM);
  const [targetTimeMs, setTargetTimeMs] = useState(null);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [validationMessage, setValidationMessage] = useState("");
  const [screenHeadline, setScreenHeadline] = useState(APP_COPY.idleHeadline);
  const [screenNote, setScreenNote] = useState(APP_COPY.idleNote);
  const [timerPhase, setTimerPhase] = useState(TIMER_PHASE.IDLE);
  const [playbackSource, setPlaybackSource] = useState(null);
  const [showManualAudioControls, setShowManualAudioControls] = useState(false);
  const audioRef = useRef(null);
  const isTimerActive = timerPhase === TIMER_PHASE.RUNNING;
  const isTimerFinished = timerPhase === TIMER_PHASE.FINISHED;
  const shouldShowSetup = timerPhase === TIMER_PHASE.IDLE;
  const shouldShowCountdown = timerPhase !== TIMER_PHASE.IDLE;
  const shouldRenderYouTubePlayer = isTimerFinished && playbackSource?.type === "youtube";

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

    if (playbackSource.type === "youtube") {
      setScreenNote(APP_COPY.youtubeFinishedNote);
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.src = playbackSource.src;
    audio.play()
      .then(() => {
        setScreenNote(APP_COPY.directFinishedNote);
      })
      .catch(() => {
        setShowManualAudioControls(true);
        setScreenNote(APP_COPY.manualPlaybackNote);
      });
  }, [playbackSource, timerPhase]);

  function stopPlayback() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setShowManualAudioControls(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setTimerForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function resetTimer() {
    stopPlayback();
    setTimerForm(INITIAL_TIMER_FORM);
    setTargetTimeMs(null);
    setDisplayTime("00:00:00");
    setValidationMessage("");
    setScreenHeadline(APP_COPY.idleHeadline);
    setScreenNote(APP_COPY.idleNote);
    setTimerPhase(TIMER_PHASE.IDLE);
    setPlaybackSource(null);
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

    stopPlayback();
    const nextTargetTimeMs = Date.now() + (totalSeconds * 1000);
    setValidationMessage("");
    setPlaybackSource(resolvedPlaybackSource);
    setTargetTimeMs(nextTargetTimeMs);
    setDisplayTime(formatTime(totalSeconds * 1000));
    setScreenHeadline(APP_COPY.idleHeadline);
    setScreenNote(APP_COPY.idleNote);
    setTimerPhase(TIMER_PHASE.RUNNING);
  }

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
          </div>
        </section>
      )}

      <audio ref={audioRef} preload="auto" controls={showManualAudioControls} className={showManualAudioControls ? "audio-player" : "hidden-player"} />
      {shouldRenderYouTubePlayer && (
        <iframe
          className="hidden-player"
          src={playbackSource.src}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          title="YouTube player"
        />
      )}
    </main>
  );
}

export default App;
