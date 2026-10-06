import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  uploadPhotoToSupabase 
} from '../lib/supabase';
import { savePersistentAudio, removePersistentAudio } from '../lib/storage';

export default function SecretAdminModal({ 
  data, 
  onSave, 
  onMusicChange, 
  currentMusicName,
  currentMusicUrl 
}) {
  const [flowerTaps, setFlowerTaps] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('textes');

  // Form state
  const [formData, setFormData] = useState(data);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio preview state
  const [musicFileName, setMusicFileName] = useState(currentMusicName || "Mélodie romantique féerique (intégrée)");
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicUploadSuccess, setMusicUploadSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  // Photo URL input
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // Musique via URL directe
  const [musicLinkInput, setMusicLinkInput] = useState('');

  const flowerTimerRef = useRef(null);
  const pinInputRef = useRef(null);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  useEffect(() => {
    if (currentMusicName) {
      setMusicFileName(currentMusicName);
    }
  }, [currentMusicName]);

  // Focus automatique du champ PIN à l'ouverture
  useEffect(() => {
    if (showPinModal && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [showPinModal]);

  // Gestion des clics sur la fleur secrète
  const handleFlowerClick = () => {
    if (showDrawer) return;

    setFlowerTaps(prev => {
      const next = prev + 1;
      if (flowerTimerRef.current) clearTimeout(flowerTimerRef.current);

      flowerTimerRef.current = setTimeout(() => {
        setFlowerTaps(0);
      }, 4000);

      if (next >= 5) {
        setFlowerTaps(0);
        setShowPinModal(true);
        setPin('');
        setPinError(false);
      }
      return next;
    });
  };

  const handlePinSubmit = () => {
    if (pin.trim() === '1202') {
      setShowPinModal(false);
      setShowDrawer(true);
      setFormData(data);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  // Permet de taper le code au clavier physique ou via le pavé tactile
  const handleKeyDownPin = (e) => {
    if (e.key === 'Enter') {
      handlePinSubmit();
    } else if (e.key === 'Backspace') {
      setPin(prev => prev.slice(0, -1));
      setPinError(false);
    } else if (/^[0-9]$/.test(e.key)) {
      if (pin.length < 4) {
        setPin(prev => prev + e.key);
        setPinError(false);
      }
    }
  };

  // Sauvegarde globale de toutes les modifications
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.warn("Erreur sauvegarde:", e);
      alert("Erreur lors de la sauvegarde : " + (e.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  // Upload musique avec persistance permanente garantie
  const handleMusicUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploadingMusic(true);
    setMusicUploadSuccess(false);

    try {
      const result = await savePersistentAudio(file);
      if (result) {
        const effectiveUrl = result.cloudUrl || result.blobUrl;
        setMusicFileName(result.name);
        if (typeof onMusicChange === 'function') {
          onMusicChange(effectiveUrl, result.name);
        }
        setMusicUploadSuccess(true);
        setTimeout(() => setMusicUploadSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Erreur enregistrement musique:", err);
      alert("Impossible d'enregistrer ce fichier audio. Réessaie avec un fichier MP3.");
    } finally {
      setIsUploadingMusic(false);
      e.target.value = '';
    }
  };

  // Appliquer une URL directe de musique
  const handleApplyMusicUrl = () => {
    if (!musicLinkInput.trim()) return;
    const url = musicLinkInput.trim();
    const name = url.split('/').pop()?.split('?')[0] || "Musique personnalisée (Lien direct)";
    setMusicFileName(name);
    if (typeof onMusicChange === 'function') {
      onMusicChange(url, name);
    }
    setMusicUploadSuccess(true);
    setMusicLinkInput('');
    setTimeout(() => setMusicUploadSuccess(false), 4000);
  };

  // Réinitialiser la musique et revenir à la berceuse romantique par défaut
  const handleResetMusic = async () => {
    if (previewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    }
    await removePersistentAudio();
    const defaultName = "Mélodie romantique féerique (intégrée)";
    setMusicFileName(defaultName);
    if (typeof onMusicChange === 'function') {
      onMusicChange(null, defaultName);
    }
  };

  // Lecture / Pause de l'aperçu audio dans le panneau admin
  const togglePreviewAudio = () => {
    if (!currentMusicUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(currentMusicUrl);
      previewAudioRef.current.onended = () => setPreviewPlaying(false);
    } else {
      if (previewAudioRef.current.src !== currentMusicUrl) {
        previewAudioRef.current.src = currentMusicUrl;
      }
    }

    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play()
        .then(() => setPreviewPlaying(true))
        .catch(e => console.warn("Erreur lecture aperçu:", e));
    }
  };

  // Upload photos (fichiers locaux ou URLs)
  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);

    for (const file of Array.from(files)) {
      try {
        const publicUrl = await uploadPhotoToSupabase(file);
        if (publicUrl) {
          setFormData(prev => ({
            ...prev,
            photos: [...(prev.photos || []), { url: publicUrl, caption: file.name.replace(/\.[^/.]+$/, "") }]
          }));
        } else {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            setFormData(prev => ({
              ...prev,
              photos: [...(prev.photos || []), { url: loadEvent.target.result, caption: file.name.replace(/\.[^/.]+$/, "") }]
            }));
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        console.warn("Upload photo fallback:", err);
      }
    }

    setIsUploadingPhoto(false);
    e.target.value = '';
  };

  const handleAddPhotoByUrl = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), { url: newPhotoUrl.trim(), caption: newPhotoCaption.trim() || "Souvenir précieux" }]
    }));
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  return (
    <>
      {/* Bouton Fleur secrète en bas à gauche */}
      <div className="flower-trigger" onClick={handleFlowerClick} title="Une jolie fleur (Clique 5 fois pour ouvrir les réglages secrets)">
        <motion.button 
          className="flower-btn"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          aria-label="Fleur secrète"
        >
          🌸
          {flowerTaps > 0 && (
            <span className="flower-badge">{flowerTaps}/5</span>
          )}
        </motion.button>
      </div>

      {/* Modale PIN sécurisée */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            className="pin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPinModal(false)}
          >
            <motion.div 
              className="pin-card"
              initial={{ scale: 0.85, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="pin-close" onClick={() => setShowPinModal(false)}>✕</button>
              
              <div style={{ fontSize: '38px', marginBottom: '8px' }}>🔐</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>
                Espace Personnalisation
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Entre le code secret à 4 chiffres (indice : 1202) :
              </p>

              {/* Champ PIN interactif (clavier physique + virtuel) */}
              <input 
                ref={pinInputRef}
                type="password"
                maxLength={4}
                value={pin}
                onKeyDown={handleKeyDownPin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setPinError(false);
                }}
                placeholder="••••"
                style={{
                  width: '160px',
                  height: '48px',
                  fontSize: '28px',
                  textAlign: 'center',
                  letterSpacing: '0.35em',
                  borderRadius: '14px',
                  border: pinError ? '2px solid #ef4444' : '2px solid #fbcfe8',
                  background: '#fdf2f8',
                  outline: 'none',
                  marginBottom: '12px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                  color: '#831843'
                }}
              />

              {pinError && (
                <motion.p 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}
                >
                  ❌ Code incorrect. Réessaie !
                </motion.p>
              )}

              {/* Clavier numérique */}
              <div className="pin-keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    className="keypad-button"
                    onClick={() => { 
                      if (pin.length < 4) {
                        setPin(prev => prev + num); 
                        setPinError(false);
                      }
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button 
                  className="keypad-button keypad-clear" 
                  onClick={() => { setPin(''); setPinError(false); }}
                  title="Effacer"
                >
                  C
                </button>
                <button 
                  className="keypad-button" 
                  onClick={() => { 
                    if (pin.length < 4) {
                      setPin(prev => prev + '0'); 
                      setPinError(false);
                    }
                  }}
                >
                  0
                </button>
                <button 
                  className="keypad-button keypad-submit" 
                  onClick={handlePinSubmit}
                  title="Valider"
                >
                  ✓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiroir d'Administration Luxueux, Épuré et 100% Dédié aux Amoureux */}
      <AnimatePresence>
        {showDrawer && (
          <motion.aside 
            className="admin-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header du panneau */}
            <div className="admin-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>✨</span>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--crimson-title)', margin: 0 }}>
                    Personnaliser le site
                  </h2>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                    Toutes tes modifications sont conservées pour toujours
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Onglets de navigation sans aucun jargon technique */}
            <nav className="admin-tabs">
              {[
                { id: 'textes', label: '✍️ Textes' },
                { id: 'raisons', label: '💖 Raisons' },
                { id: 'voeux', label: '🌠 Vœux' },
                { id: 'photos', label: '📷 Photos' },
                { id: 'musique', label: '🎵 Musique' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Corps du panneau d'administration */}
            <div className="admin-body">
              {/* ================= Onglet 1 : Textes ================= */}
              {activeTab === 'textes' && (
                <div>
                  <div style={{ background: '#fff5f8', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #fbcfe8' }}>
                    <p style={{ fontSize: '12px', color: 'var(--rose-700)', margin: 0, fontWeight: '600' }}>
                      💌 Personnalise les mots doux affichés sur l'écran d'accueil et dans la lettre d'amour.
                    </p>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎂</span> Page d'accueil (Chapitre 1)
                  </h4>
                  <div className="form-group">
                    <label>Titre principal</label>
                    <input 
                      type="text" 
                      value={formData.hero.title}
                      onChange={e => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sous-titre d'accueil</label>
                    <input 
                      type="text" 
                      value={formData.hero.subtitle}
                      onChange={e => setFormData({ ...formData, hero: { ...formData.hero, subtitle: e.target.value } })}
                    />
                  </div>

                  <div style={{ height: '1px', background: '#f3f4f6', margin: '22px 0' }} />

                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✉️</span> Lettre d'amour dans l'enveloppe (Chapitre 2)
                  </h4>
                  <div className="form-group">
                    <label>Date de la lettre</label>
                    <input 
                      type="text" 
                      value={formData.letter.date}
                      onChange={e => setFormData({ ...formData, letter: { ...formData.letter, date: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Titre de la lettre</label>
                    <input 
                      type="text" 
                      value={formData.letter.title}
                      onChange={e => setFormData({ ...formData, letter: { ...formData.letter, title: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Corps de la lettre</label>
                    <textarea 
                      rows={7}
                      value={formData.letter.body}
                      onChange={e => setFormData({ ...formData, letter: { ...formData.letter, body: e.target.value } })}
                      style={{ lineHeight: 1.6 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Signature amoureuse</label>
                    <input 
                      type="text" 
                      value={formData.letter.signature}
                      onChange={e => setFormData({ ...formData, letter: { ...formData.letter, signature: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {/* ================= Onglet 2 : Raisons de t'aimer ================= */}
              {activeTab === 'raisons' && (
                <div>
                  <div style={{ background: '#fff5f8', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #fbcfe8' }}>
                    <p style={{ fontSize: '12px', color: 'var(--rose-700)', margin: 0, fontWeight: '600' }}>
                      🎀 Chaque raison s'affiche sur un Polaroïd interactif avec stickers mignons (🍓, 🧸, 🎀, ✨).
                    </p>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', color: '#1f2937' }}>
                    Liste des raisons ({formData.reasons.length})
                  </h4>

                  {formData.reasons.map((r, i) => {
                    const reasonObj = typeof r === 'object' ? r : { text: r, photo: null };
                    return (
                      <div key={i} style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '10px 12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--rose-700)', background: '#fce7f3', padding: '5px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                            #{i + 1}
                          </span>
                          <input 
                            type="text" 
                            value={reasonObj.text || ''}
                            placeholder="Ta raison ici..."
                            style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                            onChange={e => {
                              const updated = [...formData.reasons];
                              updated[i] = { ...reasonObj, text: e.target.value };
                              setFormData({ ...formData, reasons: updated });
                            }}
                          />
                          <button 
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '32px', height: '36px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                            onClick={() => { setFormData({ ...formData, reasons: formData.reasons.filter((_, idx) => idx !== i) }); }}
                            title="Supprimer"
                          >✕</button>
                        </div>
                        {/* Optionnel : photo associée au polaroid */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>📷 Photo (optionnel) :</span>
                          <input 
                            type="text" 
                            value={reasonObj.photo || ''}
                            placeholder="URL d'une photo à afficher dans ce Polaroïd..."
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px', outline: 'none', color: '#6b7280' }}
                            onChange={e => {
                              const updated = [...formData.reasons];
                              updated[i] = { ...reasonObj, photo: e.target.value };
                              setFormData({ ...formData, reasons: updated });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <button 
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#fdf2f8', 
                      color: 'var(--rose-700)', 
                      border: '1px dashed #f472b6', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: '700', 
                      fontSize: '13px',
                      marginTop: '8px' 
                    }}
                    onClick={() => setFormData({ ...formData, reasons: [...formData.reasons, { text: "Ton doux regard qui me rassure...", photo: null }] })}
                  >
                    + Ajouter une nouvelle raison
                  </button>
                </div>
              )}

              {/* ================= Onglet 3 : Vœux d'anniversaire ================= */}
              {activeTab === 'voeux' && (
                <div>
                  <div style={{ background: '#fff5f8', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #fbcfe8' }}>
                    <p style={{ fontSize: '12px', color: 'var(--rose-700)', margin: 0, fontWeight: '600' }}>
                      🌠 Ces vœux sont cachés au dos des 5 cartes 3D dorées que l'on retourne en cliquant dessus.
                    </p>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', color: '#1f2937' }}>
                    Les 5 vœux magiques
                  </h4>

                  {formData.wishes.map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '800', 
                        color: '#d97706', 
                        background: '#fef3c7', 
                        padding: '6px 10px', 
                        borderRadius: '8px',
                        marginTop: '4px'
                      }}>
                        Vœu #{i + 1}
                      </span>
                      <textarea 
                        rows={2}
                        value={w}
                        style={{ 
                          flex: 1, 
                          padding: '10px 12px', 
                          borderRadius: '10px', 
                          border: '1px solid #e5e7eb', 
                          fontSize: '13px', 
                          resize: 'vertical',
                          outline: 'none',
                          lineHeight: 1.4
                        }}
                        onChange={e => {
                          const updated = [...formData.wishes];
                          updated[i] = e.target.value;
                          setFormData({ ...formData, wishes: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ================= Onglet 4 : Photos ================= */}
              {activeTab === 'photos' && (
                <div>
                  <div style={{ background: '#fff5f8', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #fbcfe8' }}>
                    <p style={{ fontSize: '12px', color: 'var(--rose-700)', margin: 0, fontWeight: '600' }}>
                      📷 Ajoute vos plus belles photos de couple avec une jolie légende pour la galerie souvenir.
                    </p>
                  </div>

                  {/* Upload fichier image */}
                  <label 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      border: '2px dashed #fbcfe8',
                      borderRadius: '16px',
                      background: '#fffbfd',
                      cursor: 'pointer',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '32px', marginBottom: '4px' }}>🖼️</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--rose-700)' }}>
                      Choisir des photos depuis ton appareil
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      (JPG, PNG, WebP)
                    </span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Ou ajouter par lien URL */}
                  <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Ou ajouter via un lien web direct :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="url"
                        placeholder="https://exemple.com/ma-photo.jpg"
                        value={newPhotoUrl}
                        onChange={e => setNewPhotoUrl(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          placeholder="Légende (ex: Notre premier voyage)"
                          value={newPhotoCaption}
                          onChange={e => setNewPhotoCaption(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }}
                        />
                        <button
                          onClick={handleAddPhotoByUrl}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--rose-600)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          + Ajouter
                        </button>
                      </div>
                    </div>
                  </div>

                  {isUploadingPhoto && (
                    <div style={{ padding: '12px', background: '#fdf2f8', borderRadius: '10px', textAlign: 'center', marginBottom: '14px' }}>
                      <p style={{ color: 'var(--rose-600)', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                        ⏳ Traitement et enregistrement de tes photos...
                      </p>
                    </div>
                  )}

                  {/* Grille de prévisualisation */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {(formData.photos || []).map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                        <img src={p.url} alt="Aperçu" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                        <button 
                          style={{ 
                            position: 'absolute', 
                            top: '6px', 
                            right: '6px', 
                            background: 'rgba(0,0,0,0.65)', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '26px', 
                            height: '26px', 
                            cursor: 'pointer', 
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== idx) })}
                          title="Supprimer la photo"
                        >
                          ✕
                        </button>
                        <div style={{ background: '#fff', borderTop: '1px solid #f3f4f6', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input 
                            type="text"
                            placeholder="💬 Légende..."
                            value={p.caption || ''}
                            style={{ width: '100%', padding: '5px 7px', fontSize: '11px', border: '1px solid #f3f4f6', borderRadius: '6px', outline: 'none' }}
                            onChange={(e) => {
                              const updated = formData.photos.map((ph, i) => i === idx ? { ...ph, caption: e.target.value } : ph);
                              setFormData({ ...formData, photos: updated });
                            }}
                          />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              type="text"
                              placeholder="📅 Date..."
                              value={p.date || ''}
                              style={{ flex: 1, padding: '5px 7px', fontSize: '10px', border: '1px solid #f3f4f6', borderRadius: '6px', outline: 'none' }}
                              onChange={(e) => {
                                const updated = formData.photos.map((ph, i) => i === idx ? { ...ph, date: e.target.value } : ph);
                                setFormData({ ...formData, photos: updated });
                              }}
                            />
                            <input 
                              type="text"
                              placeholder="📍 Lieu..."
                              value={p.location || ''}
                              style={{ flex: 1, padding: '5px 7px', fontSize: '10px', border: '1px solid #f3f4f6', borderRadius: '6px', outline: 'none' }}
                              onChange={(e) => {
                                const updated = formData.photos.map((ph, i) => i === idx ? { ...ph, location: e.target.value } : ph);
                                setFormData({ ...formData, photos: updated });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= Onglet 5 : Musique d'ambiance avec PERSISTANCE PERMANENTE ================= */}
              {activeTab === 'musique' && (
                <div>
                  <div style={{ background: '#fff5f8', padding: '14px', borderRadius: '14px', marginBottom: '18px', border: '1px solid #fbcfe8' }}>
                    <p style={{ fontSize: '13px', color: 'var(--rose-700)', margin: '0 0 6px', fontWeight: '700' }}>
                      🎵 Musique d'ambiance romantique
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                      Importe ta propre chanson MP3 préférée. Elle est <strong>sauvegardée de façon permanente</strong> sur cet appareil et se rejoue automatiquement à chaque visite de ta copine !
                    </p>
                  </div>

                  {/* Carte d'état de la musique active */}
                  <div style={{ 
                    padding: '16px', 
                    background: '#ffffff', 
                    borderRadius: '16px', 
                    border: '1.5px solid #fce7f3', 
                    boxShadow: '0 4px 15px rgba(244, 114, 182, 0.08)',
                    marginBottom: '20px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '26px' }}>🎧</span>
                        <div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '800', margin: 0 }}>
                            Piste actuellement activée :
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--rose-700)', margin: '2px 0 0' }}>
                            {musicFileName}
                          </p>
                        </div>
                      </div>

                      {/* Mini lecteur d'écoute intégrée si custom audio */}
                      {currentMusicUrl && (
                        <button
                          onClick={togglePreviewAudio}
                          style={{
                            padding: '8px 14px',
                            background: previewPlaying ? '#ef4444' : 'var(--rose-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Tester l'écoute de cette musique"
                        >
                          {previewPlaying ? '⏸ Pause' : '▶ Écouter'}
                        </button>
                      )}
                    </div>

                    {/* Bouton pour revenir à la mélodie douce */}
                    {musicFileName !== "Mélodie romantique féerique (intégrée)" && (
                      <div style={{ borderTop: '1px solid #f9fafb', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={handleResetMusic}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            padding: '4px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ↺ Revenir à la mélodie par défaut
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Zone d'importation de fichier MP3 */}
                  <label 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '28px 20px',
                      border: '2px dashed #f472b6',
                      borderRadius: '16px',
                      background: '#fff9fb',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '36px', marginBottom: '8px' }}>🎼</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--rose-700)' }}>
                      {isUploadingMusic ? "⏳ Sauvegarde permanente du fichier audio en cours..." : "Clique ici pour importer ta musique (MP3)"}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      (Prend en charge tous les fichiers .mp3, .wav, .m4a, .aac)
                    </span>
                    <input 
                      type="file" 
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      disabled={isUploadingMusic}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Option URL audio directe */}
                  <div style={{ marginTop: '16px', background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#374151', margin: '0 0 8px' }}>
                      🔗 Ou colle directement un lien MP3 (URL web) :
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="url" 
                        placeholder="https://.../musique.mp3"
                        value={musicLinkInput}
                        onChange={e => setMusicLinkInput(e.target.value)}
                        style={{ 
                          flex: 1, 
                          padding: '10px 12px', 
                          borderRadius: '10px', 
                          border: '1px solid #e5e7eb', 
                          fontSize: '13px',
                          background: '#ffffff'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyMusicUrl}
                        style={{ 
                          padding: '10px 16px', 
                          background: 'var(--rose-600)', 
                          color: '#ffffff', 
                          border: 'none', 
                          borderRadius: '10px', 
                          fontWeight: '700', 
                          fontSize: '12px', 
                          cursor: 'pointer' 
                        }}
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>

                  {/* Message de confirmation instantanée après upload */}
                  {musicUploadSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ 
                        marginTop: '16px', 
                        padding: '12px', 
                        background: '#ecfdf5', 
                        border: '1px solid #a7f3d0', 
                        borderRadius: '12px',
                        textAlign: 'center' 
                      }}
                    >
                      <p style={{ color: '#065f46', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                        ✅ Musique enregistrée avec succès ! Elle restera même après actualisation de la page.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Pied du tiroir avec bouton de sauvegarde principal */}
            <div className="admin-footer">
              <button 
                className="admin-save-btn" 
                onClick={handleSave} 
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(225, 29, 72, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {isSaving ? "⏳ Enregistrement permanent en cours..." : "💾 Enregistrer toutes les modifications"}
              </button>

              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '10px', textAlign: 'center' }}
                >
                  <p style={{ color: '#059669', fontSize: '13px', fontWeight: '800', margin: '4px 0' }}>
                    ✨ Toutes tes modifications sont bien enregistrées !
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                    Elles sont sauvegardées sur cet appareil et restent prêtes pour son anniversaire 💖
                  </p>
                </motion.div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
