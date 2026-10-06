-- ============================================================
-- SCRIPT SQL D'INITIALISATION POUR SUPABASE (RÉ-EXÉCUTABLE SANS ERREUR)
-- ============================================================

-- 1. Table de configuration
CREATE TABLE IF NOT EXISTS public.birthday_config (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Activation RLS
ALTER TABLE public.birthday_config ENABLE ROW LEVEL SECURITY;

-- 3. Politiques pour la table (supprimées si existantes puis recréées)
DROP POLICY IF EXISTS "Lecture publique autorisée" ON public.birthday_config;
CREATE POLICY "Lecture publique autorisée"
ON public.birthday_config
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Écriture publique autorisée" ON public.birthday_config;
CREATE POLICY "Écriture publique autorisée"
ON public.birthday_config
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Création du bucket de stockage (pour photos & musiques)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-photos', 'birthday-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Politiques pour le stockage
DROP POLICY IF EXISTS "Accès public aux photos" ON storage.objects;
CREATE POLICY "Accès public aux photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'birthday-photos');

DROP POLICY IF EXISTS "Upload public de photos" ON storage.objects;
CREATE POLICY "Upload public de photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'birthday-photos');
