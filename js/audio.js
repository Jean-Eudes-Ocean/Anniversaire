/**
 * Module Audio Romantique
 * Combine un synthétiseur Web Audio API (boîte à musique féerique)
 * avec la possibilité de lire un fichier MP3 importé par l'utilisateur.
 */

class RomanticAudioManager {
  constructor() {
    this.isPlaying = false;
    this.audioCtx = null;
    this.timerId = null;
    this.noteIndex = 0;
    this.customAudio = document.getElementById('bg-audio-element');
    this.hasCustomTrack = false;

    // Mélodie féerique et douce (fréquences en Hz d'une berceuse romantique / boîte à musique)
    // Progression harmonique douce : Do - Sol - La mineur - Fa
    this.melody = [
      { f: 523.25, d: 0.6 }, // C5
      { f: 659.25, d: 0.6 }, // E5
      { f: 783.99, d: 0.8 }, // G5
      { f: 659.25, d: 0.6 }, // E5
      { f: 880.00, d: 0.8 }, // A5
      { f: 783.99, d: 0.6 }, // G5
      { f: 659.25, d: 0.8 }, // E5
      { f: 587.33, d: 1.0 }, // D5

      { f: 523.25, d: 0.6 }, // C5
      { f: 659.25, d: 0.6 }, // E5
      { f: 783.99, d: 0.8 }, // G5
      { f: 1046.50, d: 1.2 }, // C6
      { f: 987.77, d: 0.6 }, // B5
      { f: 880.00, d: 0.6 }, // A5
      { f: 783.99, d: 1.2 }, // G5

      { f: 698.46, d: 0.6 }, // F5
      { f: 880.00, d: 0.6 }, // A5
      { f: 1046.50, d: 0.8 }, // C6
      { f: 880.00, d: 0.6 }, // A5
      { f: 783.99, d: 0.8 }, // G5
      { f: 659.25, d: 0.6 }, // E5
      { f: 587.33, d: 0.8 }, // D5
      { f: 523.25, d: 1.4 }, // C5
    ];
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChimeNote(freq, duration) {
    if (!this.audioCtx || !this.isPlaying || this.hasCustomTrack) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Timbre chaud façon célesta / boîte à musique
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Enveloppe d'attaque rapide et extinction lente (son cristallin)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.6);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.7);
    } catch (e) {
      console.warn("Audio note error:", e);
    }
  }

  startMelodyLoop() {
    if (!this.isPlaying || this.hasCustomTrack) return;

    const current = this.melody[this.noteIndex];
    this.playChimeNote(current.f, current.d);

    this.noteIndex = (this.noteIndex + 1) % this.melody.length;
    const interval = current.d * 900;

    this.timerId = setTimeout(() => {
      this.startMelodyLoop();
    }, interval);
  }

  play() {
    this.initContext();
    this.isPlaying = true;
    this.updateUI(true);

    if (this.hasCustomTrack && this.customAudio.src) {
      this.customAudio.play().catch(e => console.log("Custom play blocked:", e));
    } else {
      if (this.timerId) clearTimeout(this.timerId);
      this.startMelodyLoop();
    }
  }

  pause() {
    this.isPlaying = false;
    this.updateUI(false);
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setCustomTrack(audioUrl, trackName = "Chanson personnalisée") {
    this.pause();
    this.hasCustomTrack = true;
    this.customAudio.src = audioUrl;
    
    const nameDisplay = document.getElementById('track-name-display');
    const resetBtn = document.getElementById('reset-default-music-btn');
    if (nameDisplay) nameDisplay.textContent = trackName;
    if (resetBtn) resetBtn.classList.remove('hidden');

    this.play();
  }

  resetToDefault() {
    this.pause();
    this.hasCustomTrack = false;
    this.customAudio.src = "";
    
    const nameDisplay = document.getElementById('track-name-display');
    const resetBtn = document.getElementById('reset-default-music-btn');
    if (nameDisplay) nameDisplay.textContent = "Mélodie féerique intégrée (Boîte à musique)";
    if (resetBtn) resetBtn.classList.add('hidden');

    this.play();
  }

  updateUI(playing) {
    const btn = document.getElementById('music-toggle-btn');
    if (!btn) return;
    if (playing) {
      btn.classList.add('playing');
    } else {
      btn.classList.remove('playing');
    }
  }
}

window.romanticAudio = new RomanticAudioManager();
