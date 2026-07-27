// Media-independent finish cue: a short synthesized chime built with the Web
// Audio API so the "time is up" moment always lands, even when no song link is
// provided or the browser blocks media autoplay.

const CHIME_NOTES = [880, 1108.73, 1318.51]; // A5, C#6, E6 — a bright major triad
const NOTE_SPACING = 0.18;
const NOTE_LENGTH = 0.35;
const PEAK_GAIN = 0.35;

export function createChime() {
  let context = null;

  function ensureContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!context) {
      context = new AudioContextClass();
    }

    return context;
  }

  return {
    // Call on a user gesture (e.g. Start Timer) so the audio context is
    // unlocked and ready to make sound when the countdown later finishes.
    prime() {
      const ctx = ensureContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    },
    play() {
      const ctx = ensureContext();
      if (!ctx) {
        return;
      }

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const startAt = ctx.currentTime;
      CHIME_NOTES.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = startAt + index * NOTE_SPACING;
        const noteStop = noteStart + NOTE_LENGTH;

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStop);

        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStop + 0.05);
      });
    },
    close() {
      if (context) {
        context.close();
        context = null;
      }
    },
  };
}
