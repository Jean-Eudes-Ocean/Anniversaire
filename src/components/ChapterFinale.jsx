import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSFXBirthdayBlow, playSFXChapterTransition } from '../lib/sfx';

// Composant Bougie mignonne avec flamme vacillante
function SweetCandle({ id, isLit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      {/* Flamme ou fumée */}
      <AnimatePresence mode="wait">
        {isLit ? (
          <motion.div
            key={`flame-${id}`}
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.2, 0.95, 1.15, 1],
              rotate: [-2, 3, -3, 2, -2]
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              width: '12px', 
              height: '20px', 
              background: 'radial-gradient(ellipse at 50% 80%, #fff59d 0%, #fbc02d 40%, #f57c00 75%, #d32f2f 100%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              marginBottom: '3px',
              boxShadow: '0 0 10px 4px rgba(251, 191, 36, 0.65)',
              transformOrigin: 'bottom center'
            }}
          />
        ) : (
          <motion.div
            key={`smoke-${id}`}
            initial={{ opacity: 0.8, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -24, scale: 1.4 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              width: '4px',
              height: '18px',
              background: 'linear-gradient(transparent, rgba(160,160,160,0.6))',
              borderRadius: '9999px',
              marginBottom: '3px',
              transformOrigin: 'bottom center'
            }}
          />
        )}
      </AnimatePresence>

      {/* Corps de la bougie */}
      <div style={{ 
        width: '12px', 
        height: '36px', 
        background: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 60%, #ec4899 100%)',
        borderRadius: '4px 4px 5px 5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Rayures festives */}
        {[8, 18, 28].map(y => (
          <div key={y} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${y}px`,
            height: '2px',
            background: 'rgba(255,255,255,0.6)'
          }} />
        ))}
        {/* Mèche */}
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '5px',
          background: '#374151',
          borderRadius: '1px'
        }} />
      </div>
    </div>
  );
}

export default function ChapterFinale({ onRestart }) {
  const [candlesLit, setCandlesLit] = useState(true);
  const [isBlowing, setIsBlowing] = useState(false);
  const [hasBlown, setHasBlown] = useState(false);

  // Grand feu d'artifice festif
  const triggerGrandFireworks = () => {
    const duration = 7 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#ec4899', '#fbbf24', '#ffffff', '#c084fc']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
        colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399']
      });
    }, 320);
  };

  // Son et petits confettis d'arrivée
  useEffect(() => {
    playSFXChapterTransition();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fbbf24']
    });
  }, []);

  // Action : Souffler toutes les bougies et faire un vœu d'un coup
  const handleBlowWishes = () => {
    if (isBlowing || !candlesLit) return;
    setIsBlowing(true);

    // Son de souffle doux
    playSFXBirthdayBlow();

    // Extinction douce des bougies
    setTimeout(() => {
      setCandlesLit(false);
      setHasBlown(true);
      setIsBlowing(false);

      // Grande explosion de confettis
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f43f5e', '#fbbf24', '#a855f7', '#34d399', '#38bdf8', '#ffffff']
      });

      // Lancer la pluie de feux d'artifice
      setTimeout(triggerGrandFireworks, 400);
    }, 450);
  };

  // Rallumer les bougies pour recommencer le vœu
  const handleRelight = () => {
    setCandlesLit(true);
    setHasBlown(false);
  };

  return (
    <motion.div 
      className="chapter-content finale-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="chapter-badge"
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        🎂
      </motion.div>

      <h1 className="finale-title">
        Joyeux Anniversaire,<br />Mon Amour !
      </h1>

      <p className="finale-sub">
        Aujourd'hui, tous les projecteurs de l'univers sont braqués sur toi.
      </p>

      {/* Carte du Gâteau Magique */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '28px 20px',
        boxShadow: '0 15px 40px rgba(225, 29, 72, 0.12), 0 4px 12px rgba(0,0,0,0.04)',
        border: '1.5px solid #fce7f3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '10px 0 24px',
        position: 'relative'
      }}>

        {/* Bougies au-dessus du gâteau */}
        <div style={{ 
          display: 'flex', 
          gap: '14px', 
          alignItems: 'flex-end',
          marginBottom: '6px',
          padding: '4px 10px'
        }}>
          {[0, 1, 2, 3, 4].map(idx => (
            <SweetCandle key={idx} id={idx} isLit={candlesLit} />
          ))}
        </div>

        {/* Le Gâteau d'anniversaire */}
        <motion.div 
          animate={candlesLit ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '84px', lineHeight: 1, userSelect: 'none', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.12))' }}
        >
          🎂
        </motion.div>

        {/* PHASE 1 : Avant le souffle -> Invitation poétique au vœu */}
        <AnimatePresence mode="wait">
          {!hasBlown ? (
            <motion.div 
              key="prompt-wish"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ width: '100%', textAlign: 'center', marginTop: '16px' }}
            >
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '17px',
                color: 'var(--rose-700)',
                margin: '0 0 16px',
                lineHeight: 1.4
              }}>
                Ferme les yeux très fort, et fais ton plus beau vœu pour cette nouvelle année... 🤫✨
              </p>

              {/* Le bouton magique unique : clair, mignon et irrésistible */}
              <motion.button
                onClick={handleBlowWishes}
                disabled={isBlowing}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                animate={{
                  boxShadow: [
                    '0 6px 20px rgba(244, 63, 94, 0.35)',
                    '0 8px 30px rgba(244, 63, 94, 0.6)',
                    '0 6px 20px rgba(244, 63, 94, 0.35)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: isBlowing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>💨</span>
                <span>{isBlowing ? "Tu souffles fort..." : "Souffler mes bougies & faire mon vœu ✨"}</span>
              </motion.button>
            </motion.div>
          ) : (
            /* PHASE 2 : Après le souffle -> Vœu scellé et mot d'amour */
            <motion.div
              key="wish-granted"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', textAlign: 'center', marginTop: '14px' }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%)',
                borderRadius: '18px',
                padding: '18px 16px',
                border: '1px solid #fbcfe8',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '4px' }}>✨💫✨</span>
                <h3 style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '26px',
                  color: 'var(--crimson-title)',
                  margin: '0 0 6px',
                  fontWeight: '700'
                }}>
                  Ton vœu a été scellé dans les étoiles !
                </h3>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: '#4b5563',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Que cette nouvelle année de ta vie t'apporte tout le bonheur, la santé et l'amour que tu mérites. Je t'aime à l'infini ! 💖
                </p>
              </div>

              {/* Bouton pour relancer les feux d'artifice */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <motion.button
                  onClick={triggerGrandFireworks}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🎉</span>
                  <span>Relancer les feux d'artifice !</span>
                </motion.button>

                {/* Bouton pour rallumer si elle veut rejouer */}
                <button
                  onClick={handleRelight}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '6px',
                    textDecoration: 'underline'
                  }}
                >
                  🕯️ Rallumer les bougies pour re-faire un vœu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Petits emojis doux */}
      <div className="finale-emojis">
        <span>💖</span>
        <span>🌸</span>
        <span>💕</span>
        <span>🌷</span>
        <span>💫</span>
        <span>🎀</span>
        <span>✨</span>
      </div>

      {/* Indicateur de fin */}
      <div className="chapter-dots">
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
      </div>

      {/* Recommencer l'histoire */}
      {onRestart && (
        <motion.button
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid #fbcfe8',
            color: 'var(--rose-700)',
            padding: '9px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)'
          }}
        >
          🔄 Revivre toute notre histoire
        </motion.button>
      )}

      <footer className="site-footer">
        Fait avec tout mon amour <span style={{ color: '#f43f5e' }}>❤️</span> rien que pour toi
      </footer>
    </motion.div>
  );
}
