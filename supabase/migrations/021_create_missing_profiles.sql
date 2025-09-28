-- Script pour créer les profils manquants pour les utilisateurs existants
-- Ceci va créer un profil pour chaque utilisateur dans auth.users qui n'a pas encore de profil

INSERT INTO public.profiles (id, email, full_name, role, phone)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'technicien'::user_role) as role,
  u.raw_user_meta_data->>'phone' as phone
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Vérifier combien de profils existent maintenant
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles;