import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSFXHeartbeat, resetHeartbeatCount } from '../lib/sfx';

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
  const [isBeating, setIsBeating] = useState(false);
  const maxTaps = 10;
  const beatTimeoutRef = useRef(null);

  // Reset le compteur sfx au montage
  useEffect(() => {
    resetHeartbeatCount();
  }, []);

  const handleTap = () => {
    if (taps >= maxTaps) return;

    // Son progressif
    playSFXHeartbeat();

    const nextTaps = taps + 1;
    setTaps(nextTaps);

    // Animation de battement
    setIsBeating(true);
    if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
    beatTimeoutRef.current = setTimeout(() => setIsBeating(false), 400);

    // Ondes multiples : 1 où 2 ondes selon progression
    const now = Date.now();
    const newRipples = [now];
    if (nextTaps >= 5) newRipples.push(now + 1); // 2e onde à partir du milieu
    if (nextTaps >= 8) newRipples.push(now + 2); // 3e onde sur les derniers
    setRipples(prev => [...prev.slice(-5), ...newRipples]);

    // Au 10ème tap : explosion festive
    if (nextTaps >= maxTaps) {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#f43f5e', '#ec4899', '#f59e0b', '#a855f7', '#fb7185']
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { x: 0.2, y: 0.6 },
          colors: ['#f43f5e', '#fbbf24']
        });
      }, 200);
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { x: 0.8, y: 0.6 },
          colors: ['#ec4899', '#a855f7']
        });
      }, 350);
      setTimeout(() => onUnlock(), 950);
    }
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (taps / maxTaps) * circumference;

  // Taille progressive du cœur selon avancement
  const heartScale = 1 + (taps / maxTaps) * 0.35;
  // Flash rose de fond selon avancement
  const glowIntensity = Math.min(0.85, (taps / maxTaps) * 1.1);
  const glowColor = `rgba(244, 63, 94, ${glowIntensity * 0.22})`;

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
      <p className="gateway-subtitle">Appuie sur le cœur 10 fois pour ouvrir ta surprise 💗</p>

      {/* Aura de fond pulsante */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: glowColor,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'background 0.3s ease'
        }}
        animate={isBeating ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      <div className="heart-tap-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Anneau de progression */}
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
            stroke={taps >= 8 ? '#be123c' : '#f43f5e'}
            strokeWidth={taps >= 5 ? '7' : '5.5'} 
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ filter: taps >= 5 ? 'drop-shadow(0 0 6px rgba(244,63,94,0.7))' : 'none' }}
          />
        </svg>

        <motion.button 
          className="heart-button"
          onClick={handleTap}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.82 }}
          aria-label="Appuie sur le cœur"
          // Shake shake shake à chaque tap
          animate={isBeating ? {
            x: [0, -5, 5, -4, 4, -2, 2, 0],
            y: [0, -3, 2, -2, 1, 0],
          } : { x: 0, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Ondes multiples */}
          <AnimatePresence>
            {ripples.map((id, i) => (
              <motion.span
                key={id}
                className="heart-ripple"
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 2.2 + (i * 0.3), opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 + (i * 0.1), ease: 'easeOut' }}
                style={{
                  background: i === 0
                    ? 'radial-gradient(circle, rgba(244,63,94,0.4), transparent)'
                    : 'radial-gradient(circle, rgba(251,113,133,0.25), transparent)'
                }}
              />
            ))}
          </AnimatePresence>

          {/* Cœur qui grandit progressivement */}
          <motion.span 
            className="heart-icon"
            key={taps}
            animate={{ 
              scale: [1, 1.45, 1.05, heartScale],
              filter: isBeating
                ? ['brightness(1)', 'brightness(1.5)', 'brightness(1.1)']
                : 'brightness(1)'
            }}
            transition={{ duration: 0.38, ease: [0.175, 0.885, 0.32, 1.275] }}
            style={{ display: 'inline-block', transformOrigin: 'center' }}
          >
            {taps >= 8 ? '❤️‍🔥' : taps >= 5 ? '💗' : '💖'}
          </motion.span>
        </motion.button>
      </div>

      {/* Message animé */}
      <motion.p 
        className="gateway-status"
        key={taps}
        initial={{ opacity: 0.4, y: -4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          fontWeight: taps >= 7 ? '800' : '600',
          fontSize: taps >= 7 ? '17px' : '15px',
          color: taps >= 7 ? '#be123c' : undefined,
          transition: 'all 0.3s ease'
        }}
      >
        {MESSAGES[taps] || MESSAGES[MESSAGES.length - 1]}
      </motion.p>

      {/* Points de progression */}
      <div className="gateway-dots">
        {Array.from({ length: maxTaps }).map((_, idx) => (
          <motion.span 
            key={idx} 
            className={`gateway-dot ${idx < taps ? 'filled' : ''}`}
            animate={idx === taps - 1 ? { scale: [1, 1.6, 1.3] } : idx < taps ? { scale: 1.15 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: idx < taps
                ? `hsl(${350 - idx * 5}, ${70 + idx * 3}%, ${45 + idx * 2}%)`
                : undefined,
              boxShadow: idx === taps - 1 ? '0 0 8px rgba(244,63,94,0.6)' : 'none'
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}
