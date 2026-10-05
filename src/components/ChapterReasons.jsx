import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSFXPolaroidPop } from '../lib/sfx';

const STICKERS = ['🍓', '🧸', '🎀', '✨', '🌸', '💌', '🌷', '🧁'];
const ROTATIONS = [-3, 2, -2, 3, -1, 2];
const CARD_COLORS = [
  '#fff9fa', '#fef5ff', '#f0feff', '#fffef0', '#f0fff4', '#fef5f0'
];

export default function ChapterReasons({ reasons = [], onNext }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState(0);

  const handleNextCard = () => {
    if (currentIndex < reasons.length - 1) {
      playSFXPolaroidPop();
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    playSFXPolaroidPop();
    setCurrentIndex(0);
  };

  const isLastCard = currentIndex >= reasons.length - 1;

  return (
    <div className="chapter-content">
      <motion.div 
        className="chapter-badge"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        💖
      </motion.div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--crimson-title)', marginBottom: '10px' }}>
        {reasons.length} raisons de t'aimer
      </h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#6b7280', fontSize: '18px', marginBottom: '24px' }}>
        Glisse ou tape sur chaque carte pour découvrir la suivante...
      </p>

      {/* Indicateur de progression */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        justifyContent: 'center', 
        marginBottom: '18px',
        height: '6px'
      }}>
        {reasons.map((_, idx) => (
          <motion.div
            key={idx}
            style={{
              width: idx === currentIndex ? '24px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: idx <= currentIndex ? 'var(--rose-500)' : '#fce7f3',
              transition: 'width 0.3s ease, background 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Scène de cartes empilées */}
      <div className="polaroids-stage">
        <AnimatePresence mode="popLayout">
          {reasons.slice(currentIndex, currentIndex + 3).map((reason, i) => {
            const actualIndex = currentIndex + i;
            const isTop = i === 0;
            const sticker = STICKERS[actualIndex % STICKERS.length];
            const rotation = ROTATIONS[actualIndex % ROTATIONS.length];
            const cardBg = CARD_COLORS[actualIndex % CARD_COLORS.length];

            // Photo associée à cette raison (si disponible dans l'objet)
            const reasonObj = typeof reason === 'object' ? reason : { text: reason };
            const reasonText = reasonObj.text || reason;
            const reasonPhoto = reasonObj.photo || null;

            return (
              <motion.div
                key={actualIndex}
                className="polaroid-card"
                style={{
                  zIndex: 10 - i,
                  transformOrigin: 'bottom center',
                  background: cardBg,
                  touchAction: 'pan-y' // Permet swipe vertical pour scroll, horizontal pour carte
                }}
                initial={{ scale: 0.9 - i * 0.05, y: i * 14, opacity: 0 }}
                animate={{ 
                  scale: 1 - i * 0.05, 
                  y: i * 14, 
                  rotate: isTop ? rotation : rotation * 0.6,
                  opacity: 1 
                }}
                exit={{ 
                  x: dragDirection >= 0 ? 380 : -380, 
                  rotate: dragDirection >= 0 ? 25 : -25, 
                  opacity: 0, 
                  transition: { duration: 0.42, ease: [0.32, 0, 0.67, 0] } 
                }}
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: -60, right: 60 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 70 && !isLastCard) {
                    setDragDirection(info.offset.x);
                    handleNextCard();
                  }
                }}
                onClick={() => {
                  if (isTop && !isLastCard) handleNextCard();
                }}
                whileTap={isTop ? { scale: 0.97 } : {}}
              >
                {/* Washi Masking Tape en haut */}
                <div className="washi-tape"></div>

                {/* Photo dans le polaroid si disponible */}
                {reasonPhoto && (
                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'
                  }}>
                    <img 
                      src={reasonPhoto} 
                      alt="Souvenir" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                )}

                <div className="polaroid-header">
                  <span className="polaroid-badge">
                    Raison #{String(actualIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="polaroid-sticker">{sticker}</span>
                </div>

                <div className="polaroid-text">
                  "{reasonText}"
                </div>

                {isTop && (
                  <div className="polaroid-tap-hint">
                    {!isLastCard ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <motion.span
                          animate={{ x: [0, 6, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          👉
                        </motion.span>
                        Glisse ou tape pour la suivante
                      </span>
                    ) : (
                      "✨ Toutes découvertes avec amour"
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '32px' }}>
        {currentIndex > 0 && (
          <button 
            onClick={handleReset}
            style={{
              background: '#fff',
              border: '1px solid #fbcfe8',
              color: 'var(--rose-700)',
              borderRadius: '9999px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ↺ Revoir depuis le début
          </button>
        )}

        <motion.button 
          className="pill-button"
          onClick={onNext}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Encore plus loin 💫 →
        </motion.button>
      </div>

      <div className="chapter-dots">
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
      </div>
    </div>
  );
}
