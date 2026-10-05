import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSFXBirthdayBlow, playSFXChapterTransition } from '../lib/sfx';

// Bougie SVG animée
function Candle({ id, isLit, onBlow }) {
  return (
    <motion.div
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        cursor: isLit ? 'pointer' : 'default',
        userSelect: 'none'
      }}
      whileHover={isLit ? { y: -3 } : {}}
      onClick={isLit ? onBlow : undefined}
      title={isLit ? 'Clique ou souffle ici !' : 'Soufflée !'}
    >
      {/* Flamme */}
      <AnimatePresence>
        {isLit ? (
          <motion.div
            key={`flame-${id}`}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ 
              opacity: 1, 
              scaleY: [1, 1.15, 0.9, 1.2, 1],
              scaleX: [1, 0.85, 1.1, 0.9, 1]
            }}
            exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              width: '10px', 
              height: '18px', 
              background: 'radial-gradient(ellipse at 50% 80%, #fff176 0%, #fbbf24 40%, #f97316 80%, #ef4444 100%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              marginBottom: '2px',
              boxShadow: '0 0 8px 3px rgba(251, 191, 36, 0.5)',
              transformOrigin: 'bottom center'
            }}
          />
        ) : (
          <motion.div
            key={`smoke-${id}`}
            initial={{ opacity: 0.7, y: 0, scaleX: 1 }}
            animate={{ opacity: 0, y: -20, scaleX: [1, 1.5, 0.5, 1.2] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              width: '3px',
              height: '20px',
              background: 'linear-gradient(transparent, rgba(150,150,150,0.5))',
              borderRadius: '9999px',
              marginBottom: '2px',
              transformOrigin: 'bottom center'
            }}
          />
        )}
      </AnimatePresence>

      {/* Corps de la bougie */}
      <div style={{ 
        width: '12px', 
        height: '38px', 
        background: `linear-gradient(135deg, #fde68a, #fbbf24)`,
        borderRadius: '3px 3px 4px 4px',
        boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Stries sur la bougie */}
        {[10, 20, 30].map(y => (
          <div key={y} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${y}px`,
            height: '1px',
            background: 'rgba(255,255,255,0.35)'
          }} />
        ))}
        {/* Mèche */}
        <div style={{
          position: 'absolute',
          top: '-3px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '6px',
          background: '#1f2937',
          borderRadius: '1px'
        }} />
      </div>
    </motion.div>
  );
}

const CANDLE_COUNT = 6;

export default function ChapterFinale({ onRestart }) {
  const [candlesLit, setCandlesLit] = useState(Array(CANDLE_COUNT).fill(true));
  const [allBlown, setAllBlown] = useState(false);
  const [blowPhase, setBlowPhase] = useState('candles'); // 'candles' | 'fireworks'
  const [showMessage, setShowMessage] = useState(false);

  const triggerGrandFireworks = () => {
    const duration = 12 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 2000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 60 * (timeLeft / duration);
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
    }, 350);
  };

  // Lancer les feux d'artifice automatiquement à l'arrivée sur la finale
  useEffect(() => {
    triggerGrandFireworks();
    playSFXChapterTransition();
  }, []);

  const blowCandle = (idx) => {
    const updated = [...candlesLit];
    updated[idx] = false;
    setCandlesLit(updated);

    // Dernier soufflage
    if (updated.every(lit => !lit)) {
      setAllBlown(true);
      playSFXBirthdayBlow();

      // Confetti explosion massive
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#f43f5e', '#fbbf24', '#a855f7', '#34d399', '#38bdf8', '#ffffff']
      });
      setTimeout(() => confetti({
        particleCount: 150,
        spread: 160,
        origin: { x: 0.3, y: 0.4 },
        colors: ['#fbbf24', '#f43f5e', '#ffffff']
      }), 300);
      setTimeout(() => confetti({
        particleCount: 150,
        spread: 160,
        origin: { x: 0.7, y: 0.4 },
        colors: ['#a855f7', '#38bdf8', '#34d399']
      }), 600);

      // Afficher le message magique
      setTimeout(() => {
        setBlowPhase('fireworks');
        setShowMessage(true);
        triggerGrandFireworks();
      }, 1200);
    }
  };

  const blowAllCandles = () => {
    // Animation séquentielle d'extinction des bougies
    candlesLit.forEach((lit, idx) => {
      if (lit) {
        setTimeout(() => blowCandle(idx), idx * 180);
      }
    });
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
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎆
      </motion.div>

      <h1 className="finale-title">
        Bonne fête, mon amour !
      </h1>

      <p className="finale-sub">
        Tu mérites toute la magie du monde. Aujourd'hui et chaque jour.
      </p>

      {/* Gâteau avec bougies interactives */}
      <AnimatePresence>
        {blowPhase === 'candles' && (
          <motion.div
            key="cake-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              marginBottom: '24px'
            }}
          >
            {/* Rangée de bougies au-dessus du gâteau */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'flex-end',
              marginBottom: '8px',
              padding: '8px 16px'
            }}>
              {candlesLit.map((isLit, idx) => (
                <Candle 
                  key={idx} 
                  id={idx}
                  isLit={isLit} 
                  onBlow={() => blowCandle(idx)} 
                />
              ))}
            </div>

            {/* Gâteau SVG simplifié */}
            <div style={{ fontSize: '80px', lineHeight: 1, userSelect: 'none', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.15))' }}>
              🎂
            </div>

            {/* Instruction */}
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                fontFamily: 'var(--font-serif)', 
                fontStyle: 'italic', 
                fontSize: '17px', 
                color: 'var(--rose-700)',
                marginTop: '14px',
                textAlign: 'center'
              }}
            >
              {!allBlown 
                ? `Clique sur chaque bougie pour les souffler ! (${candlesLit.filter(Boolean).length} restante${candlesLit.filter(Boolean).length > 1 ? 's' : ''} 🕯️)`
                : "✨ Vœux exaucés ! Que ta magie opère... ✨"
              }
            </motion.p>

            {/* Bouton pour tout souffler d'un coup */}
            {!allBlown && candlesLit.some(Boolean) && (
              <motion.button
                onClick={blowAllCandles}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: '14px',
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.35)'
                }}
              >
                💨 Souffler toutes les bougies !
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message après avoir soufflé */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            key="after-blow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ textAlign: 'center', marginBottom: '24px' }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '56px', marginBottom: '12px' }}
            >
              🎊
            </motion.div>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '26px',
              color: 'var(--crimson-title)',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Tous tes vœux ont été exaucés !
            </p>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: '#6b7280',
              fontSize: '17px'
            }}>
              L'univers entier t'offre tout son amour ce soir 💖
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton feux d'artifice */}
      <motion.button 
        className="fireworks-button"
        onClick={triggerGrandFireworks}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={{ boxShadow: ['0 0 25px rgba(253, 224, 71, 0.5)', '0 0 45px rgba(253, 224, 71, 0.8)', '0 0 25px rgba(253, 224, 71, 0.5)'] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        🎉 Lancer les feux d'artifice !
      </motion.button>

      <div className="finale-emojis">
        <span>💖</span>
        <span>🌸</span>
        <span>💕</span>
        <span>🌷</span>
        <span>💫</span>
        <span>🎀</span>
        <span>✨</span>
      </div>

      <div className="chapter-dots">
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
      </div>

      {onRestart && (
        <motion.button
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#fce7f3',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔄 Recommencer l'histoire
        </motion.button>
      )}

      <footer className="site-footer">
        Fait avec <span style={{ color: '#f43f5e' }}>❤️</span> rien que pour toi
      </footer>
    </motion.div>
  );
}
