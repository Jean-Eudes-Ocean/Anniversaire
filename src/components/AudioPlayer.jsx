import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const MELODY = [
  { f: 523.25, d: 0.6 },
  { f: 659.25, d: 0.6 },
  { f: 783.99, d: 0.8 },
  { f: 659.25, d: 0.6 },
  { f: 880.00, d: 0.8 },
  { f: 783.99, d: 0.6 },
  { f: 659.25, d: 0.8 },
  { f: 587.33, d: 1.0 },

  { f: 523.25, d: 0.6 },
  { f: 659.25, d: 0.6 },
  { f: 783.99, d: 0.8 },
  { f: 1046.50, d: 1.2 },
  { f: 987.77, d: 0.6 },
  { f: 880.00, d: 0.6 },
  { f: 783.99, d: 1.2 },

  { f: 698.46, d: 0.6 },
  { f: 880.00, d: 0.6 },
  { f: 1046.50, d: 0.8 },
  { f: 880.00, d: 0.6 },
  { f: 783.99, d: 0.8 },
  { f: 659.25, d: 0.6 },
  { f: 587.33, d: 0.8 },
  { f: 523.25, d: 1.4 },
];

export default function AudioPlayer({ customAudioUrl, autoPlayTrigger }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const noteIndexRef = useRef(0);
  const customAudioRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playNote = (freq, duration) => {
    if (!audioCtxRef.current || !isPlaying || customAudioUrl) return;
    try {
      const now = audioCtxRef.current.currentTime;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.5);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start(now);
      osc.stop(now + duration + 0.6);
    } catch (e) {
      console.warn("Audio note error:", e);
    }
  };

  const loopMelody = () => {
    if (!isPlaying || customAudioUrl) return;
    const note = MELODY[noteIndexRef.current];
    playNote(note.f, note.d);

    noteIndexRef.current = (noteIndexRef.current + 1) % MELODY.length;
    timerRef.current = setTimeout(loopMelody, note.d * 900);
  };

  const togglePlay = () => {
    initAudio();
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      if (customAudioUrl && customAudioRef.current) {
        customAudioRef.current.play().catch(() => {});
      } else {
        loopMelody();
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (customAudioRef.current) customAudioRef.current.pause();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, customAudioUrl]);

  // Déclencheur automatique au 10ème tap du cœur
  useEffect(() => {
    if (autoPlayTrigger) {
      initAudio();
      setIsPlaying(true);
    }
  }, [autoPlayTrigger]);

  return (
    <div className="music-trigger">
      {customAudioUrl && (
        <audio ref={customAudioRef} src={customAudioUrl} loop preload="auto" />
      )}
      <motion.button 
        className={`music-btn ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isPlaying ? "Mettre en pause la musique" : "Lancer la musique d'ambiance"}
      >
        <div className="music-bars">
          <span className="music-bar bar-1"></span>
          <span className="music-bar bar-2"></span>
          <span className="music-bar bar-3"></span>
        </div>
      </motion.button>
    </div>
  );
}
