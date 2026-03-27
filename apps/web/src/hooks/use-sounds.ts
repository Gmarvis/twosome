/**
 * Sound effects via Web Audio API — works on iOS Safari.
 *
 * Key insight for iOS: the AudioContext must be CREATED (not just resumed)
 * during a user gesture. We defer creation until the first tap/click,
 * then all subsequent sounds work automatically.
 */

let ctx: AudioContext | null = null;
let pending: Array<() => void> = [];

/**
 * Get or create AudioContext. On iOS this MUST be called from
 * a user gesture handler the first time.
 */
function ensureCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/**
 * Call once at app startup. Registers a one-time gesture listener that
 * creates + resumes the AudioContext, then plays any queued sounds.
 */
export function initAudio() {
  const onGesture = () => {
    const c = ensureCtx();
    // Flush any sounds that were requested before the first gesture
    if (c.state === "running") {
      for (const fn of pending) fn();
      pending = [];
    } else {
      c.resume().then(() => {
        for (const fn of pending) fn();
        pending = [];
      }).catch(() => {});
    }
    // Keep listener to handle edge cases where context suspends again
  };

  for (const evt of ["touchstart", "touchend", "click", "keydown"]) {
    document.addEventListener(evt, onGesture, { capture: true, passive: true } as any);
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  ramp?: { to: number },
) {
  const doPlay = () => {
    try {
      const c = ensureCtx();
      if (c.state !== "running") return;
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
      // Non-critical
    }
  };

  if (!ctx || ctx.state !== "running") {
    // Context not ready yet — queue it for after the first gesture
    pending.push(doPlay);
    return;
  }
  doPlay();
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
