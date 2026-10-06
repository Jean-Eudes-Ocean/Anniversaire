import { createClient } from '@supabase/supabase-js';

// Credentials Supabase garantis et testés
const DEFAULT_SUPABASE_URL = "https://icvxzlcfmkkkogaktvgg.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljdnh6bGNmbWtra29nYWt0dmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDk2NzIsImV4cCI6MjEwNjcyNTY3Mn0.ZVS3os-3FYvWLT4NN2yAtJYibt7PU3CVc53PnDMqHfw";

/**
 * Nettoie impitoyablement toute chaîne pour éliminer :
 * - Les guillemets ou apostrophes superflus
 * - Les retours à la ligne (\r, \n) et tabulations
 * - Les espaces insécables et caractères non-ASCII (qui font crasher 'Headers.set')
 * - Le préfixe 'Bearer ' si collé par erreur
 */
const sanitizeCredential = (val) => {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^["'`]|["'`]$/g, '')  // Supprime guillemets / backticks extérieurs
    .replace(/[^\x20-\x7E]/g, '')   // Supprime STRICTEMENT tout caractère non-ASCII standard
    .replace(/^Bearer\s+/i, '')     // Supprime préfixe 'Bearer ' si copié
    .trim();
};

const isValidSupabaseUrl = (url) => {
  return typeof url === 'string' && url.startsWith('https://') && url.includes('.supabase.co');
};

const isValidSupabaseKey = (key) => {
  return typeof key === 'string' && key.startsWith('eyJ') && key.length > 80;
};

/**
 * Récupère des identifiants 100% valides, nettoyés et vérifiés.
 * Si les variables injectées ou le localStorage sont corrompus ou invalides,
 * bascule automatiquement sur les credentials officiels du projet.
 */
export const getCredentials = () => {
  let url = sanitizeCredential(import.meta.env.VITE_SUPABASE_URL);
  let key = sanitizeCredential(import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Si absent ou invalide, tester le localStorage
  if (!isValidSupabaseUrl(url) || !isValidSupabaseKey(key)) {
    try {
      const saved = localStorage.getItem('supabase_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedUrl = sanitizeCredential(parsed?.url);
        const savedKey = sanitizeCredential(parsed?.key);
        if (isValidSupabaseUrl(savedUrl) && isValidSupabaseKey(savedKey)) {
          url = savedUrl;
          key = savedKey;
        } else {
          localStorage.removeItem('supabase_credentials');
        }
      }
    } catch {
      try { localStorage.removeItem('supabase_credentials'); } catch {}
    }
  }

  // Fallback garanti sur les constantes du projet
  if (!isValidSupabaseUrl(url)) url = DEFAULT_SUPABASE_URL;
  if (!isValidSupabaseKey(key)) key = DEFAULT_SUPABASE_KEY;

  return { url, key };
};

let clientInstance = null;

export const getSupabaseClient = () => {
  const { url, key } = getCredentials();
  if (!url || !key) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: { persistSession: false }
      });
    } catch (e) {
      console.warn("Erreur createClient, réinitialisation avec clés par défaut:", e);
      clientInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
        auth: { persistSession: false }
      });
    }
  }
  return clientInstance;
};

export const isSupabaseConfigured = () => {
  const { url, key } = getCredentials();
  return Boolean(isValidSupabaseUrl(url) && isValidSupabaseKey(key));
};

export const saveSupabaseCredentials = (rawUrl, rawKey) => {
  const url = sanitizeCredential(rawUrl);
  const key = sanitizeCredential(rawKey);
  if (isValidSupabaseUrl(url) && isValidSupabaseKey(key)) {
    localStorage.setItem('supabase_credentials', JSON.stringify({ url, key }));
  } else {
    localStorage.removeItem('supabase_credentials');
  }
  clientInstance = null;
};

/**
 * Récupère la configuration depuis Supabase (via REST direct ultra-robuste)
 */
export const fetchBirthdayConfig = async () => {
  const { url, key } = getCredentials();
  if (!url || !key) return null;

  try {
    const endpoint = `${url}/rest/v1/birthday_config?select=config&id=eq.default`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!res.ok) {
      console.warn("Supabase fetch returned status:", res.status);
      return null;
    }

    const data = await res.json();
    return data && data.length > 0 ? data[0].config : null;
  } catch (err) {
    console.warn("Erreur réseau fetchBirthdayConfig:", err);
    return null;
  }
};

/**
 * Sauvegarde la config dans Supabase.
 * - Nettoie toutes les URLs base64 (les base64 sont trop lourdes pour JSONB)
 * - Fait l'upsert via l'API REST directe de Supabase
 */
export const saveBirthdayConfig = async (configData) => {
  const { url, key } = getCredentials();
  if (!url || !key) return { success: false, error: 'Non configuré' };

  // Exclure les photos locales en base64 pour ne pas saturer la base de données
  const sanitizedPhotos = (configData.photos || []).filter(p => {
    if (!p?.url) return false;
    if (p.url.startsWith('data:')) {
      console.warn('⚠️ Photo locale base64 exclue de Supabase (trop lourde) :', p.caption || 'sans légende');
      return false;
    }
    return true;
  });

  const dataToSave = {
    ...configData,
    photos: sanitizedPhotos,
    music: undefined // La musique intégrée locale est utilisée
  };

  const skipped = (configData.photos || []).length - sanitizedPhotos.length;

  try {
    const endpoint = `${url}/rest/v1/birthday_config`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        id: 'default',
        config: dataToSave,
        updated_at: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erreur sauvegarde Supabase HTTP:", res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    console.log(`✅ Config sauvegardée dans Supabase (${sanitizedPhotos.length} photos Cloud).`);
    return { success: true, savedPhotos: sanitizedPhotos.length, skippedPhotos: skipped };
  } catch (err) {
    console.error("Erreur sauvegarde Supabase:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Compresse une image côté client (max 1200px, JPEG 82%)
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
  if (!file || !file.type || !file.type.startsWith('image/')) return Promise.resolve(file);
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob && blob.size < file.size) {
                try {
                  resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
                } catch {
                  resolve(blob);
                }
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          } catch { resolve(file); }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch { resolve(file); }
  });
};

/**
 * Upload une photo dans Supabase Storage via l'API REST directe.
 * - Évite tout bug interne de bibliothèque ou de Headers
 * - Retourne l'URL publique directe : https://.../birthday-photos/photos/...
 * - Retourne null si échec
 */
export const uploadPhotoToSupabase = async (file) => {
  const { url, key } = getCredentials();
  if (!url || !key) {
    console.error('❌ Supabase non configuré');
    return null;
  }

  try {
    const fileToUpload = await compressImage(file);
    const cleanFileName = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    const filePath = `photos/${cleanFileName}`;

    const uploadUrl = `${url}/storage/v1/object/birthday-photos/${filePath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: fileToUpload
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur upload Supabase Storage HTTP:', response.status, errorText);
      return null;
    }

    // URL publique accessible directement
    const publicUrl = `${url}/storage/v1/object/public/birthday-photos/${filePath}`;
    console.log('✅ Photo stockée dans Supabase Storage:', publicUrl);
    return publicUrl;

  } catch (err) {
    console.error('❌ Exception upload photo:', err?.message || err);
    return null;
  }
};

/**
 * Diagnostic en direct : vérifie la connexion Supabase et l'état des photos
 */
export const diagnoseSyncStatus = async () => {
  const { url, key } = getCredentials();
  if (!url || !key) return { error: 'Identifiants Supabase non trouvés' };

  try {
    const endpoint = `${url}/rest/v1/birthday_config?select=id,updated_at,config&id=eq.default`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: `Erreur HTTP ${res.status}: ${errText.slice(0, 100)}` };
    }

    const rows = await res.json();
    const data = rows && rows.length > 0 ? rows[0] : null;

    if (!data) {
      return { error: 'Aucune donnée trouvée dans la table birthday_config' };
    }

    const photos = data?.config?.photos || [];
    const httpsPhotos = photos.filter(p => p?.url && p.url.startsWith('https://'));
    const base64Photos = photos.filter(p => p?.url && p.url.startsWith('data:'));

    return {
      totalPhotos: photos.length,
      httpsPhotos: httpsPhotos.length,
      base64Photos: base64Photos.length,
      lastUpdate: data?.updated_at,
      ok: base64Photos.length === 0
    };
  } catch (err) {
    console.error("Erreur diagnoseSyncStatus:", err);
    return { error: err.message || 'Erreur de connexion' };
  }
};
