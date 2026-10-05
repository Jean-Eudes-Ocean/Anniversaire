import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ChapterWishes({ wishes = [], onNext }) {
  const [flippedCards, setFlippedCards] = useState({});

  const toggleCard = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="chapter-content">
      <motion.div 
        className="chapter-badge"
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌠
      </motion.div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--crimson-title)', marginBottom: '10px' }}>
        Mes vœux pour toi
      </h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#6b7280', fontSize: '18px', marginBottom: '28px' }}>
        Appuie sur chaque carte pour découvrir un vœu
      </p>

      <div className="wishes-container">
        {wishes.map((wish, idx) => {
          const isFlipped = !!flippedCards[idx];

          return (
            <div key={idx} className="wish-card-box">
              <motion.div 
                className="wish-card-inner"
                onClick={() => toggleCard(idx)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="wish-front">
                  <span className="wish-num">#{idx + 1}</span>
                  <span className="wish-hint">Touche-moi ✨</span>
                </div>
                <div className="wish-back">
                  <p className="wish-content">{wish}</p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <motion.button 
        className="pill-button"
        onClick={onNext}
        style={{ marginBottom: '32px' }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        La grande finale 🎆 →
      </motion.button>

      <div className="chapter-dots">
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
        <span className="p-dot"></span>
      </div>
    </div>
  );
}
