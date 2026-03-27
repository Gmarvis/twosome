/**
 * Lightweight sound effects using Web Audio API.
 * No audio files — just synthesised tones.
 *
 * iOS Safari requires AudioContext.resume() to be called inside a user gesture.
 * We register persistent listeners that call resume() on EVERY tap until it
 * transitions to "running". After that, resume() is a cheap no-op.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

/** Register persistent listeners that unlock AudioContext on user interaction. */
export function initAudio() {
  const tryResume = () => {
    try {
      const c = getCtx();
      if (c.state === "suspended") c.resume();
    } catch { /* ignore */ }
  };
  // Passive + capture: fires before anything else, doesn't block scrolling
  document.addEventListener("touchstart", tryResume, { capture: true, passive: true });
  document.addEventListener("touchend", tryResume, { capture: true, passive: true });
  document.addEventListener("click", tryResume, { capture: true });
  document.addEventListener("keydown", tryResume, { capture: true });
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  ramp?: { to: number },
) {
  try {
    const c = getCtx();
    // If still suspended, schedule for after resume
    if (c.state !== "running") {
      c.resume()
        .then(() => playTone(freq, duration, type, volume, ramp))
        .catch(() => {});
      return;
    }
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (ramp) {
      osc.frequency.linearRampToValueAtTime(ramp.to, c.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // Silently fail — sounds are non-critical
  }
}

/** Bright double-beep — "it's your turn!" */
export function playYourTurn() {
  playTone(880, 0.12, "sine", 0.25);
  setTimeout(() => playTone(1100, 0.15, "sine", 0.3), 140);
}

/** Soft single note — other player submitted */
export function playTurnReceived() {
  playTone(660, 0.15, "sine", 0.15);
}

/** Rising arpeggio — player joined the room */
export function playPlayerJoined() {
  playTone(523, 0.12, "sine", 0.2);
  setTimeout(() => playTone(659, 0.12, "sine", 0.2), 120);
  setTimeout(() => playTone(784, 0.18, "sine", 0.25), 240);
}

/** Triumphant celebration — game finished! 🎉 */
export function playGameFinished() {
  playTone(523, 0.15, "sine", 0.2);
  setTimeout(() => playTone(659, 0.15, "sine", 0.2), 120);
  setTimeout(() => playTone(784, 0.15, "sine", 0.22), 240);
  setTimeout(() => playTone(1047, 0.2, "sine", 0.25), 360);
  setTimeout(() => {
    playTone(1319, 0.35, "sine", 0.25);
    playTone(784, 0.35, "sine", 0.12);
    playTone(523, 0.35, "sine", 0.08);
  }, 500);
  setTimeout(() => playTone(1568, 0.4, "sine", 0.15), 700);
  setTimeout(() => playTone(2093, 0.5, "sine", 0.1), 850);
}

/** Short tick — timer countdown (3, 2, 1) */
export function playTimerTick() {
  playTone(1000, 0.06, "square", 0.08);
}

/** Quick whoosh-up — turn submitted */
export function playSubmitSuccess() {
  playTone(400, 0.15, "sine", 0.15, { to: 800 });
}

/** Game starting — ascending "let's go" */
export function playGameStart() {
  playTone(784, 0.15, "sine", 0.25);
  setTimeout(() => playTone(988, 0.15, "sine", 0.25), 130);
  setTimeout(() => playTone(1175, 0.25, "sine", 0.3), 260);
}
