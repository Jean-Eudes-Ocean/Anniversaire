import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChapterPhotos({ photos = [], onNext }) {
  const [mode, setMode] = useState('grid'); // 'grid' | 'slideshow'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);

  const goToSlide = (idx) => {
    setDirection(idx > currentSlide ? 1 : -1);
    setCurrentSlide(Math.max(0, Math.min(photos.length - 1, idx)));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50 && currentSlide < photos.length - 1) goToSlide(currentSlide + 1);
    if (delta < -50 && currentSlide > 0) goToSlide(currentSlide - 1);
    touchStartX.current = null;
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 })
  };

  return (
    <div className="chapter-content">
      <motion.div 
        className="chapter-badge"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        📸
      </motion.div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--crimson-title)', marginBottom: '10px' }}>
        Notre histoire en images
      </h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#6b7280', fontSize: '18px', maxWidth: '520px', margin: '0 auto 20px' }}>
        Chaque photo raconte un chapitre de notre histoire. Des moments volés, des instants suspendus, des sourires pour toujours.
      </p>

      {photos.length === 0 ? (
        <div className="photo-empty">
          Tes photos apparaîtront ici — ajoute-en facilement dans le panneau secret ✏️
        </div>
      ) : (
        <>
          {/* Sélecteur de mode : Grille / Diaporama */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'center', 
            marginBottom: '22px' 
          }}>
            {['grid', 'slideshow'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setCurrentSlide(0); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: '1.5px solid',
                  borderColor: mode === m ? 'var(--rose-500)' : '#fce7f3',
                  background: mode === m ? 'var(--rose-500)' : '#fff',
                  color: mode === m ? '#fff' : 'var(--rose-700)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {m === 'grid' ? '⊞ Galerie' : '▶ Diaporama'}
              </button>
            ))}
          </div>

          {/* Mode GRILLE — apparition en cascade */}
          {mode === 'grid' && (
            <div className="photos-grid">
              {photos.map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="photo-card"
                  onClick={() => setSelectedPhoto(item)}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: idx * 0.1, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  whileHover={{ scale: 1.04, y: -6, boxShadow: '0 20px 40px rgba(190,18,60,0.18)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img src={item.url} alt={item.caption || "Souvenir"} loading="lazy" />
                  {(item.caption || item.date || item.location) && (
                    <div className="photo-caption-block">
                      {item.caption && <span className="photo-caption-text">{item.caption}</span>}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        {item.date && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                            📅 {item.date}
                          </span>
                        )}
                        {item.location && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                            📍 {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Mode DIAPORAMA — plein écran avec swipe */}
          {mode === 'slideshow' && (
            <div style={{ 
              width: '100%', 
              maxWidth: '540px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  borderRadius: '20px',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                  background: '#0a0a0a',
                  cursor: 'pointer'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => setSelectedPhoto(photos[currentSlide])}
              >
                <AnimatePresence custom={direction} mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={photos[currentSlide]?.url}
                    alt={photos[currentSlide]?.caption || "Souvenir"}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ 
                      position: 'absolute', 
                      inset: 0,
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                </AnimatePresence>

                {/* Overlay info en bas */}
                {(photos[currentSlide]?.caption || photos[currentSlide]?.date || photos[currentSlide]?.location) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentSlide + '-caption'}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      padding: '32px 18px 18px',
                      color: '#fff',
                      textAlign: 'center'
                    }}
                  >
                    {photos[currentSlide]?.caption && (
                      <p style={{ 
                        fontFamily: 'var(--font-hand)', 
                        fontSize: '20px', 
                        margin: '0 0 6px',
                        textShadow: '0 1px 6px rgba(0,0,0,0.4)'
                      }}>
                        {photos[currentSlide].caption}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      {photos[currentSlide]?.date && (
                        <span style={{ fontSize: '12px', opacity: 0.85, fontStyle: 'italic' }}>
                          📅 {photos[currentSlide].date}
                        </span>
                      )}
                      {photos[currentSlide]?.location && (
                        <span style={{ fontSize: '12px', opacity: 0.85, fontStyle: 'italic' }}>
                          📍 {photos[currentSlide].location}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Indicateur "Clique pour agrandir" */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backdropFilter: 'blur(4px)'
                }}>
                  🔍 Agrandir
                </div>
              </div>

              {/* Contrôles de navigation du diaporama */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '18px' }}>
                <motion.button
                  onClick={() => goToSlide(currentSlide - 1)}
                  disabled={currentSlide === 0}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1.5px solid #fbcfe8',
                    background: currentSlide === 0 ? '#f9fafb' : '#fff',
                    color: currentSlide === 0 ? '#d1d5db' : 'var(--rose-700)',
                    fontSize: '18px',
                    cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ‹
                </motion.button>

                {/* Thumbnails miniatures */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '260px', padding: '4px' }}>
                  {photos.map((p, idx) => (
                    <motion.img
                      key={idx}
                      src={p.url}
                      alt=""
                      onClick={() => goToSlide(idx)}
                      style={{
                        width: '38px',
                        height: '38px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: currentSlide === idx ? '2.5px solid var(--rose-500)' : '2px solid transparent',
                        opacity: currentSlide === idx ? 1 : 0.55,
                        transition: 'all 0.2s'
                      }}
                      whileHover={{ opacity: 0.85 }}
                    />
                  ))}
                </div>

                <motion.button
                  onClick={() => goToSlide(currentSlide + 1)}
                  disabled={currentSlide >= photos.length - 1}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1.5px solid #fbcfe8',
                    background: currentSlide >= photos.length - 1 ? '#f9fafb' : '#fff',
                    color: currentSlide >= photos.length - 1 ? '#d1d5db' : 'var(--rose-700)',
                    fontSize: '18px',
                    cursor: currentSlide >= photos.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ›
                </motion.button>
              </div>

              {/* Compteur */}
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '10px' }}>
                {currentSlide + 1} / {photos.length}
              </p>
            </div>
          )}
        </>
      )}

      <motion.button 
        className="pill-button"
        onClick={onNext}
        style={{ marginBottom: '32px', marginTop: '28px' }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        La suite 🌹 →
      </motion.button>

      <div className="chapter-dots">
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
        <span className="p-dot active"></span>
        <span className="p-dot"></span>
        <span className="p-dot"></span>
      </div>

      {/* Lightbox plein écran */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            className="lightbox-backdrop"
            style={{
              position: 'fixed',
              top: 0, left: 0,
              width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.92)',
              zIndex: 4000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }}
            >
              <img 
                src={selectedPhoto.url} 
                alt="Aperçu grand format"
                style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} 
              />
              {(selectedPhoto.caption || selectedPhoto.date || selectedPhoto.location) && (
                <div style={{ marginTop: '16px' }}>
                  {selectedPhoto.caption && (
                    <p style={{ color: '#fff', fontStyle: 'italic', fontFamily: 'var(--font-hand)', fontSize: '22px', margin: '0 0 6px' }}>
                      {selectedPhoto.caption}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {selectedPhoto.date && (
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>📅 {selectedPhoto.date}</span>
                    )}
                    {selectedPhoto.location && (
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>📍 {selectedPhoto.location}</span>
                    )}
                  </div>
                </div>
              )}
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '12px' }}>Tap anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
