import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = "https://icvxzlcfmkkkogaktvgg.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljdnh6bGNmbWtra29nYWt0dmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDk2NzIsImV4cCI6MjEwNjcyNTY3Mn0.ZVS3os-3FYvWLT4NN2yAtJYibt7PU3CVc53PnDMqHfw";

const getCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  if (envUrl && envKey) return { url: envUrl, key: envKey };

  try {
    const saved = localStorage.getItem('supabase_credentials');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.key) return parsed;
    }
  } catch (e) {}

  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
};

let clientInstance = null;

export const getSupabaseClient = () => {
  const { url, key } = getCredentials();
  if (!url || !key) return null;
  if (!clientInstance) clientInstance = createClient(url, key);
  return clientInstance;
};

export const isSupabaseConfigured = () => {
  const { url, key } = getCredentials();
  return Boolean(url && key);
};

export const saveSupabaseCredentials = (url, key) => {
  localStorage.setItem('supabase_credentials', JSON.stringify({ url: url.trim(), key: key.trim() }));
  clientInstance = null;
};

/**
 * Récupère la configuration depuis Supabase
 */
export const fetchBirthdayConfig = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('birthday_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn("Erreur chargement Supabase:", error);
      return null;
    }

    return data ? data.config : null;
  } catch (err) {
    console.warn("Erreur réseau Supabase:", err);
    return null;
  }
};

/**
 * Sauvegarde la config dans Supabase.
 * IMPORTANT : nettoie toutes les URLs base64 avant d'envoyer
 * (les base64 sont trop lourdes pour la colonne JSONB).
 */
export const saveBirthdayConfig = async (configData) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Non configuré' };

  // ⚠️ Nettoyer les photos base64 avant la sauvegarde cloud
  // Une photo base64 de 150Ko = 200Ko de texte → dépasse les limites JSONB
  const sanitizedPhotos = (configData.photos || []).filter(p => {
    if (!p?.url) return false;
    if (p.url.startsWith('data:')) {
      console.warn('⚠️ Photo base64 exclue de la sauvegarde Supabase (trop lourde) :', p.caption || 'sans légende');
      return false;
    }
    return true;
  });

  const dataToSave = {
    ...configData,
    photos: sanitizedPhotos,
    music: undefined // jamais de musique dans Supabase
  };

  const skipped = (configData.photos || []).length - sanitizedPhotos.length;
  if (skipped > 0) {
    console.warn(`⚠️ ${skipped} photo(s) non sauvegardée(s) dans Supabase car encore en base64.`);
    console.warn('👉 Ces photos n\'apparaîtront que sur l\'appareil courant.');
    console.warn('💡 Solution : re-ajouter les photos depuis l\'onglet Photos (elles iront dans Supabase Storage).');
  }

  try {
    const { error } = await supabase
      .from('birthday_config')
      .upsert({
        id: 'default',
        config: dataToSave,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    
    console.log(`✅ Config sauvegardée dans Supabase (${sanitizedPhotos.length} photos https://).`);
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
 * Upload une photo dans Supabase Storage.
 * - Retourne une URL https:// publique si succès ✅
 * - Retourne null si échec (pas de fallback base64 : ça casserait la sync cloud)
 *
 * Prérequis : bucket "birthday-photos" public + politiques SELECT/INSERT/UPDATE dans Supabase
 */
export const uploadPhotoToSupabase = async (file) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('❌ Supabase non configuré');
    return null;
  }

  try {
    const fileToUpload = await compressImage(file);
    // Nom unique garanti → INSERT suffit (pas besoin d'UPDATE)
    const cleanFileName = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    const filePath = `photos/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('birthday-photos')
      .upload(filePath, fileToUpload, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false  // false = INSERT uniquement, pas besoin de politique UPDATE
      });

    if (uploadError) {
      if (uploadError.message?.toLowerCase().includes('bucket') ||
          String(uploadError.statusCode) === '404' ||
          uploadError.error === 'Bucket not found') {
        console.error('❌ Bucket "birthday-photos" introuvable !');
        console.error('👉 Va dans Supabase Dashboard → Storage → New bucket → "birthday-photos" → Public');
      } else {
        console.error('❌ Erreur upload Storage:', uploadError.message || uploadError);
      }
      return null;
    }

    const { data } = supabase.storage
      .from('birthday-photos')
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      console.log('✅ Photo dans Supabase Storage:', data.publicUrl);
      return data.publicUrl;
    }

    console.error('❌ getPublicUrl a échoué après upload réussi');
    return null;

  } catch (err) {
    console.error('❌ Exception upload photo:', err?.message || err);
    return null;
  }
};

/**
 * Diagnostic : retourne l'état réel de la config Supabase
 */
export const diagnoseSyncStatus = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from('birthday_config')
      .select('id, updated_at, config')
      .eq('id', 'default')
      .single();

    if (error) return { error: error.message, photos: 0 };

    const photos = data?.config?.photos || [];
    const httpsPhotos = photos.filter(p => p?.url?.startsWith('https://'));
    const base64Photos = photos.filter(p => p?.url?.startsWith('data:'));

    return {
      totalPhotos: photos.length,
      httpsPhotos: httpsPhotos.length,
      base64Photos: base64Photos.length,
      lastUpdate: data?.updated_at,
      ok: base64Photos.length === 0
    };
  } catch (err) {
    return { error: err.message };
  }
};
