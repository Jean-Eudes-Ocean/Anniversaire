-- ============================================================
-- SCRIPT SQL D'INITIALISATION POUR SUPABASE
-- Copiez et collez ce script dans l'éditeur SQL de Supabase (SQL Editor)
-- ============================================================

-- 1. Création de la table de configuration du site d'anniversaire
CREATE TABLE IF NOT EXISTS public.birthday_config (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Activation de la sécurité au niveau des lignes (RLS)
ALTER TABLE public.birthday_config ENABLE ROW LEVEL SECURITY;

-- 3. Politique : Autoriser tout le monde à lire (votre copine peut voir la surprise)
CREATE POLICY "Lecture publique autorisée"
ON public.birthday_config
FOR SELECT
TO public
USING (true);

-- 4. Politique : Autoriser la mise à jour / insertion (pour vos modifications d'administration)
CREATE POLICY "Écriture publique autorisée"
ON public.birthday_config
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Création du bucket de stockage pour les photos (si ce n'est pas déjà fait)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-photos', 'birthday-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Politique de stockage : Autoriser l'accès public en lecture aux photos
CREATE POLICY "Accès public aux photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'birthday-photos');

-- 7. Politique de stockage : Autoriser l'envoi de photos depuis l'admin
CREATE POLICY "Upload public de photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'birthday-photos');
