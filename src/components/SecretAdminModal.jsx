import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  uploadPhotoToSupabase,
  diagnoseSyncStatus
} from '../lib/supabase';

export default function SecretAdminModal({ 
  data, 
  onSave
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // '' | 'uploading' | 'done' | 'error'
  const [diagStatus, setDiagStatus] = useState(null);   // null | objet de diagnostic
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Photo URL input
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const flowerTimerRef = useRef(null);
  const pinInputRef = useRef(null);
  // Référence mutable pour le formData courant (utile dans les callbacks async)
  const formDataRef = useRef(formData);

  useEffect(() => {
    setFormData(data);
    formDataRef.current = data;
  }, [data]);

  // Mise à jour de la ref à chaque changement de formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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

  // Upload photos avec auto-sauvegarde immédiate dans Supabase Storage
  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    setUploadStatus('uploading');
    setDiagStatus(null);

    let newPhotos = [];
    let failedFiles = [];

    for (const file of Array.from(files)) {
      try {
        const publicUrl = await uploadPhotoToSupabase(file);
        if (publicUrl) {
          newPhotos.push({ url: publicUrl, caption: file.name.replace(/\.[^/.]+$/, '') });
        } else {
          failedFiles.push(file.name);
        }
      } catch (err) {
        failedFiles.push(file.name);
        console.warn('Upload photo error:', err);
      }
    }

    if (newPhotos.length > 0) {
      const updatedData = {
        ...formDataRef.current,
        photos: [...(formDataRef.current.photos || []), ...newPhotos]
      };
      setFormData(updatedData);

      try {
        setIsSaving(true);
        await onSave(updatedData);
        setUploadStatus('done');
        setTimeout(() => setUploadStatus(''), 5000);
      } catch (err) {
        console.warn('Auto-save error after photo upload:', err);
        setUploadStatus('save_error');
        setTimeout(() => setUploadStatus(''), 6000);
      } finally {
        setIsSaving(false);
      }
    } else if (failedFiles.length > 0) {
      // Aucun upload réussi → problème avec le bucket Storage
      setUploadStatus('storage_error');
      setTimeout(() => setUploadStatus(''), 8000);
    }

    setIsUploadingPhoto(false);
    e.target.value = '';
  };

  // Diagnostic : vérifier l'état de Supabase en temps réel
  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setDiagStatus(null);
    try {
      const result = await diagnoseSyncStatus();
      setDiagStatus(result);
    } catch (err) {
      setDiagStatus({ error: err.message });
    } finally {
      setIsDiagnosing(false);
    }
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
                Entre le code secret à 4 chiffres :
              </p>

              {/* Formulaire avec clavier natif PC & Téléphone */}
              <form onSubmit={e => { e.preventDefault(); handlePinSubmit(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input 
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  maxLength={4}
                  value={pin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                    setPinError(false);
                    if (val.length === 4) {
                      if (val === '1202') {
                        setTimeout(() => {
                          setShowPinModal(false);
                          setShowDrawer(true);
                          setFormData(data);
                          setPinError(false);
                        }, 150);
                      } else {
                        setPinError(true);
                        setTimeout(() => setPin(''), 700);
                      }
                    }
                  }}
                  placeholder="••••"
                  autoFocus
                  style={{
                    width: '180px',
                    height: '52px',
                    fontSize: '32px',
                    textAlign: 'center',
                    letterSpacing: '0.4em',
                    borderRadius: '16px',
                    border: pinError ? '2px solid #ef4444' : '2px solid #fbcfe8',
                    background: '#fdf2f8',
                    outline: 'none',
                    marginBottom: '14px',
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

                <button 
                  type="submit"
                  style={{
                    width: '180px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #e11d48, #be123c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  Valider
                </button>
              </form>
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
                { id: 'photos', label: '📷 Photos' }
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


                  {/* Statut d'upload avec feedback riche */}
                  {(isUploadingPhoto || uploadStatus) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        marginBottom: '14px',
                        background: uploadStatus === 'done'
                          ? '#f0fdf4'
                          : (uploadStatus === 'error' || uploadStatus === 'storage_error' || uploadStatus === 'save_error')
                          ? '#fef2f2'
                          : '#fdf2f8',
                        border: `1px solid ${
                          uploadStatus === 'done' 
                            ? '#bbf7d0' 
                            : (uploadStatus === 'error' || uploadStatus === 'storage_error' || uploadStatus === 'save_error')
                            ? '#fecaca' 
                            : '#fbcfe8'
                        }`
                      }}
                    >
                      {(isUploadingPhoto || uploadStatus === 'uploading') && (
                        <p style={{ color: 'var(--rose-600)', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                          ⏳ Upload et synchronisation automatique en cours...
                        </p>
                      )}
                      {uploadStatus === 'done' && !isUploadingPhoto && (
                        <>
                          <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: '800', margin: '0 0 2px' }}>
                            ✅ Photos enregistrées sur le Cloud !
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                            Elles sont désormais visibles sur tous tes appareils (PC, téléphone) 📱💻
                          </p>
                        </>
                      )}
                      {uploadStatus === 'storage_error' && !isUploadingPhoto && (
                        <>
                          <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: '800', margin: '0 0 2px' }}>
                            ❌ Impossible d'envoyer l'image vers Supabase Storage
                          </p>
                          <p style={{ color: '#991b1b', fontSize: '11px', margin: 0 }}>
                            Vérifie les permissions (RLS) du bucket 'birthday-photos' ou ta connexion internet.
                          </p>
                        </>
                      )}
                      {uploadStatus === 'save_error' && !isUploadingPhoto && (
                        <>
                          <p style={{ color: '#d97706', fontSize: '13px', fontWeight: '800', margin: '0 0 2px' }}>
                            ⚠️ Photo envoyée mais sauvegarde de la liste échouée
                          </p>
                          <p style={{ color: '#92400e', fontSize: '11px', margin: 0 }}>
                            Clique sur le bouton "💾 Sauvegarder tout" en bas pour forcer la mise à jour.
                          </p>
                        </>
                      )}
                      {uploadStatus === 'error' && !isUploadingPhoto && (
                        <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                          ❌ Erreur lors de l'envoi. Vérifie ta connexion et réessaie.
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Outil de Diagnostic Cloud */}
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                        📡 État de la synchronisation Supabase
                      </span>
                      <button
                        onClick={handleDiagnose}
                        disabled={isDiagnosing}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#334155',
                          cursor: isDiagnosing ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isDiagnosing ? '⏳ Analyse...' : '🔍 Vérifier le Cloud'}
                      </button>
                    </div>

                    {diagStatus && (
                      <div style={{ marginTop: '10px', fontSize: '11px', color: '#334155' }}>
                        {diagStatus.error ? (
                          <div style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626' }}>
                            ❌ Erreur Supabase : {diagStatus.error}
                          </div>
                        ) : (
                          <div style={{ padding: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>📷 Photos dans le Cloud :</span>
                              <strong>{diagStatus.httpsPhotos} / {diagStatus.totalPhotos}</strong>
                            </div>
                            {diagStatus.base64Photos > 0 && (
                              <div style={{ color: '#d97706', marginTop: '4px' }}>
                                ⚠️ <strong>{diagStatus.base64Photos} photo(s)</strong> sont au format local (base64) et ne se synchronisent pas entre appareils. Supprime-les et réimporte-les pour qu'elles aillent dans Supabase Storage.
                              </div>
                            )}
                            {diagStatus.lastUpdate && (
                              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                                🕒 Dernière synchro : {new Date(diagStatus.lastUpdate).toLocaleString('fr-FR')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>



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
