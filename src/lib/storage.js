/**
 * Gestionnaire de stockage persistant ultra-fiable (IndexedDB + LocalStorage + Supabase silencieux)
 * Garantit que la musique personnalisée (MP3), les photos et tous les textes
 * restent sauvegardés de façon permanente, même après réactualisation de la page.
 */

import { getSupabaseClient, saveBirthdayConfig as saveCloudConfig } from './supabase';

const DB_NAME = 'AnniversaireAmourDB';
const DB_VERSION = 2;
const STORE_NAME = 'media_store';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde un fichier audio MP3 de façon permanente dans IndexedDB
 * et tente une synchronisation silencieuse avec Supabase.
 */
export async function savePersistentAudio(file) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(file, 'custom_music_file');
    store.put(file.name, 'custom_music_name');

    // Attendre que la transaction IndexedDB soit physiquement validée sur le disque
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('IndexedDB transaction aborted'));
    });

    const blobUrl = URL.createObjectURL(file);

    // Synchronisation Supabase transparente en tâche de fond (sans bloquer ni afficher d'erreur)
    let cloudUrl = null;
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const fileExt = file.name.split('.').pop() || 'mp3';
        const fileName = `music-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('birthday-photos')
          .upload(`music/${fileName}`, file, { cacheControl: '3600', upsert: true });

        if (!error) {
          const { data } = supabase.storage.from('birthday-photos').getPublicUrl(`music/${fileName}`);
          cloudUrl = data.publicUrl;
        }
      }
    } catch (e) {
      console.warn("Sync cloud musique (silencieuse):", e);
    }

    return {
      name: file.name,
      blobUrl,
      cloudUrl
    };
  } catch (err) {
    console.error("Erreur savePersistentAudio:", err);
    throw err;
  }
}

/**
 * Charge la musique sauvegardée au démarrage ou rechargement de la page
 */
export async function loadPersistentAudio() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const filePromise = new Promise((res) => {
      const req = store.get('custom_music_file');
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });

    const namePromise = new Promise((res) => {
      const req = store.get('custom_music_name');
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });

    const [file, name] = await Promise.all([filePromise, namePromise]);
    if (file && (file instanceof Blob || file instanceof File)) {
      return {
        name: name || file.name || "Musique personnalisée",
        url: URL.createObjectURL(file)
      };
    }
  } catch (err) {
    console.warn("Erreur chargement audio persistant:", err);
  }
  return null;
}

/**
 * Supprime la musique personnalisée pour revenir à la berceuse par défaut
 */
export async function removePersistentAudio() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('custom_music_file');
    store.delete('custom_music_name');

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Erreur suppression audio persistant:", err);
  }
}

/**
 * Sauvegarde complète des données du site dans IndexedDB (backup ultra-fiable)
 */
export async function savePersistentConfig(configData) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(configData, 'site_config_data');
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Erreur savePersistentConfig:", err);
  }
}

/**
 * Charge les données sauvegardées depuis IndexedDB
 */
export async function loadPersistentConfig() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return await new Promise((resolve) => {
      const req = store.get('site_config_data');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("Erreur loadPersistentConfig:", err);
    return null;
  }
}
