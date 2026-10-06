import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Gateway from './components/Gateway.jsx';
import ChapterHero from './components/ChapterHero.jsx';
import ChapterLetter from './components/ChapterLetter.jsx';
import ChapterReasons from './components/ChapterReasons.jsx';
import ChapterPhotos from './components/ChapterPhotos.jsx';
import ChapterWishes from './components/ChapterWishes.jsx';
import ChapterFinale from './components/ChapterFinale.jsx';
import SecretAdminModal from './components/SecretAdminModal.jsx';
import AmbientBackground from './components/AmbientBackground.jsx';
import AudioPlayer from './components/AudioPlayer.jsx';

import { isSupabaseConfigured, fetchBirthdayConfig, saveBirthdayConfig } from './lib/supabase';
import { 
  loadPersistentAudio, 
  loadPersistentConfig, 
  savePersistentConfig 
} from './lib/storage';
import { playSFXChapterTransition } from './lib/sfx';

// Variantes pour les transitions lumineuses dorées entre chapitres
const chapterVariants = {
  initial: { opacity: 0, y: 30, filter: 'brightness(0.8)' },
  animate: { opacity: 1, y: 0, filter: 'brightness(1)' },
  exit: { opacity: 0, y: -30, filter: 'brightness(1.3)', transition: { duration: 0.3 } }
};

// Overlay flash doré entre transitions
function GoldenFlash({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="golden-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(253,224,71,0.6), rgba(251,191,36,0.3), transparent)',
            zIndex: 3500,
            pointerEvents: 'none'
          }}
        />
      )}
    </AnimatePresence>
  );
}

const DEFAULT_DATA = {
  hero: {
    title: "Joyeux Anniversaire,\nMon Amour",
    subtitle: "Chaque instant avec toi est un cadeau précieux"
  },
  letter: {
    date: "8 OCTOBRE 2026",
    title: "Pour toi, ce jour si spécial",
    body: "Je veux que tu saches à quel point tu comptes pour moi. Tu illumines chacune de mes journées et tu rends ma vie tellement plus belle. En ce jour qui célèbre toi, je veux te dire combien je suis chanceux de t'avoir à mes côtés.\n\nPuisse cette nouvelle année t'apporter tout ce que tu mérites : bonheur, santé, et tous tes rêves réalisés.",
    signature: "Avec tout mon amour"
  },
  reasons: [
    "Ton sourire qui illumine ma journée",
    "Ta façon de rire aux éclats",
    "Ton cœur si généreux et doux",
    "Nos fous rires qui n'en finissent plus",
    "La façon dont tu me regardes",
    "Tout ce que tu es, simplement"
  ],
  wishes: [
    "Que tous tes projets et tes rêves les plus fous se réalisent cette année ✨",
    "Des rires inépuisables et des moments de bonheur pur à chaque instant 🌸",
    "Une santé éclatante et une énergie débordante pour conquérir le monde 💫",
    "Des voyages magiques et des aventures inoubliables ensemble ✈️",
    "Mon amour infini, toujours à tes côtés quoi qu'il arrive 💖"
  ],
  photos: [],
  music: {
    url: null,
    name: "Mélodie romantique féerique"
  }
};

export default function App() {
  const [siteData, setSiteData] = useState(() => {
    try {
      const saved = localStorage.getItem('birthday_data_react');
      if (saved) return { ...DEFAULT_DATA, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return DEFAULT_DATA;
  });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [customMusicUrl, setCustomMusicUrl] = useState(() => siteData.music?.url || null);
  const [customMusicName, setCustomMusicName] = useState(() => siteData.music?.name || null);
  const [autoPlayMusic, setAutoPlayMusic] = useState(false);
  const [showGoldenFlash, setShowGoldenFlash] = useState(false);

  // Navigation entre chapitres avec effet doré et son
  const goToChapter = useCallback((num) => {
    playSFXChapterTransition();
    setShowGoldenFlash(true);
    setTimeout(() => setShowGoldenFlash(false), 700);
    setTimeout(() => setCurrentChapter(num), 150);
  }, []);

  // Chargement persistant au démarrage (Musique + Configuration complète)
  useEffect(() => {
    async function initPersistentData() {
      // 1. Charger la musique MP3 persistante locale depuis IndexedDB
      try {
        const savedAudio = await loadPersistentAudio();
        if (savedAudio && savedAudio.url) {
          setCustomMusicUrl(savedAudio.url);
          setCustomMusicName(savedAudio.name);
        }
      } catch (e) {
        console.warn("Erreur chargement audio local:", e);
      }

      // 2. Charger les données persistantes depuis IndexedDB
      try {
        const idbConfig = await loadPersistentConfig();
        if (idbConfig) {
          setSiteData(prev => ({ ...prev, ...idbConfig }));
          if (idbConfig.music?.url) {
            setCustomMusicUrl(idbConfig.music.url);
            setCustomMusicName(idbConfig.music.name);
          }
        }
      } catch (e) {
        console.warn("Erreur chargement config IndexedDB:", e);
      }

      // 3. Synchronisation cloud Supabase (priorité absolue si connectée)
      if (isSupabaseConfigured()) {
        try {
          const cloudConfig = await fetchBirthdayConfig();
          if (cloudConfig) {
            const merged = { ...DEFAULT_DATA, ...cloudConfig };
            setSiteData(merged);
            if (cloudConfig.music?.url) {
              setCustomMusicUrl(cloudConfig.music.url);
              setCustomMusicName(cloudConfig.music.name);
            }
            localStorage.setItem('birthday_data_react', JSON.stringify(merged));
            await savePersistentConfig(merged);
          }
        } catch (e) {
          console.warn("Erreur sync Supabase silencieuse:", e);
        }
      }
    }

    initPersistentData();
  }, []);

  // Sauvegarde persistante (IndexedDB + LocalStorage + Supabase Cloud)
  const handleSaveData = async (newData) => {
    const dataToSave = {
      ...newData,
      music: {
        url: customMusicUrl || newData.music?.url || null,
        name: customMusicName || newData.music?.name || "Mélodie romantique féerique"
      }
    };

    setSiteData(dataToSave);

    // 1. LocalStorage
    try {
      localStorage.setItem('birthday_data_react', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Storage save error:", e);
    }

    // 2. IndexedDB
    try {
      await savePersistentConfig(dataToSave);
    } catch (e) {
      console.warn("IndexedDB save error:", e);
    }

    // 3. Supabase Cloud
    if (isSupabaseConfigured()) {
      try {
        const result = await saveBirthdayConfig(dataToSave);
        if (!result?.success) {
          console.warn("Avertissement sauvegarde Supabase:", result?.error);
        }
      } catch (e) {
        console.warn("Supabase save error:", e);
      }
    }
  };

  const handleMusicChange = (url, name) => {
    setCustomMusicUrl(url);
    setCustomMusicName(name);

    const updated = {
      ...siteData,
      music: { url, name }
    };
    handleSaveData(updated);
  };

  const handleUnlockGateway = () => {
    setIsUnlocked(true);
    setAutoPlayMusic(true);
  };

  return (
    <div className={`app-container ${currentChapter === 6 ? 'is-finale' : ''}`}>
      <AmbientBackground />

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <Gateway key="gateway" onUnlock={handleUnlockGateway} />
        ) : (
          <motion.div 
            key="story-flow"
            className="story-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait">
              {currentChapter === 1 && (
                <motion.div key="ch1" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%' }}>
                  <ChapterHero 
                    data={siteData.hero} 
                    onNext={() => goToChapter(2)} 
                  />
                </motion.div>
              )}

              {currentChapter === 2 && (
                <motion.div key="ch2" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%' }}>
                  <ChapterLetter 
                    data={siteData.letter} 
                    onNext={() => goToChapter(3)} 
                  />
                </motion.div>
              )}

              {currentChapter === 3 && (
                <motion.div key="ch3" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%' }}>
                  <ChapterReasons 
                    reasons={siteData.reasons} 
                    onNext={() => goToChapter(4)} 
                  />
                </motion.div>
              )}

              {currentChapter === 4 && (
                <motion.div key="ch4" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%' }}>
                  <ChapterPhotos 
                    photos={siteData.photos} 
                    onNext={() => goToChapter(5)} 
                  />
                </motion.div>
              )}

              {currentChapter === 5 && (
                <motion.div key="ch5" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%' }}>
                  <ChapterWishes 
                    wishes={siteData.wishes} 
                    onNext={() => goToChapter(6)} 
                  />
                </motion.div>
              )}

              {currentChapter === 6 && (
                <motion.div key="ch6" variants={chapterVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ChapterFinale onRestart={() => goToChapter(1)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fleur secrète + code 1202 pour éditer */}
      <SecretAdminModal 
        data={siteData} 
        onSave={handleSaveData} 
        onMusicChange={handleMusicChange}
        currentMusicName={customMusicName}
        currentMusicUrl={customMusicUrl}
      />

      {/* Lecteur de musique flottant */}
      <AudioPlayer 
        customAudioUrl={customMusicUrl} 
        autoPlayTrigger={autoPlayMusic} 
      />

      {/* Flash doré entre les chapitres */}
      <GoldenFlash visible={showGoldenFlash} />
    </div>
  );
}
