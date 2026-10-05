/**
 * Application Principale - Joyeux Anniversaire
 * Gère l'expérience interactive complète, le mode voyage, la passerelle,
 * le panneau secret administrateur et la personnalisation persistante.
 */

// Données par défaut initiales
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
  photos: []
};

class BirthdayApp {
  constructor() {
    this.data = this.loadData();
    this.tapCount = 0;
    this.maxTaps = 10;
    this.currentChapter = 1;

    // Fleur secrète & PIN
    this.flowerTaps = 0;
    this.flowerTimer = null;
    this.secretPIN = "1202";

    this.initElements();
    this.bindEvents();
    this.renderAll();
    this.initAmbientParticles();
    this.initSparkleCursor();
  }

  loadData() {
    try {
      const saved = localStorage.getItem('birthday_site_data');
      if (saved) {
        return Object.assign({}, DEFAULT_DATA, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Erreur chargement données:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData() {
    try {
      localStorage.setItem('birthday_site_data', JSON.stringify(this.data));
    } catch (e) {
      console.warn("Erreur sauvegarde locale:", e);
    }
  }

  initElements() {
    // Vues
    this.gatewayPage = document.getElementById('gateway-page');
    this.storyContainer = document.getElementById('story-container');

    // Passerelle
    this.heartBtn = document.getElementById('heart-tap-btn');
    this.progressCircle = document.getElementById('progress-circle');
    this.heartStatusText = document.getElementById('heart-status-text');
    this.gatewayDots = document.getElementById('gateway-dots');

    // Lettre & Enveloppe
    this.envelopeClosed = document.getElementById('envelope-closed-view');
    this.envelopeOpen = document.getElementById('letter-opened-view');
    this.envelopeClickable = document.getElementById('envelope-clickable');

    // Fleur secrète & Modale PIN
    this.secretFlowerBtn = document.getElementById('secret-flower-btn');
    this.tapCounterBadge = document.getElementById('tap-counter-badge');
    this.pinModal = document.getElementById('pin-modal');
    this.closePinBtn = document.getElementById('close-pin-modal-btn');
    this.pinInput = document.getElementById('pin-input');
    this.pinErrorMsg = document.getElementById('pin-error-msg');
    this.keypadSubmit = document.getElementById('keypad-submit');
    this.keypadClear = document.getElementById('keypad-clear');

    // Tiroir Admin
    this.adminDrawer = document.getElementById('admin-drawer');
    this.closeAdminDrawerBtn = document.getElementById('close-admin-drawer-btn');
    this.saveAdminBtn = document.getElementById('save-admin-changes-btn');
    this.saveStatusMsg = document.getElementById('save-status-msg');

    // Lightbox
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxCaption = document.getElementById('lightbox-caption');
    this.closeLightboxBtn = document.getElementById('close-lightbox-btn');
  }

  bindEvents() {
    // 1. Passerelle : clic sur le cœur
    if (this.heartBtn) {
      this.heartBtn.addEventListener('click', () => this.handleHeartTap());
    }

    // 2. Navigation des chapitres
    document.querySelectorAll('.nav-next-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-target'), 10);
        if (target) this.goToChapter(target);
      });
    });

    // 3. Chapitre 2 : ouverture de l'enveloppe
    if (this.envelopeClickable) {
      this.envelopeClickable.addEventListener('click', () => {
        this.openLetter();
      });
    }

    // 4. Chapitre 6 : Feux d'artifice
    const fireworksBtn = document.getElementById('fireworks-trigger-btn');
    if (fireworksBtn) {
      fireworksBtn.addEventListener('click', () => {
        if (window.fireworks) window.fireworks.startGrandSpectacle();
      });
    }

    // 5. Contrôle audio
    const musicBtn = document.getElementById('music-toggle-btn');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => {
        if (window.romanticAudio) window.romanticAudio.toggle();
      });
    }

    // 6. Fleur secrète (5 taps sous 4 secondes)
    const flowerWrapper = document.getElementById('secret-admin-trigger');
    if (flowerWrapper) {
      flowerWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFlowerTap();
      });
    }

    // 7. Modale PIN
    if (this.closePinBtn) {
      this.closePinBtn.addEventListener('click', () => this.closePinModal());
    }

    document.querySelectorAll('.keypad-btn[data-key]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-key');
        if (this.pinInput.value.length < 4) {
          this.pinInput.value += key;
        }
      });
    });

    if (this.keypadClear) {
      this.keypadClear.addEventListener('click', () => {
        this.pinInput.value = '';
        this.pinErrorMsg.classList.add('hidden');
      });
    }

    if (this.keypadSubmit) {
      this.keypadSubmit.addEventListener('click', () => this.validatePIN());
    }

    this.pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.validatePIN();
    });

    // 8. Tiroir Admin
    if (this.closeAdminDrawerBtn) {
      this.closeAdminDrawerBtn.addEventListener('click', () => {
        this.adminDrawer.classList.add('hidden');
      });
    }

    document.querySelectorAll('.admin-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        this.switchAdminTab(targetTabId);
      });
    });

    if (this.saveAdminBtn) {
      this.saveAdminBtn.addEventListener('click', () => this.handleSaveAdmin());
    }

    // Ajout dynamique dans admin
    const addReasonBtn = document.getElementById('add-reason-btn');
    if (addReasonBtn) {
      addReasonBtn.addEventListener('click', () => this.addReasonRow());
    }

    const addWishBtn = document.getElementById('add-wish-btn');
    if (addWishBtn) {
      addWishBtn.addEventListener('click', () => this.addWishRow());
    }

    // Upload photos
    const photoFileInput = document.getElementById('photo-file-input');
    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
    }

    // Upload musique
    const musicFileInput = document.getElementById('music-file-input');
    if (musicFileInput) {
      musicFileInput.addEventListener('change', (e) => this.handleMusicUpload(e));
    }

    const resetMusicBtn = document.getElementById('reset-default-music-btn');
    if (resetMusicBtn) {
      resetMusicBtn.addEventListener('click', () => {
        if (window.romanticAudio) window.romanticAudio.resetToDefault();
      });
    }

    // Lightbox close
    if (this.closeLightboxBtn) {
      this.closeLightboxBtn.addEventListener('click', () => {
        this.lightboxModal.classList.add('hidden');
      });
    }
    this.lightboxModal.addEventListener('click', (e) => {
      if (e.target === this.lightboxModal) {
        this.lightboxModal.classList.add('hidden');
      }
    });
  }

  /* ==========================================================================
     LOGIQUE PASSERELLE (CŒUR 10 FOIS)
     ========================================================================== */

  handleHeartTap() {
    if (this.tapCount >= this.maxTaps) return;

    this.tapCount++;

    // Animation du cœur (rebond & onde)
    this.heartBtn.classList.remove('bounce');
    void this.heartBtn.offsetWidth; // Trigger reflow
    this.heartBtn.classList.add('bounce');

    const wave = this.heartBtn.querySelector('.heart-pulse-wave');
    if (wave) {
      wave.classList.remove('radiate');
      void wave.offsetWidth;
      wave.classList.add('radiate');
    }

    // Mise à jour de l'anneau SVG
    // Rayon 70 => Périmètre = 2 * PI * 70 = 439.82
    const totalLength = 439.82;
    const progressOffset = totalLength - (this.tapCount / this.maxTaps) * totalLength;
    this.progressCircle.style.strokeDashoffset = progressOffset;

    // Mise à jour des points de progression
    const dots = this.gatewayDots.querySelectorAll('.dot');
    if (dots[this.tapCount - 1]) {
      dots[this.tapCount - 1].classList.add('filled');
    }

    // Messages encourageants
    const messages = [
      "Commence à appuyer...",
      "Continue, c'est bien parti... 💗",
      "Une belle surprise t'attend... ✨",
      "Encore quelques battements... 💓",
      "Tu y es presque... 💕",
      "Garde le rythme ! 🌷",
      "Ton cœur bat fort... 💖",
      "Presque prêt... 💫",
      "Dernier effort ! 😍",
      "Ouverture de ta surprise... 🎉"
    ];
    this.heartStatusText.textContent = messages[this.tapCount] || messages[messages.length - 1];

    // Au 10ème tap : explosion et transition vers le Chapitre 1
    if (this.tapCount >= this.maxTaps) {
      // Déclenchement automatique de la musique (autorisé par le tap de l'utilisateur)
      if (window.romanticAudio) {
        window.romanticAudio.play();
      }

      // Petite pluie de joie
      if (window.fireworks) {
        window.fireworks.startGrandSpectacle();
      }

      setTimeout(() => {
        this.gatewayPage.classList.remove('active');
        this.gatewayPage.classList.add('hidden');
        this.storyContainer.classList.remove('hidden');
        this.storyContainer.classList.add('active');
        this.goToChapter(1);
      }, 1000);
    }
  }

  /* ==========================================================================
     NAVIGATION DU VOYAGE (CHAPITRES)
     ========================================================================== */

  goToChapter(index) {
    this.currentChapter = index;

    document.querySelectorAll('.chapter-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`chapter-${index}`);
    if (activePane) {
      activePane.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mettre à jour les dots de progression dans chaque panneau
    document.querySelectorAll('.chapter-dots').forEach(dotsContainer => {
      const dots = dotsContainer.querySelectorAll('.p-dot');
      dots.forEach((dot, idx) => {
        if (idx === index - 1) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });

    // Si on arrive au Chapitre 6 (Grande Finale), lancer automatiquement une vague de feux d'artifice
    if (index === 6 && window.fireworks) {
      setTimeout(() => {
        window.fireworks.startGrandSpectacle();
      }, 500);
    }
  }

  openLetter() {
    this.envelopeClosed.classList.add('hidden');
    this.envelopeOpen.classList.remove('hidden');
  }

  /* ==========================================================================
     RENDU DES CONTENUS DYNAMIQUES
     ========================================================================== */

  renderAll() {
    // 1. Textes Hero
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroTitle) heroTitle.innerHTML = this.escapeHtml(this.data.hero.title).replace(/\n/g, '<br>');
    if (heroSubtitle) heroSubtitle.textContent = this.data.hero.subtitle;

    // 2. Lettre
    const letterDate = document.getElementById('letter-date-display');
    const letterTitle = document.getElementById('letter-title-display');
    const letterBody = document.getElementById('letter-body-display');
    const letterSignature = document.getElementById('letter-signature-display');

    if (letterDate) letterDate.textContent = this.data.letter.date || "8 OCTOBRE 2026";
    if (letterTitle) letterTitle.textContent = this.data.letter.title;
    if (letterSignature) letterSignature.textContent = this.data.letter.signature;

    if (letterBody) {
      const paragraphs = this.data.letter.body.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      letterBody.innerHTML = paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('');
    }

    // 3. Raisons d'aimer
    const reasonsContainer = document.getElementById('reasons-list');
    if (reasonsContainer) {
      reasonsContainer.innerHTML = this.data.reasons.map((reason, idx) => {
        const num = (idx + 1).toString().padStart(2, '0');
        return `
          <div class="reason-card">
            <span class="reason-number">${num}</span>
            <span class="reason-text">${this.escapeHtml(reason)}</span>
          </div>
        `;
      }).join('');
    }

    // 4. Galerie Photos
    const photosContainer = document.getElementById('photos-gallery-container');
    if (photosContainer) {
      if (!this.data.photos || this.data.photos.length === 0) {
        photosContainer.innerHTML = `
          <div class="photo-empty-state">
            Tes photos apparaîtront ici — ajoute-en dans le panneau secret ✏️
          </div>
        `;
      } else {
        photosContainer.innerHTML = this.data.photos.map((item, index) => {
          return `
            <div class="photo-item" data-index="${index}">
              <img src="${item.url}" alt="${this.escapeHtml(item.caption || 'Souvenir')}">
              ${item.caption ? `<div class="photo-caption-overlay">${this.escapeHtml(item.caption)}</div>` : ''}
            </div>
          `;
        }).join('');

        // Attacher l'événement d'ouverture lightbox
        photosContainer.querySelectorAll('.photo-item').forEach(item => {
          item.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
            this.openLightbox(this.data.photos[idx]);
          });
        });
      }
    }

    // 5. Vœux mystères (Cartes 3D)
    const wishesContainer = document.getElementById('wishes-cards-grid');
    if (wishesContainer) {
      wishesContainer.innerHTML = this.data.wishes.map((wish, idx) => {
        return `
          <div class="wish-card-wrapper">
            <div class="wish-flip-card" data-index="${idx}">
              <div class="wish-card-front">
                <span class="wish-number">#${idx + 1}</span>
                <span class="wish-tap-hint">Touche-moi ✨</span>
              </div>
              <div class="wish-card-back">
                <p class="wish-secret-text">${this.escapeHtml(wish)}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');

      wishesContainer.querySelectorAll('.wish-flip-card').forEach(card => {
        card.addEventListener('click', (e) => {
          e.currentTarget.classList.toggle('flipped');
        });
      });
    }

    // Remplir aussi le formulaire d'administration
    this.populateAdminForm();
  }

  openLightbox(photoObj) {
    if (!photoObj) return;
    this.lightboxImg.src = photoObj.url;
    this.lightboxCaption.textContent = photoObj.caption || '';
    this.lightboxModal.classList.remove('hidden');
  }

  /* ==========================================================================
     ESPACE ADMIN SECRET (FLEUR 🌸 + CODE 1202)
     ========================================================================== */

  handleFlowerTap() {
    // Si déjà authentifié lors de cette session, ouvrir directement le tiroir !
    if (this.isAuthenticated) {
      this.openAdminDrawer();
      return;
    }

    this.flowerTaps++;

    // Afficher le compteur visuel (1, 2, 3, 4, 5)
    if (this.tapCounterBadge) {
      this.tapCounterBadge.textContent = this.flowerTaps;
      this.tapCounterBadge.classList.remove('hidden');
    }

    // Réinitialisation après 4 secondes sans tap
    if (this.flowerTimer) clearTimeout(this.flowerTimer);
    this.flowerTimer = setTimeout(() => {
      this.flowerTaps = 0;
      if (this.tapCounterBadge) this.tapCounterBadge.classList.add('hidden');
    }, 4000);

    // 5 clics atteints !
    if (this.flowerTaps >= 5) {
      this.flowerTaps = 0;
      if (this.tapCounterBadge) this.tapCounterBadge.classList.add('hidden');
      clearTimeout(this.flowerTimer);
      this.openPinModal();
    }
  }

  openPinModal() {
    this.pinInput.value = '';
    this.pinErrorMsg.classList.add('hidden');
    this.pinModal.classList.remove('hidden');
    this.pinInput.focus();
  }

  closePinModal() {
    this.pinModal.classList.add('hidden');
  }

  validatePIN() {
    const val = this.pinInput.value.trim();
    if (val === this.secretPIN) {
      this.isAuthenticated = true;
      this.closePinModal();
      this.openAdminDrawer();
    } else {
      this.pinErrorMsg.classList.remove('hidden');
      this.pinInput.value = '';
    }
  }

  openAdminDrawer() {
    this.populateAdminForm();
    this.adminDrawer.classList.remove('hidden');
  }

  switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  populateAdminForm() {
    // Textes
    const inputHeroTitle = document.getElementById('input-hero-title');
    const inputHeroSubtitle = document.getElementById('input-hero-subtitle');
    const inputLetterDate = document.getElementById('input-letter-date');
    const inputLetterTitle = document.getElementById('input-letter-title');
    const inputLetterBody = document.getElementById('input-letter-body');
    const inputLetterSignature = document.getElementById('input-letter-signature');

    if (inputHeroTitle) inputHeroTitle.value = this.data.hero.title;
    if (inputHeroSubtitle) inputHeroSubtitle.value = this.data.hero.subtitle;
    if (inputLetterDate) inputLetterDate.value = this.data.letter.date || "8 OCTOBRE 2026";
    if (inputLetterTitle) inputLetterTitle.value = this.data.letter.title;
    if (inputLetterBody) inputLetterBody.value = this.data.letter.body;
    if (inputLetterSignature) inputLetterSignature.value = this.data.letter.signature;

    // Raisons
    const reasonsContainer = document.getElementById('admin-reasons-container');
    if (reasonsContainer) {
      reasonsContainer.innerHTML = '';
      this.data.reasons.forEach((r, idx) => {
        this.renderAdminReasonRow(r, idx);
      });
    }

    // Vœux
    const wishesContainer = document.getElementById('admin-wishes-container');
    if (wishesContainer) {
      wishesContainer.innerHTML = '';
      this.data.wishes.forEach((w, idx) => {
        this.renderAdminWishRow(w, idx);
      });
    }

    // Photos
    this.renderAdminPhotos();
  }

  renderAdminReasonRow(value = "") {
    const container = document.getElementById('admin-reasons-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'admin-item-row';
    row.innerHTML = `
      <input type="text" class="reason-input-field" value="${this.escapeHtml(value)}">
      <button type="button" class="admin-delete-item-btn">✕</button>
    `;
    row.querySelector('.admin-delete-item-btn').addEventListener('click', () => {
      row.remove();
    });
    container.appendChild(row);
  }

  addReasonRow() {
    this.renderAdminReasonRow("");
  }

  renderAdminWishRow(value = "") {
    const container = document.getElementById('admin-wishes-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'admin-item-row';
    row.innerHTML = `
      <input type="text" class="wish-input-field" value="${this.escapeHtml(value)}">
      <button type="button" class="admin-delete-item-btn">✕</button>
    `;
    row.querySelector('.admin-delete-item-btn').addEventListener('click', () => {
      row.remove();
    });
    container.appendChild(row);
  }

  addWishRow() {
    this.renderAdminWishRow("");
  }

  renderAdminPhotos() {
    const list = document.getElementById('admin-photos-list');
    if (!list) return;

    list.innerHTML = this.data.photos.map((p, idx) => {
      return `
        <div class="admin-photo-card" data-index="${idx}">
          <img src="${p.url}" alt="Aperçu">
          <button type="button" class="admin-photo-remove" data-index="${idx}">✕</button>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.admin-photo-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        this.data.photos.splice(idx, 1);
        this.renderAdminPhotos();
      });
    });
  }

  handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target.result;
        this.data.photos.push({
          url: base64Url,
          caption: file.name.replace(/\.[^/.]+$/, "")
        });
        this.renderAdminPhotos();
      };
      reader.readAsDataURL(file);
    });
  }

  handleMusicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    if (window.romanticAudio) {
      window.romanticAudio.setCustomTrack(fileUrl, file.name);
    }
  }

  handleSaveAdmin() {
    // Récupérer les valeurs des champs
    this.data.hero.title = document.getElementById('input-hero-title').value;
    this.data.hero.subtitle = document.getElementById('input-hero-subtitle').value;

    this.data.letter.date = document.getElementById('input-letter-date').value;
    this.data.letter.title = document.getElementById('input-letter-title').value;
    this.data.letter.body = document.getElementById('input-letter-body').value;
    this.data.letter.signature = document.getElementById('input-letter-signature').value;

    // Raisons
    const reasonInputs = document.querySelectorAll('.reason-input-field');
    this.data.reasons = Array.from(reasonInputs).map(i => i.value.trim()).filter(v => v.length > 0);

    // Vœux
    const wishInputs = document.querySelectorAll('.wish-input-field');
    this.data.wishes = Array.from(wishInputs).map(i => i.value.trim()).filter(v => v.length > 0);

    // Sauvegarde persistante
    this.saveData();

    // Rendu en direct
    this.renderAll();

    // Feedback visuel
    this.saveStatusMsg.classList.remove('hidden');
    setTimeout(() => {
      this.saveStatusMsg.classList.add('hidden');
    }, 2500);
  }

  /* ==========================================================================
     EFFETS VISUELS : AMBIANCE (PÉTALES, ÉTOILES) & CURSEUR ÉTINCELLES
     ========================================================================== */

  initAmbientParticles() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 4 + 2,
        speedX: Math.random() * 0.8 - 0.4,
        speedY: Math.random() * 0.9 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        isHeart: Math.random() > 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.02 - 0.01
      });
    }

    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#fbcfe8';

      if (p.isHeart) {
        ctx.font = `${p.radius * 3}px sans-serif`;
        ctx.fillText('💖', 0, 0);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius, p.radius * 1.8, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;

        drawPetal(p);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }

  initSparkleCursor() {
    const canvas = document.getElementById('sparkle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const sparkles = [];

    const addSparkle = (x, y) => {
      sparkles.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        size: Math.random() * 5 + 3,
        alpha: 1,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ec4899',
        decay: Math.random() * 0.03 + 0.02
      });
    };

    window.addEventListener('mousemove', (e) => {
      if (Math.random() > 0.3) {
        addSparkle(e.clientX, e.clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        addSparkle(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const animateSparkles = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(animateSparkles);
    };

    animateSparkles();
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Initialisation dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BirthdayApp();
});
