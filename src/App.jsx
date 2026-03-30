import React, { useEffect, useRef, useState } from "react";

const DEFAULT_FORM = {
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
  const [form, setForm] = useState(DEFAULT_FORM);
  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [status, setStatus] = useState("");
  const [countdownLabel, setCountdownLabel] = useState("Time left");
  const [countdownNote, setCountdownNote] = useState("Keep this tab open for playback.");
  const [isRunning, setIsRunning] = useState(false);
  const [mediaConfig, setMediaConfig] = useState(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!deadline) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const remaining = deadline - Date.now();
      setTimeLeft(formatTime(remaining));

      if (remaining > 0) {
        return;
      }

      window.clearInterval(intervalId);
      setTimeLeft("00:00:00");
      setCountdownLabel("Time is up");
      setIsRunning(false);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [deadline]);

  useEffect(() => {
    if (isRunning || !mediaConfig || deadline === null) {
      return;
    }

    if (deadline > Date.now()) {
      return;
    }

    if (mediaConfig.type === "youtube") {
      setCountdownNote("Timer complete. Embedded player started.");
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.src = mediaConfig.src;
    audio.play()
      .then(() => {
        setCountdownNote("Timer complete. Playing your song.");
      })
      .catch(() => {
        setShowAudioControls(true);
        setCountdownNote("Timer complete, but autoplay was blocked. Press play in the browser.");
      });
  }, [deadline, isRunning, mediaConfig]);

  function stopPlayback() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setShowAudioControls(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetTimer() {
    stopPlayback();
    setForm(DEFAULT_FORM);
    setDeadline(null);
    setTimeLeft("00:00:00");
    setStatus("");
    setCountdownLabel("Time left");
    setCountdownNote("Keep this tab open for playback.");
    setIsRunning(false);
    setMediaConfig(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const hours = Number.parseInt(form.hours || "0", 10);
    const minutes = Number.parseInt(form.minutes || "0", 10);
    const seconds = Number.parseInt(form.seconds || "0", 10);
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    if (totalSeconds <= 0) {
      setStatus("Enter a timer greater than zero.");
      return;
    }

    const nextMediaConfig = classifySongLink(form.songLink.trim());
    if (!nextMediaConfig) {
      setStatus("Enter a valid direct media URL or YouTube link.");
      return;
    }

    stopPlayback();
    const nextDeadline = Date.now() + (totalSeconds * 1000);
    setStatus("");
    setMediaConfig(nextMediaConfig);
    setDeadline(nextDeadline);
    setTimeLeft(formatTime(totalSeconds * 1000));
    setCountdownLabel("Time left");
    setCountdownNote("Keep this tab open for playback.");
    setIsRunning(true);
  }

  const youtubeIsActive = !isRunning && mediaConfig?.type === "youtube" && deadline !== null && deadline <= Date.now();

  return (
    <main className="app-shell">
      {!isRunning && (!mediaConfig || countdownLabel === "Time left") && (
        <section className="setup-card">
          <p className="eyebrow">Timer Setup</p>
          <h1>Fill the screen with a countdown, then trigger your song.</h1>
          <form className="timer-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Hours</span>
              <input type="number" name="hours" min="0" max="23" value={form.hours} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Minutes</span>
              <input type="number" name="minutes" min="0" max="59" value={form.minutes} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Seconds</span>
              <input type="number" name="seconds" min="0" max="59" value={form.seconds} onChange={handleChange} inputMode="numeric" />
            </label>
            <label className="field field-wide">
              <span>Song Link</span>
              <input
                type="url"
                name="songLink"
                value={form.songLink}
                onChange={handleChange}
                placeholder="https://example.com/song.mp3 or https://www.youtube.com/watch?v=..."
                required
              />
            </label>
            <p className="hint">Direct audio/video URLs work best. YouTube links are supported in the embedded player.</p>
            <p className="form-status" aria-live="polite">{status}</p>
            <button type="submit" className="primary-button">Start Timer</button>
          </form>
        </section>
      )}

      {(isRunning || mediaConfig) && (
        <section className="countdown-screen" aria-live="polite">
          <div className="countdown-meta">
            <p className="eyebrow">{isRunning ? "Timer Running" : "Timer Finished"}</p>
            <button type="button" className="ghost-button" onClick={resetTimer}>Reset</button>
          </div>
          <div className="countdown-content">
            <p className="countdown-label">{countdownLabel}</p>
            <div className="countdown-value">{timeLeft}</div>
            <p className="countdown-note">{countdownNote}</p>
          </div>
        </section>
      )}

      <audio ref={audioRef} preload="auto" controls={showAudioControls} className={showAudioControls ? "audio-player" : "hidden-player"} />
      {youtubeIsActive && (
        <iframe
          className="hidden-player"
          src={mediaConfig.src}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          title="YouTube player"
        />
      )}
    </main>
  );
}

export default App;
