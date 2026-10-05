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
 * Upload d'une photo dans le bucket Supabase Storage 'birthday-photos'
 */
export const uploadPhotoToSupabase = async (file) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('birthday-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('birthday-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Erreur upload photo Supabase:", err);
    return null;
  }
};
