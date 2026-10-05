import React from 'react';
import { motion } from 'framer-motion';

export default function ChapterHero({ data, onNext }) {
  return (
    <motion.div 
      className="chapter-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="chapter-badge"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🎂
      </motion.div>

      <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>
        {data.title || "Joyeux Anniversaire,\nMon Amour"}
      </h1>

      <p className="hero-subtitle">
        {data.subtitle || "Chaque instant avec toi est un cadeau précieux"}
      </p>

      <div className="stars-ornament">
        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>✨</motion.span>
        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}>✨</motion.span>
        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}>✨</motion.span>
      </div>

      <div className="chapter-dots">
        <span className="p-dot active"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
      </div>

      <motion.button 
        className="pill-button"
        onClick={onNext}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        Ouvre ta surprise ✨ →
      </motion.button>
    </motion.div>
  );
}
