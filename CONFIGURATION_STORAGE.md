# Configuration Supabase Storage pour les Anomalies

Ce guide explique comment configurer le bucket Supabase Storage pour stocker les documents (PDF et Excel) attachés aux anomalies.

## 🚀 Configuration automatique (Recommandé)

La façon la plus simple est d'exécuter le script SQL fourni :

1. Allez dans votre **tableau de bord Supabase**
2. Ouvrez **SQL Editor**
3. Copiez le contenu du fichier `supabase/migrations/033_create_storage_bucket.sql`
4. Cliquez sur **Run**
5. Vous devriez voir : `"Bucket 'documents' créé avec succès!"`

✅ **C'est tout !** Le bucket et toutes les politiques de sécurité sont configurés.

---

## 📋 Configuration manuelle (Alternative)

Si vous préférez créer le bucket manuellement :

### Étape 1 : Créer le bucket

1. Allez dans votre **tableau de bord Supabase**
2. Naviguez vers **Storage** dans le menu latéral
3. Cliquez sur **New Bucket**
4. Configurez le bucket :
   - **Name**: `documents`
   - **Public bucket**: ✅ **Coché** (pour permettre le téléchargement des fichiers)
   - Cliquez sur **Create bucket**

## Étape 2 : Configurer les politiques de sécurité (RLS)

Allez dans **Storage > Policies** et créez les politiques suivantes pour le bucket `documents` :

### Politique 1 : Autoriser l'upload pour les utilisateurs authentifiés

```sql
-- Policy name: "Allow authenticated users to upload"
-- Operation: INSERT
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);
```

### Politique 2 : Autoriser la lecture publique

```sql
-- Policy name: "Allow public read access"
-- Operation: SELECT
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

### Politique 3 : Autoriser la suppression pour les utilisateurs authentifiés

```sql
-- Policy name: "Allow authenticated users to delete"
-- Operation: DELETE
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);
```

## Étape 3 : Configuration des types MIME autorisés (Optionnel mais recommandé)

Dans l'interface Supabase Storage, vous pouvez configurer les types de fichiers autorisés :

1. Allez dans **Storage > documents > Settings**
2. Dans **Allowed MIME types**, ajoutez :
   ```
   application/pdf
   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   application/vnd.ms-excel
   ```

## Étape 4 : Tester la configuration

Une fois la configuration terminée :

1. Allez sur la page **Anomalies** de votre application
2. Cliquez sur le bouton **✏️ Modifier** d'une anomalie
3. Dans la section **Documents**, cliquez sur **"Cliquez pour ajouter un fichier"**
4. Sélectionnez un fichier PDF ou Excel
5. Le fichier devrait s'uploader automatiquement
6. Vous devriez voir le fichier dans la liste avec les boutons de téléchargement et suppression

## Structure des fichiers

Les fichiers sont stockés avec la structure suivante :
```
documents/
└── anomalies/
    ├── {anomalie_id}_{timestamp}.pdf
    ├── {anomalie_id}_{timestamp}.xlsx
    └── ...
```

## Vérification dans la base de données

Les informations des fichiers sont stockées dans le champ `pieces_jointes` (JSONB) de la table `suivi_anomalies` :

```sql
SELECT
  id,
  description_anomalie,
  pieces_jointes
FROM suivi_anomalies
WHERE pieces_jointes IS NOT NULL
  AND pieces_jointes != '[]'::jsonb;
```

Exemple de structure `pieces_jointes` :
```json
[
  {
    "name": "Devis-123.pdf",
    "url": "https://your-project.supabase.co/storage/v1/object/public/documents/anomalies/abc123_1234567890.pdf",
    "type": "pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "name": "Tableau.xlsx",
    "url": "https://your-project.supabase.co/storage/v1/object/public/documents/anomalies/abc123_1234567891.xlsx",
    "type": "xlsx",
    "uploadedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

## Dépannage

### Erreur : "new row violates row-level security policy"
- Vérifiez que les politiques RLS sont bien configurées pour le bucket `documents`
- Assurez-vous que l'utilisateur est bien authentifié

### Erreur : "Bucket not found"
- Vérifiez que le bucket `documents` existe bien dans Supabase Storage
- Le nom doit être exactement `documents` (en minuscules)

### Les fichiers ne s'affichent pas
- Vérifiez que le bucket est bien configuré comme **public**
- Vérifiez la politique de lecture publique

### L'upload échoue
- Vérifiez la taille du fichier (limite par défaut : 50MB)
- Vérifiez le type MIME du fichier
- Vérifiez les logs dans Supabase Dashboard > Logs

## Limites et quotas

- **Taille maximale par fichier** : 50 MB (configurable)
- **Stockage total** : Selon votre plan Supabase
- **Types de fichiers acceptés** : PDF, Excel (.xlsx, .xls)

## Sécurité

- ✅ Les fichiers sont stockés dans un bucket public mais avec des noms de fichiers aléatoires
- ✅ Seuls les utilisateurs authentifiés peuvent uploader et supprimer des fichiers
- ✅ Tous les utilisateurs peuvent télécharger les fichiers (URL publique)
- ⚠️ **Important** : Ne stockez pas de documents sensibles ou confidentiels sans chiffrement supplémentaire

## Nettoyage

Si vous souhaitez supprimer tous les fichiers d'une anomalie avant de supprimer l'anomalie :

```sql
-- Cette opération est automatique via le composant EditAnomalieModal
-- Les fichiers sont supprimés du storage lors de la suppression dans l'interface
```

---

**Configuration terminée !** Vous pouvez maintenant uploader et gérer des documents sur vos anomalies. 📄📊
