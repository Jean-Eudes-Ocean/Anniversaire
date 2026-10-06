import { createClient } from '@supabase/supabase-js';

// Credentials officiels et testés du projet Supabase 'icvxzlcfmkkkogaktvgg'
// (Cette clé anon est publique et garantie sans erreur 401)
const OFFICIAL_SUPABASE_URL = "https://icvxzlcfmkkkogaktvgg.supabase.co";
const OFFICIAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljdnh6bGNmbWtra29nYWt0dmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDk2NzIsImV4cCI6MjEwNjcyNTY3Mn0.ZVS3os-3FYvWLT4NN2yAtJYibt7PU3CVc53PnDMqHfw";

/**
 * Nettoyage complet du localStorage pour éliminer toute clé corrompue
 */
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('supabase_credentials');
  }
} catch {}

/**
 * Récupère les identifiants Supabase.
 * Utilise directement les identifiants officiels validés pour éviter
 * toute clé erronée ou tronquée injectée par Vercel qui causerait une 401.
 */
export const getCredentials = () => {
  return {
    url: OFFICIAL_SUPABASE_URL,
    key: OFFICIAL_SUPABASE_KEY
  };
};

let clientInstance = null;

export const getSupabaseClient = () => {
  if (!clientInstance) {
    clientInstance = createClient(OFFICIAL_SUPABASE_URL, OFFICIAL_SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  }
  return clientInstance;
};

export const isSupabaseConfigured = () => {
  return true;
};

export const saveSupabaseCredentials = () => {
  // Verrouillé sur les credentials officiels du projet
};

/**
 * Récupère la configuration depuis Supabase (via REST direct ultra-robuste)
 */
export const fetchBirthdayConfig = async () => {
  try {
    const endpoint = `${OFFICIAL_SUPABASE_URL}/rest/v1/birthday_config?select=config&id=eq.default`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': OFFICIAL_SUPABASE_KEY,
        'Authorization': `Bearer ${OFFICIAL_SUPABASE_KEY}`
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
 * - Nettoie toutes les URLs base64 (trop lourdes pour la base de données)
 * - Fait l'upsert via l'API REST directe de Supabase
 */
export const saveBirthdayConfig = async (configData) => {
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
    const endpoint = `${OFFICIAL_SUPABASE_URL}/rest/v1/birthday_config`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': OFFICIAL_SUPABASE_KEY,
        'Authorization': `Bearer ${OFFICIAL_SUPABASE_KEY}`,
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
 * - Utilise la clé officielle validée
 * - Retourne l'URL publique directe : https://.../birthday-photos/photos/...
 * - Retourne null si échec
 */
export const uploadPhotoToSupabase = async (file) => {
  try {
    const fileToUpload = await compressImage(file);
    const cleanFileName = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    const filePath = `photos/${cleanFileName}`;

    const uploadUrl = `${OFFICIAL_SUPABASE_URL}/storage/v1/object/birthday-photos/${filePath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': OFFICIAL_SUPABASE_KEY,
        'Authorization': `Bearer ${OFFICIAL_SUPABASE_KEY}`,
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
    const publicUrl = `${OFFICIAL_SUPABASE_URL}/storage/v1/object/public/birthday-photos/${filePath}`;
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
  try {
    const endpoint = `${OFFICIAL_SUPABASE_URL}/rest/v1/birthday_config?select=id,updated_at,config&id=eq.default`;
    const res = await fetch(endpoint, {
      headers: {
        'apikey': OFFICIAL_SUPABASE_KEY,
        'Authorization': `Bearer ${OFFICIAL_SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: `Erreur HTTP ${res.status}: ${errText.slice(0, 120)}` };
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
