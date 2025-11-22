# Guide de modifications pour ajouter les automates

## 1. Dans `app/(dashboard)/intervention/[id]/edit/page.tsx`

### Étape 1: Modifier l'interface Centrale pour ajouter le type_equipement

Trouver l'interface `Centrale` et ajouter :
```typescript
interface Centrale {
  id: string
  type_equipement?: 'centrale' | 'automate'  // AJOUTER CETTE LIGNE
  marque: string
  marque_personnalisee?: string  // AJOUTER CETTE LIGNE
  modele: string
  // ... reste des champs
}
```

### Étape 2: Ajouter la fonction addAutomate

Après la fonction `addCentrale()` (ligne ~404), ajouter :

```typescript
function addAutomate() {
  const newAutomate: Centrale = {
    id: Date.now().toString(),
    type_equipement: 'automate',  // Différence principale
    marque: '',
    marque_personnalisee: '',
    modele: '',
    numero_serie: '',
    firmware: '',
    etat_general: 'Bon',
    aes_presente: false,
    aes_modele: '',
    aes_statut: 'Bon',
    aes_ondulee: false,
    aes_date_remplacement: '',
    aes_prochaine_echeance: '',
    detecteurs_gaz: [],
    detecteurs_flamme: [],
    observations: '',
    travaux_effectues: '',
    anomalies: '',
    recommandations: '',
    numero: centrales.length + 1
  }
  setCentrales([...centrales, newAutomate])
  setCurrentSection(`centrale-${newAutomate.id}`)
}
```

### Étape 3: Ajouter le bouton "Ajouter automate"

Après le bouton "Ajouter centrale" (ligne ~948), ajouter :

```typescript
<button
  onClick={addAutomate}
  className="w-full text-left px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white"
>
  + Ajouter automate
</button>
```

### Étape 4: Modifier les formulaires de centrale pour gérer les automates

Dans la section de formulaire de centrale, ajouter un champ de sélection du type et un champ pour la marque personnalisée.

Trouver où il y a le champ "Marque" et ajouter avant :

```typescript
{/* Type d'équipement */}
<div>
  <label className="block text-sm font-medium mb-1">Type d'équipement</label>
  <select
    value={centrale.type_equipement || 'centrale'}
    onChange={(e) => updateCentrale(centrale.id, 'type_equipement', e.target.value)}
    className="w-full px-3 py-2 border rounded-lg"
  >
    <option value="centrale">Centrale</option>
    <option value="automate">Automate</option>
  </select>
</div>
```

Et modifier le champ "Marque" pour permettre la saisie personnalisée :

```typescript
<div>
  <label className="block text-sm font-medium mb-1">Marque</label>
  {/* Si "Autre" est sélectionné ou si c'est un automate, afficher un champ texte */}
  {centrale.marque === 'Autre' || centrale.type_equipement === 'automate' ? (
    <input
      type="text"
      value={centrale.marque_personnalisee || ''}
      onChange={(e) => updateCentrale(centrale.id, 'marque_personnalisee', e.target.value)}
      placeholder="Saisir la marque"
      className="w-full px-3 py-2 border rounded-lg"
    />
  ) : (
    <select
      value={centrale.marque}
      onChange={(e) => {
        updateCentrale(centrale.id, 'marque', e.target.value)
        if (e.target.value !== 'Autre') {
          updateCentrale(centrale.id, 'marque_personnalisee', '')
        }
      }}
      className="w-full px-3 py-2 border rounded-lg"
    >
      <option value="">Sélectionner...</option>
      <option value="Honeywell">Honeywell</option>
      <option value="Draeger">Draeger</option>
      <option value="MSA">MSA</option>
      <option value="Industrial Scientific">Industrial Scientific</option>
      <option value="Oldham">Oldham</option>
      <option value="Autre">Autre (saisie manuelle)</option>
    </select>
  )}
</div>
```

### Étape 5: Modifier la sauvegarde pour inclure les nouveaux champs

Dans la fonction `handleSubmit()` ou `saveCentrale()`, s'assurer que les champs `type_equipement` et `marque_personnalisee` sont bien sauvegardés dans Supabase.

```typescript
const centraleData = {
  ...centrale,
  type_equipement: centrale.type_equipement || 'centrale',
  marque_personnalisee: centrale.marque_personnalisee,
  intervention_id: interventionId
}
```

### Étape 6: Afficher le bon label dans l'interface

Modifier l'affichage du titre de section pour montrer "Centrale" ou "Automate" :

```typescript
{centrale.type_equipement === 'automate' ? 'Automate' : 'Centrale'} {centrale.numero || index + 1}
```

---

## 2. Dans le PDF (si nécessaire)

Dans `lib/pdf/generateInterventionPDF.ts`, s'assurer que le type d'équipement est affiché :

```typescript
// Au lieu de juste "Centrale"
const equipmentType = centrale.type_equipement === 'automate' ? 'Automate' : 'Centrale'
// Utiliser equipmentType dans les titres
```

---

## Notes importantes

- Les automates utilisent exactement la même structure que les centrales
- Le champ `type_equipement` par défaut est 'centrale' pour la rétrocompatibilité
- La marque personnalisée (`marque_personnalisee`) permet une saisie libre
- Les détecteurs de gaz et flamme peuvent être rattachés aux automates comme aux centrales
