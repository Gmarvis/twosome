/**
 * Lightweight sound effects using Web Audio API.
 * No audio files — just synthesised tones.
 */

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

/**
 * Unlock AudioContext on first user tap (needed for iOS Safari).
 * Call this once — it registers a global listener that auto-removes itself.
 */
export function initAudio() {
  if (unlocked) return;

  const unlock = () => {
    const c = getCtx();
    if (c.state === "suspended") {
      c.resume().then(() => {
        // Play a silent buffer to fully unlock on iOS
        const buf = c.createBuffer(1, 1, 22050);
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
      });
    }
    unlocked = true;
    document.removeEventListener("touchstart", unlock, true);
    document.removeEventListener("touchend", unlock, true);
    document.removeEventListener("click", unlock, true);
  };

  // Register on multiple events — iOS needs touchstart/touchend
  document.addEventListener("touchstart", unlock, true);
  document.addEventListener("touchend", unlock, true);
  document.addEventListener("click", unlock, true);
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
    // Ensure resumed (fire-and-forget, no-op if already running)
    if (c.state === "suspended") c.resume().catch(() => {});
    if (c.state !== "running") return; // Don't play if still locked
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

/** Triumphant celebration — game finished! 🎉
 *  Mario-style "stage clear" melody with harmonics */
export function playGameFinished() {
  // Melody: C E G C' E' — bright ascending fanfare
  playTone(523, 0.15, "sine", 0.2);       // C5
  setTimeout(() => playTone(659, 0.15, "sine", 0.2), 120);   // E5
  setTimeout(() => playTone(784, 0.15, "sine", 0.22), 240);  // G5
  setTimeout(() => playTone(1047, 0.2, "sine", 0.25), 360);  // C6
  // Harmony burst
  setTimeout(() => {
    playTone(1319, 0.35, "sine", 0.25);   // E6
    playTone(784, 0.35, "sine", 0.12);    // G5 underneath
    playTone(523, 0.35, "sine", 0.08);    // C5 bass
  }, 500);
  // Final sparkle
  setTimeout(() => playTone(1568, 0.4, "sine", 0.15), 700);  // G6
  setTimeout(() => playTone(2093, 0.5, "sine", 0.1), 850);   // C7 shimmer
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
