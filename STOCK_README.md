# 📦 Module de Gestion de Stock - SECUR'IT

## Vue d'ensemble

Module complet de gestion de stock avec scan de QR codes pour tracer les entrées et sorties de matériel.

## ✨ Fonctionnalités implémentées

### 🎯 Gestion des articles
- **Création** : Formulaire complet avec génération automatique de QR code unique
- **Modification** : Édition des infos (sauf quantité et QR code)
- **Suppression** : Avec confirmation, conserve l'historique
- **Détails** : Vue complète avec QR code téléchargeable et historique

### 🏷️ Catégorisation
- **Gestion catégories** (Admin uniquement)
- 6 catégories par défaut : Cellules détecteurs, Détecteurs portables, Électronique, Gaz étalonnage, Pièces détachées, Consommables
- Icônes emoji personnalisables
- Ordre d'affichage configurable

### 📱 Scanner QR (Mobile-first)
- Accès caméra smartphone via html5-qrcode
- Scan → Identification article automatique
- Choix Entrée/Sortie avec quantité
- Notes optionnelles pour traçabilité

### 📊 Inventaire
- Vue d'ensemble avec stats
- Regroupement par catégorie
- Alertes stock bas (< seuil)
- Recherche rapide

### 📝 Historique complet
- Timeline chronologique de tous les mouvements
- Filtres : article, type (entrée/sortie), période
- Détails : qui, quand, combien, avant/après
- Techniciens voient leurs mouvements, admins voient tout

### 🔐 Sécurité
- Row Level Security (RLS) Supabase
- Admin : accès total
- Technicien : lecture + sorties uniquement
- Traçabilité : chaque mouvement lié à un utilisateur

## 🗂️ Structure des fichiers

```
app/(dashboard)/stock/
├── page.tsx                    # Inventaire (liste articles)
├── nouveau/page.tsx            # Créer article
├── [id]/
│   ├── page.tsx               # Détail article + historique
│   └── edit/page.tsx          # Éditer article (admin)
├── scanner/page.tsx            # Scanner QR mobile
├── historique/page.tsx         # Historique global
└── categories/page.tsx         # Gestion catégories (admin)

types/stock.ts                  # Types TypeScript

supabase/migrations/
├── 023_stock_categories_default.sql   # Catégories par défaut
```

## 🗄️ Base de données

### Tables créées
```
stock_categories        # Catégories (admin)
├── id, nom, icone, ordre

stock_articles          # Articles avec QR
├── id, nom, reference, categorie_id
├── numeros_serie, emplacement
├── quantite, qr_code (unique)
├── prix_unitaire, fournisseur, seuil_alerte

stock_mouvements        # Historique traçable
├── id, article_id, type (entree/sortie)
├── quantite, quantite_avant, quantite_apres
├── utilisateur_id, notes, date_mouvement
```

### Policies RLS
- **Admin** : CRUD complet sur tout
- **Technicien** : Lecture articles/catégories, création mouvements (sortie), lecture ses mouvements
- **Client** : Pas d'accès stock

## 📋 Workflow utilisateur

### Pour un Admin

1. **Configuration initiale**
   - Aller sur `/stock/categories`
   - Créer/modifier les catégories (déjà 6 par défaut)

2. **Ajouter des articles**
   - Aller sur `/stock` → "Nouvel article"
   - Remplir le formulaire (nom, référence, catégorie, etc.)
   - Quantité initiale si besoin
   - Un QR code unique est généré automatiquement
   - Voir l'article → "Télécharger QR"
   - Imprimer le QR et le coller sur l'étagère

3. **Mouvements de stock**
   - Option A : Via page détail article → boutons "Entrée"/"Sortie"
   - Option B : Via scanner QR mobile (recommandé)

### Pour un Technicien

1. **Sortie de matériel** (intervention)
   - Ouvrir `/stock/scanner` sur smartphone
   - Scanner le QR collé sur l'étagère
   - Choisir "SORTIE"
   - Quantité : 3
   - Notes : "Intervention site Total - N° série: 12345, 12346, 12347"
   - Valider → Stock mis à jour automatiquement

2. **Retour de matériel non utilisé**
   - Scanner le même QR
   - Choisir "ENTRÉE"
   - Quantité : 2
   - Notes : "Retour intervention - non utilisé"
   - Valider

3. **Consulter l'historique**
   - `/stock/historique` → Voir ses propres mouvements
   - Filtrer par article ou période

## 🎨 Interface

### Couleurs par module
- **Stock** : Purple (pages principale, création, édition)
- **Scanner** : Blue (page scanner QR)
- **Historique** : Orange (page historique)
- **Catégories** : Indigo (gestion catégories)

### Composants UI réutilisés
- Button, Card, Badge, Input, Skeleton (déjà existants)
- Animations Framer Motion
- Design cohérent avec le reste de l'app

## 🔧 Dépendances ajoutées

```json
"qrcode": "^1.5.4",              // Génération QR codes
"html5-qrcode": "^2.3.8",        // Scanner QR mobile
"@types/qrcode": "^1.5.5"        // Types TypeScript
```

## 🚀 Prochaines étapes possibles (V2)

### Phase 2 : Lien Interventions
- Lors d'une intervention, scanner les pièces utilisées
- Auto-déduction du stock
- Traçabilité : quelle cellule installée sur quel détecteur
- Pré-remplissage "pièces remplacées" dans PDF

### Phase 3 : Gestion avancée
- Multi-entrepôts (stock central + stock camion)
- Alertes péremption (dates d'expiration cellules)
- Commandes fournisseurs automatiques (stock < seuil)
- Réservations de stock pour interventions planifiées
- Valorisation stock (valeur totale inventaire)

### Phase 4 : Intelligence
- Prédictions consommation ("15 cellules/mois en moyenne")
- Analyse coûts matériel par intervention
- Rapports : top 10 pièces consommées
- Dashboard analytics stock

## 📱 Utilisation mobile

Le scanner QR est optimisé mobile :
- PWA friendly
- Accès caméra natif
- UI tactile (gros boutons)
- Fonctionne offline (si implémenté)

## ✅ Checklist déploiement

- [x] SQL migrations exécutées (tables + policies)
- [x] Migration 023 exécutée (catégories par défaut)
- [x] Dépendances npm installées
- [x] Application compilée sans erreurs
- [x] Pages accessibles via menu
- [ ] Tester création article + génération QR
- [ ] Tester scan QR sur mobile
- [ ] Tester mouvements entrée/sortie
- [ ] Vérifier permissions (admin vs technicien)

## 🎯 URLs principales

```
/stock                  # Inventaire
/stock/nouveau          # Créer article (admin)
/stock/scanner          # Scanner QR (mobile)
/stock/historique       # Historique mouvements
/stock/categories       # Gestion catégories (admin)
/stock/[id]            # Détail article
/stock/[id]/edit       # Éditer article (admin)
```

## 🐛 Dépannage

### Scanner QR ne fonctionne pas
- Vérifier permissions caméra dans le navigateur
- Tester sur HTTPS (requis pour accès caméra)
- Utiliser Chrome/Safari (meilleure compatibilité)

### QR non reconnu
- Vérifier que le QR existe en BDD (`stock_articles.qr_code`)
- Format attendu : `SECURIT-ART-[timestamp]-[random]`

### Stock négatif bloqué
- Normal, impossible de sortir plus que la quantité disponible
- Faire d'abord une entrée si besoin

---

**Module développé par Claude Code** 🤖
Date : 11 octobre 2025
Version : 1.0 (MVP)
