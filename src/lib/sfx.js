/**
 * SoundFX — Effets sonores romantiques et délicats via Web Audio API
 * Sons cristallins, pops mignons et battements de cœur sans aucun fichier externe.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Joue une note d'oscillateur douce avec enveloppe ADSR
 */
function playTone({ freq = 440, duration = 0.3, gain = 0.08, type = 'sine', delay = 0 }) {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.value = freq * 2;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + duration);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.025);
  gainNode.gain.setValueAtTime(gain, now + duration * 0.6);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/**
 * 💓 Battement de cœur doux synchronisé avec chaque tap sur la passerelle
 */
// Compteur global pour intensifier le battement progressivement
let _heartbeatCount = 0;

export function resetHeartbeatCount() {
  _heartbeatCount = 0;
}

/**
 * 💓 Battement de cœur progressif — s'intensifie à chaque tap
 * lub-dub de plus en plus fort et profond
 */
export function playSFXHeartbeat() {
  _heartbeatCount++;
  const ctx = getCtx();
  if (!ctx) return;

  // Intensité croissante entre tap 1 et 10
  const intensity = Math.min(1, 0.3 + (_heartbeatCount / 10) * 0.7);
  const baseGain = 0.18 * intensity;

  // "Lub" — battement principal (grave, fort)
  playTone({ freq: 58,  duration: 0.14, gain: baseGain,        type: 'sine', delay: 0 });
  // Harmonique chaude du lub
  playTone({ freq: 116, duration: 0.12, gain: baseGain * 0.4,  type: 'sine', delay: 0 });

  // "Dub" — deuxième battement légèrement plus haut
  playTone({ freq: 52,  duration: 0.18, gain: baseGain * 0.75, type: 'sine', delay: 0.16 });
  playTone({ freq: 104, duration: 0.14, gain: baseGain * 0.3,  type: 'sine', delay: 0.16 });

  // Écho résonnant sur les derniers taps (à partir du tap 7)
  if (_heartbeatCount >= 7) {
    playTone({ freq: 46, duration: 0.28, gain: baseGain * 0.25, type: 'sine', delay: 0.38 });
  }
}

/**
 * 💌 Son cristallin romantique à l'ouverture de l'enveloppe
 */
export function playSFXEnvelopeOpen() {
  // Glissando ascendant féérique
  const notes = [
    { freq: 523.25, d: 0.18, g: 0.07, delay: 0.0 },
    { freq: 659.25, d: 0.18, g: 0.07, delay: 0.12 },
    { freq: 783.99, d: 0.2,  g: 0.07, delay: 0.24 },
    { freq: 1046.50, d: 0.35, g: 0.09, delay: 0.38 },
    { freq: 1318.51, d: 0.5,  g: 0.07, delay: 0.55 },
  ];
  notes.forEach(n => playTone({ freq: n.freq, duration: n.d, gain: n.g, type: 'sine', delay: n.delay }));
}

/**
 * 🎀 Pop mignon et pétillant à l'apparition / swipe des Polaroïds
 */
export function playSFXPolaroidPop() {
  // Un "pop" cristallin léger
  playTone({ freq: 1200, duration: 0.08, gain: 0.06, type: 'sine', delay: 0 });
  playTone({ freq: 880,  duration: 0.14, gain: 0.05, type: 'sine', delay: 0.06 });
  playTone({ freq: 1046, duration: 0.18, gain: 0.04, type: 'sine', delay: 0.10 });
}

/**
 * 🎂 Fanfare joyeuse pour le souffle des bougies
 */
export function playSFXBirthdayBlow() {
  const melody = [
    { freq: 523.25, d: 0.22, g: 0.08, delay: 0.0 },
    { freq: 523.25, d: 0.18, g: 0.07, delay: 0.28 },
    { freq: 587.33, d: 0.22, g: 0.08, delay: 0.50 },
    { freq: 523.25, d: 0.22, g: 0.08, delay: 0.76 },
    { freq: 698.46, d: 0.22, g: 0.08, delay: 1.0 },
    { freq: 659.25, d: 0.45, g: 0.09, delay: 1.25 },
  ];
  melody.forEach(n => playTone({ freq: n.freq, duration: n.d, gain: n.g, type: 'sine', delay: n.delay }));
}

/**
 * ✨ Tintement discret lors du passage d'un chapitre à l'autre
 */
export function playSFXChapterTransition() {
  playTone({ freq: 880,    duration: 0.28, gain: 0.05, type: 'sine', delay: 0.0 });
  playTone({ freq: 1108.7, duration: 0.28, gain: 0.04, type: 'sine', delay: 0.18 });
  playTone({ freq: 1318.5, duration: 0.4,  gain: 0.04, type: 'sine', delay: 0.36 });
}
