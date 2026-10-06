/**
 * Script pour créer le bucket Supabase Storage 'birthday-photos' s'il n'existe pas.
 * Exécuter une seule fois : node src/create_bucket.mjs <service_role_key>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://icvxzlcfmkkkogaktvgg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.argv[2];

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ Fournis la clé Service Role en argument :");
  console.error("   node src/create_bucket.mjs <service_role_key>");
  console.error("   (Disponible dans Supabase > Settings > API > Service Role Key)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log("🔍 Vérification des buckets existants...");
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("❌ Erreur liste buckets:", listError.message);
    process.exit(1);
  }
  
  console.log("📦 Buckets actuels:", buckets.map(b => b.name));
  
  const exists = buckets.some(b => b.name === 'birthday-photos');
  
  if (exists) {
    console.log("✅ Le bucket 'birthday-photos' existe déjà.");
  } else {
    console.log("🆕 Création du bucket 'birthday-photos'...");
    const { error: createError } = await supabase.storage.createBucket('birthday-photos', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
    });
    
    if (createError) {
      console.error("❌ Erreur création bucket:", createError.message);
      process.exit(1);
    }
    
    console.log("✅ Bucket 'birthday-photos' créé avec succès (public, 50MB max)!");
  }

  console.log("\n🎉 Configuration Storage terminée !");
  console.log("💡 Tu peux maintenant uploader des fichiers MP3 et photos depuis l'admin du site.");
}

main();
