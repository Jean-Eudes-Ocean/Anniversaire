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
  const audioRef = useRef(null);

  const activeSrc = customAudioUrl || '/song.mp3';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  // Lecture automatique dès déverrouillage du cœur (action utilisateur)
  useEffect(() => {
    if (autoPlayTrigger && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Autoplay block:", err);
      });
    }
  }, [autoPlayTrigger]);

  return (
    <div className="music-trigger">
      <audio 
        ref={audioRef} 
        src={activeSrc} 
        loop 
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <motion.button 
        className={`music-btn ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isPlaying ? "Mettre en pause la musique" : "Lancer la musique d'ambiance (Alex Warren - Ordinary)"}
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
