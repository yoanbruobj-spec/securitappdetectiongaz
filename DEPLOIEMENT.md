# Guide de Déploiement - SECUR'IT App

## ✅ Prérequis

L'application est prête pour le déploiement ! Voici ce qui est déjà configuré :

- ✅ Next.js 15.5.4 avec App Router
- ✅ Supabase configuré (base de données + authentification + storage)
- ✅ Variables d'environnement documentées
- ✅ .gitignore configuré correctement
- ✅ Migrations SQL prêtes dans `supabase/migrations/`

## 🚀 Déploiement sur Vercel (Recommandé)

### Étape 1 : Préparer le dépôt Git

```bash
# Si ce n'est pas déjà fait, initialiser Git
git add .
git commit -m "Prêt pour le déploiement"

# Créer un dépôt sur GitHub et le pousser
git remote add origin https://github.com/votre-username/securit-app.git
git branch -M main
git push -u origin main
```

### Étape 2 : Déployer sur Vercel

1. **Aller sur [vercel.com](https://vercel.com)** et se connecter avec GitHub
2. **Cliquer sur "New Project"**
3. **Importer votre dépôt GitHub** `securit-app`
4. **Configurer les variables d'environnement** (voir ci-dessous)
5. **Cliquer sur "Deploy"**

### Étape 3 : Configurer les Variables d'Environnement sur Vercel

Dans les paramètres du projet Vercel, ajouter ces variables :

```bash
# Supabase (récupérer depuis supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# App URL (l'URL fournie par Vercel après déploiement)
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app

# Email (optionnel - pour Resend si besoin)
RESEND_API_KEY=votre_resend_api_key
```

### Étape 4 : Exécuter les Migrations Supabase

**IMPORTANT** : Avant d'utiliser l'app déployée, exécuter toutes les migrations SQL dans l'ordre :

1. Aller sur [supabase.com](https://supabase.com) → Votre projet → SQL Editor
2. Exécuter les migrations dans l'ordre suivant :

```
019_fix_profiles_rls.sql
020_fix_profile_trigger.sql
021_create_missing_profiles.sql
022_fix_all_rls_policies.sql
```

3. Les autres migrations (001-018) doivent déjà être exécutées

### Étape 5 : Configurer les Redirects Supabase

Dans Supabase → Authentication → URL Configuration :

- **Site URL** : `https://votre-app.vercel.app`
- **Redirect URLs** : Ajouter `https://votre-app.vercel.app/**`

## 🔄 Mises à Jour Rapides

Pour déployer rapidement les modifications :

### Méthode 1 : Git Push (Automatique)

```bash
# Faire vos modifications
git add .
git commit -m "Description des changements"
git push

# Vercel déploie automatiquement en ~2 minutes
```

### Méthode 2 : Vercel CLI (Plus rapide)

```bash
# Installer Vercel CLI (une seule fois)
npm i -g vercel

# Se connecter
vercel login

# Déployer en production
vercel --prod

# Déploiement en ~1 minute !
```

### Méthode 3 : Preview Deployments

```bash
# Pour tester avant production
vercel

# Cela crée une URL de preview pour tester
# Si OK, promouvoir en production depuis le dashboard Vercel
```

## 📊 Après le Déploiement

### Vérifications à faire :

1. ✅ **Tester la connexion** avec un compte admin
2. ✅ **Créer un nouvel utilisateur** pour vérifier le trigger
3. ✅ **Créer une intervention fixe** et générer le PDF
4. ✅ **Créer une intervention portable** et générer le PDF
5. ✅ **Vérifier le stockage des photos** dans Supabase Storage
6. ✅ **Tester la gestion des utilisateurs** (création, modification, suppression)

### Monitoring :

- **Logs Vercel** : Dashboard Vercel → Votre projet → Logs
- **Logs Supabase** : Dashboard Supabase → Logs
- **Analytics** : Vercel fournit des analytics intégrés

## 🔧 Résolution de Problèmes

### Erreur "Module not found" après déploiement

```bash
# S'assurer que toutes les dépendances sont dans package.json
npm install
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Erreurs 500 au démarrage

- Vérifier que **toutes les variables d'environnement** sont configurées sur Vercel
- Vérifier que les **migrations SQL** ont été exécutées sur Supabase
- Regarder les **logs Vercel** pour voir l'erreur exacte

### Les utilisateurs ne peuvent pas se connecter

- Vérifier les **Redirect URLs** dans Supabase Authentication
- Vérifier les **politiques RLS** avec les migrations 019-022

## 🎯 Optimisations pour la Production

L'application est déjà optimisée avec :

- ✅ Next.js avec App Router et Server Components
- ✅ Turbopack pour un build ultra-rapide
- ✅ Images optimisées automatiquement par Next.js
- ✅ Splitting automatique du code
- ✅ SSR et ISR pour de meilleures performances

## 📝 Checklist Finale

Avant de partager l'app en production :

- [ ] Migrations Supabase exécutées (019-022)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Redirect URLs Supabase configurées
- [ ] Compte admin créé et testé
- [ ] Test complet du flux : connexion → création intervention → PDF
- [ ] Vérification des politiques RLS
- [ ] Backup de la base de données Supabase

## 🎉 Terminé !

Votre application SECUR'IT est maintenant en production !

URL de production : `https://votre-app.vercel.app`

Pour toute mise à jour : `git push` et Vercel déploie automatiquement en 2 minutes.