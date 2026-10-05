import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSFXHeartbeat } from '../lib/sfx';

const MESSAGES = [
  "Commence à appuyer...",
  "Continue, c'est bien parti... 💗",
  "Une belle surprise t'attend... ✨",
  "Encore quelques battements... 💓",
  "Tu y es presque... 💕",
  "Garde le rythme ! 🌷",
  "Ton cœur bat fort... 💖",
  "Presque prêt... 💫",
  "Dernier effort ! 😍",
  "Ouverture de ta surprise... 🎉"
];

export default function Gateway({ onUnlock }) {
  const [taps, setTaps] = useState(0);
  const [ripples, setRipples] = useState([]);
  const maxTaps = 10;

  const handleTap = () => {
    if (taps >= maxTaps) return;

    // Son de battement de cœur doux à chaque tap
    playSFXHeartbeat();

    const nextTaps = taps + 1;
    setTaps(nextTaps);

    // Ajouter une onde d'animation
    const rippleId = Date.now();
    setRipples(prev => [...prev.slice(-3), rippleId]);

    // Au 10ème tap : explosion festive et transition
    if (nextTaps >= maxTaps) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#f59e0b', '#a855f7']
      });

      setTimeout(() => {
        onUnlock();
      }, 900);
    }
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (taps / maxTaps) * circumference;

  return (
    <motion.section 
      className="gateway-card"
      initial={{ opacity: 0, y: 25, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="envelope-badge"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        💌
      </motion.div>

      <p className="gateway-eyebrow">UNE PETITE SURPRISE T'ATTEND...</p>
      <h1 className="gateway-title">Seras-tu prête<br />à l'ouvrir ?</h1>
      <p className="gateway-subtitle">Appuie sur le cœur 10 fois pour ouvrir sa surprise 💗</p>

      <div className="heart-tap-container">
        <svg className="progress-ring" viewBox="0 0 160 160">
          <circle 
            cx="80" cy="80" r="70" 
            fill="none" 
            stroke="#fce7f3" 
            strokeWidth="5" 
          />
          <motion.circle 
            cx="80" cy="80" r="70" 
            fill="none" 
            stroke="#f43f5e" 
            strokeWidth="5.5" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </svg>

        <motion.button 
          className="heart-button"
          onClick={handleTap}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.88 }}
          aria-label="Appuie sur le cœur"
        >
          <AnimatePresence>
            {ripples.map(id => (
              <motion.span
                key={id}
                className="heart-ripple"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>
          <motion.span 
            className="heart-icon"
            key={taps}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            💖
          </motion.span>
        </motion.button>
      </div>

      <motion.p 
        className="gateway-status"
        key={taps}
        initial={{ opacity: 0.4, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {MESSAGES[taps] || MESSAGES[MESSAGES.length - 1]}
      </motion.p>

      <div className="gateway-dots">
        {Array.from({ length: maxTaps }).map((_, idx) => (
          <motion.span 
            key={idx} 
            className={`gateway-dot ${idx < taps ? 'filled' : ''}`}
            animate={idx === taps - 1 ? { scale: [1, 1.4, 1.25] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.section>
  );
}
