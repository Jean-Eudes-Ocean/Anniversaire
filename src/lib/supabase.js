import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = "https://icvxzlcfmkkkogaktvgg.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljdnh6bGNmbWtra29nYWt0dmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDk2NzIsImV4cCI6MjEwNjcyNTY3Mn0.ZVS3os-3FYvWLT4NN2yAtJYibt7PU3CVc53PnDMqHfw";

// Récupération des clés depuis .env ou depuis la configuration admin sauvegardée
const getCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  try {
    const saved = localStorage.getItem('supabase_credentials');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.key) return parsed;
    }
  } catch (e) {
    console.warn("Erreur lecture credentials Supabase:", e);
  }

  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
};

let clientInstance = null;

export const getSupabaseClient = () => {
  const { url, key } = getCredentials();
  if (!url || !key) return null;

  if (!clientInstance) {
    clientInstance = createClient(url, key);
  }
  return clientInstance;
};

export const isSupabaseConfigured = () => {
  const { url, key } = getCredentials();
  return Boolean(url && key);
};

export const saveSupabaseCredentials = (url, key) => {
  localStorage.setItem('supabase_credentials', JSON.stringify({ url: url.trim(), key: key.trim() }));
  clientInstance = null; // Re-créer l'instance au prochain appel
};

/**
 * Récupère la configuration d'anniversaire depuis Supabase
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

    if (error && error.code !== 'PGRST116') { // PGRST116 = ligne non trouvée
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
 * Sauvegarde la configuration dans Supabase (upsert)
 */
export const saveBirthdayConfig = async (configData) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Non configuré' };

  try {
    const { error } = await supabase
      .from('birthday_config')
      .upsert({
        id: 'default',
        config: configData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Erreur sauvegarde Supabase:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Compresse automatiquement une image côté client (max 1600px, JPEG 80%)
 * Réduit une photo de smartphone de 12 Mo à ~150-250 Ko tout en gardant une netteté magnifique.
 */
export const compressImage = (file, maxWidth = 1600, quality = 0.8) => {
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
                  const newFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                  resolve(newFile);
                } catch {
                  resolve(blob);
                }
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          } catch {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
};

/**
 * Upload d'une photo dans Supabase Storage avec fallback robuste.
 * Si le bucket 'birthday-photos' n'existe pas encore :
 *   - L'image est compressée en JPEG (~150Ko)
 *   - Convertie en base64 Data URL
 *   - Cette URL est retournée et SERA sauvegardée dans Supabase config
 *   - Donc visible sur tous les appareils via Supabase sync ✅
 *
 * Pour activer le stockage permanent (recommandé) :
 * Dans Supabase Dashboard → Storage → New bucket → "birthday-photos" → Public ✅
 */
export const uploadPhotoToSupabase = async (file) => {
  try {
    const fileToUpload = await compressImage(file);
    const cleanFileName = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const filePath = `photos/${cleanFileName}`;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('birthday-photos')
          .upload(filePath, fileToUpload, { 
            contentType: 'image/jpeg',
            cacheControl: '31536000', 
            upsert: true 
          });

        if (!uploadError) {
          const { data } = supabase.storage
            .from('birthday-photos')
            .getPublicUrl(filePath);

          if (data?.publicUrl) {
            console.log('✅ Photo uploadée dans Supabase Storage:', data.publicUrl);
            return data.publicUrl;
          }
        } else {
          // Détection précise : bucket manquant vs autre erreur
          if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
            console.warn('⚠️ Bucket "birthday-photos" introuvable dans Supabase Storage.');
            console.warn('👉 Pour l\'activer : Supabase Dashboard → Storage → New bucket → "birthday-photos" → cocher Public');
            console.warn('📌 Fallback : la photo sera stockée en base64 dans Supabase config (visible sur tous les appareils)');
          } else {
            console.warn('Storage upload notice:', uploadError.message);
          }
        }
      } catch (storageErr) {
        console.warn('Storage exception, fallback base64:', storageErr?.message || storageErr);
      }
    }

    // Fallback : image compressée en Data URL (~150Ko)
    // Cette URL sera sauvegardée dans Supabase config → visible sur tous les appareils
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileToUpload instanceof Blob ? fileToUpload : file);
    });
  } catch (err) {
    console.error('Erreur générale upload photo:', err);
    return null;
  }
};
