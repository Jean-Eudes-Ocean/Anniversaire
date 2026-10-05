import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSFXEnvelopeOpen } from '../lib/sfx';

// Composant Typewriter — écrit le texte lettre par lettre avec effet encre
function TypewriterText({ text, delay = 0, className, style, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const charIndex = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay * 1000);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    charIndex.current = 0;
    setDisplayed('');

    const tick = () => {
      charIndex.current += 1;
      setDisplayed(text.slice(0, charIndex.current));
      
      if (charIndex.current >= text.length) {
        if (onComplete) onComplete();
        return;
      }

      // Vitesse variable : plus lent sur la ponctuation, plus rapide sur lettres normales
      const nextChar = text[charIndex.current] || '';
      const isPunct = /[.,!?;:\n\r]/.test(nextChar);
      const speed = isPunct ? 120 : 28;
      timerRef.current = setTimeout(tick, speed);
    };

    timerRef.current = setTimeout(tick, 40);
    return () => clearTimeout(timerRef.current);
  }, [started, text]);

  return (
    <span className={className} style={style}>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{ display: 'inline-block', width: '2px', height: '1em', background: '#be185d', verticalAlign: 'middle', marginLeft: '2px' }}
        />
      )}
    </span>
  );
}

// Composant TypewriterBlock — pour les paragraphes avec retard enchaîné
function TypewriterBlock({ children, delay = 0, style }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={style}
    >
      {visible && children}
    </motion.div>
  );
}

export default function ChapterLetter({ data, onNext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const handleOpenEnvelope = () => {
    if (isOpen || isOpening) return;
    setIsOpening(true);

    // Son cristallin romantique à l'ouverture
    playSFXEnvelopeOpen();

    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#ff4081', '#fbcfe8', '#fbbf24', '#ffffff']
    });

    setTimeout(() => {
      setIsOpen(true);
      setIsOpening(false);
    }, 700);
  };

  const paragraphs = (data.body || '').split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const allText = paragraphs.join('\n\n');

  // Calculer les delays pour enchaîner les paragraphes
  const paragraphDelays = [];
  let cumulative = 0.5;
  paragraphs.forEach((p, i) => {
    paragraphDelays.push(cumulative);
    // Estimation du temps d'écriture du paragraphe
    cumulative += p.length * 0.028 + 0.8;
  });
  const signatureDelay = cumulative + 0.5;
  const ctaDelay = signatureDelay + 1.2;

  return (
    <div className="chapter-content">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div 
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -25, transition: { duration: 0.4 } }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            {/* ENVELOPPE ÉPURÉE AVEC CŒUR PARFAITEMENT CENTRÉ */}
            <motion.div 
              onClick={handleOpenEnvelope}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.96 }}
              animate={isOpening ? { scale: 1.06, opacity: 0.85 } : {}}
              style={{
                position: 'relative',
                width: '340px',
                height: '220px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <svg 
                viewBox="0 0 340 220" 
                width="340" 
                height="220" 
                style={{ display: 'block', overflow: 'visible' }}
              >
                <defs>
                  <filter id="simpleEnvGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#f472b6" floodOpacity="0.28" />
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#be185d" floodOpacity="0.06" />
                  </filter>

                  <radialGradient id="heart3DGrad" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ff758c" />
                    <stop offset="55%" stopColor="#ff1361" />
                    <stop offset="100%" stopColor="#b0003a" />
                  </radialGradient>

                  <filter id="heartDropGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#e11d48" floodOpacity="0.5" />
                  </filter>

                  <linearGradient id="simpleBg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff2f6" />
                    <stop offset="100%" stopColor="#ffd3e2" />
                  </linearGradient>

                  <linearGradient id="simpleFlapLeft" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#ffc7db" />
                    <stop offset="100%" stopColor="#ffb2cb" />
                  </linearGradient>

                  <linearGradient id="simpleFlapRight" x1="100%" y1="50%" x2="0%" y2="50%">
                    <stop offset="0%" stopColor="#ffc7db" />
                    <stop offset="100%" stopColor="#ffb2cb" />
                  </linearGradient>

                  <linearGradient id="simpleFlapBottom" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ffaec7" />
                    <stop offset="100%" stopColor="#ffc2d6" />
                  </linearGradient>

                  <linearGradient id="simpleFlapTop" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#ffd8e7" />
                    <stop offset="100%" stopColor="#ffb8cf" />
                  </linearGradient>

                  <clipPath id="simpleEnvelopeClip">
                    <rect x="0" y="0" width="340" height="220" rx="20" ry="20" />
                  </clipPath>
                </defs>

                {/* Base de l'enveloppe */}
                <g filter="url(#simpleEnvGlow)">
                  <rect x="0" y="0" width="340" height="220" rx="20" ry="20" fill="url(#simpleBg)" />
                </g>

                {/* Plis de l'enveloppe */}
                <g clipPath="url(#simpleEnvelopeClip)">
                  <path d="M 0 0 L 170 110 L 0 220 Z" fill="url(#simpleFlapLeft)" />
                  <path d="M 340 0 L 170 110 L 340 220 Z" fill="url(#simpleFlapRight)" />
                  <path d="M 0 220 L 170 110 L 340 220 Z" fill="url(#simpleFlapBottom)" />
                  <motion.path 
                    d="M 0 0 L 170 110 L 340 0 Z" 
                    fill="url(#simpleFlapTop)" 
                    animate={isOpening ? { scaleY: -1 } : { scaleY: 1 }}
                    style={{ transformOrigin: '170px 0px' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </g>

                {/* CŒUR CENTRÉ EN RELIEF */}
                <motion.g
                  animate={isOpening ? { scale: 0, opacity: 0 } : { scale: [1, 1.12, 1] }}
                  transition={isOpening ? { duration: 0.25 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: '170px 110px' }}
                >
                  <path
                    d="M 170 128
                       C 170 128 150 115 150 100
                       C 150 90 157 84 165 84
                       C 170 84 170 88 170 88
                       C 170 88 170 84 175 84
                       C 183 84 190 90 190 100
                       C 190 115 170 128 170 128 Z"
                    fill="url(#heart3DGrad)"
                    filter="url(#heartDropGlow)"
                  />
                  <ellipse cx="162" cy="92" rx="4.5" ry="2.5" transform="rotate(-30 162 92)" fill="#ffffff" opacity="0.65" />
                  <text x="174" y="96" fontSize="11" fill="#fde047" opacity="0.95" style={{ userSelect: 'none' }}>✨</text>
                </motion.g>
              </svg>
            </motion.div>

            <motion.p 
              className="envelope-hint"
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '19px',
                color: 'var(--rose-700)',
                marginTop: '26px'
              }}
            >
              Clique sur l'enveloppe pour lire ta lettre 💌
            </motion.p>
          </motion.div>
        ) : (
          <motion.article 
            key="parchment-letter-view"
            className="parchment-letter-card"
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Date tamponnée — apparait d'abord */}
            <motion.div 
              className="letter-date-stamp"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              ✦ {data.date || "8 OCTOBRE 2026"} ✦
            </motion.div>

            {/* Titre avec typewriter */}
            <motion.h2 
              className="letter-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TypewriterText 
                text={data.title || "Pour toi, ce jour si spécial"}
                delay={0.3}
              />
            </motion.h2>

            {/* Corps de la lettre — chaque paragraphe s'écrit après le précédent */}
            <div className="letter-paragraphs">
              {paragraphs.map((p, idx) => (
                <TypewriterBlock key={idx} delay={paragraphDelays[idx]}>
                  <p style={{ 
                    fontFamily: 'var(--font-hand)', 
                    fontSize: '20px', 
                    lineHeight: 1.75,
                    color: '#4b2636',
                    marginBottom: idx < paragraphs.length - 1 ? '1.2em' : 0
                  }}>
                    <TypewriterText
                      text={p}
                      delay={0}
                      onComplete={idx === paragraphs.length - 1 ? () => setShowCTA(true) : undefined}
                    />
                  </p>
                </TypewriterBlock>
              ))}
            </div>

            {/* Signature */}
            <TypewriterBlock delay={signatureDelay}>
              <p className="letter-sign" style={{ fontFamily: 'var(--font-hand)', fontSize: '22px' }}>
                <TypewriterText text={data.signature || "Avec tout mon amour"} delay={0} />
              </p>
            </TypewriterBlock>

            <div className="letter-decor">🌸 💕 🌸</div>

            {/* CTA — n'apparait qu'une fois la lettre entièrement écrite */}
            <AnimatePresence>
              {showCTA && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ textAlign: 'center', marginTop: '28px' }}
                >
                  <motion.button 
                    className="pill-button"
                    onClick={onNext}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continuer le voyage ✨ →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        )}
      </AnimatePresence>

      <div className="chapter-dots" style={{ marginTop: '22px' }}>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
      </div>
    </div>
  );
}
