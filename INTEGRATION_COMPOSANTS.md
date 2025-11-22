# Guide d'intégration des nouveaux composants

## 1. Intégrer SyntheseEquipements dans le rapport fixe

### Dans `app/(dashboard)/intervention/[id]/page.tsx`

Après la section "Informations générales" (autour de la ligne 350), ajouter :

```typescript
// Importer le composant en haut du fichier
import { SyntheseEquipements } from '@/components/rapport/SyntheseEquipements'

// Dans le JSX, après la fermeture de la section Informations générales
<SyntheseEquipements
  centrales={intervention.centrales || []}
  detecteurs_gaz={intervention.centrales?.flatMap(c => c.detecteurs_gaz || []) || []}
/>
```

---

## 2. Intégrer SynthesePortables dans le rapport portable

### Dans `app/(dashboard)/intervention-portable/[id]/page.tsx`

Après la section "Informations générales", ajouter :

```typescript
// Importer le composant
import { SynthesePortables } from '@/components/rapport/SynthesePortables'

// Dans le JSX
<SynthesePortables
  portables={intervention.portables || []}
  portables_gaz={intervention.portables_gaz || []}
/>
```

---

## 3. Bouton signaler anomalie dans les rapports

### Dans les deux fichiers de rapports (fixe et portable)

Ajouter dans la section "observations" ou "anomalies" :

```typescript
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Dans le composant
const router = useRouter()
const { showToast } = useToast()
const supabase = createClient()

async function signalerAnomalie(description: string, centraleId?: string) {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('suivi_anomalies')
    .insert({
      intervention_id: intervention.id,
      client_id: intervention.sites.client_id,
      site_id: intervention.site_id,
      centrale_id: centraleId,
      type_equipement: centraleId ? 'centrale' : 'autre',
      description_anomalie: description,
      priorite: 'moyenne',
      statut: 'devis_attente',
      date_constat: new Date().toISOString().split('T')[0],
      created_by: user?.id
    })

  if (error) {
    showToast('Erreur lors du signalement', 'error')
    return
  }

  showToast('Anomalie signalée avec succès', 'success')
  router.push('/anomalies')
}

// Dans le JSX, à côté du champ anomalies
<Button
  variant="danger"
  size="sm"
  onClick={() => signalerAnomalie(centrale.anomalies, centrale.id)}
  disabled={!centrale.anomalies}
>
  <AlertTriangle className="w-4 h-4 mr-2" />
  Signaler comme anomalie
</Button>
```

---

## 4. Système d'alertes automatiques (2 mois)

### Créer un fichier `lib/alerts/checkCellulesAlerts.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export async function checkAndCreateCellulesAlerts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Date limite : 2 mois à partir de maintenant
  const dateLimite = new Date()
  dateLimite.setMonth(dateLimite.getMonth() + 2)
  const dateLimiteStr = dateLimite.toISOString().split('T')[0]

  // 1. Vérifier les détecteurs gaz
  const { data: detecteursGaz } = await supabase
    .from('detecteurs_gaz')
    .select(`
      *,
      centrales (
        installation_id,
        installations (
          site_id,
          sites (
            client_id,
            nom,
            clients (nom)
          )
        )
      )
    `)
    .lte('cellule_date_remplacement_theorique', dateLimiteStr)
    .is('cellule_date_remplacement_theorique', null, { negate: true })

  // 2. Vérifier les portables gaz
  const { data: portablesGaz } = await supabase
    .from('portables_gaz')
    .select(`
      *,
      portables (
        site_id,
        sites (
          client_id,
          nom,
          clients (nom)
        )
      )
    `)
    .lte('date_prochain_remplacement', dateLimiteStr)
    .is('date_prochain_remplacement', null, { negate: true })

  // 3. Créer les commandes pour les détecteurs fixes
  for (const detecteur of detecteursGaz || []) {
    // Vérifier si une commande existe déjà
    const { data: existing } = await supabase
      .from('commandes_cellules')
      .select('id')
      .eq('detecteur_gaz_id', detecteur.id)
      .neq('statut', 'remplacé')
      .single()

    if (!existing) {
      await supabase
        .from('commandes_cellules')
        .insert({
          detecteur_gaz_id: detecteur.id,
          client_id: detecteur.centrales?.installations?.sites?.client_id,
          site_id: detecteur.centrales?.installations?.site_id,
          centrale_id: detecteur.centrale_id,
          modele_detecteur: detecteur.modele,
          gaz: detecteur.gaz,
          gamme_mesure: detecteur.gamme_mesure,
          numero_serie_detecteur: detecteur.numero_serie,
          date_remplacement_theorique: detecteur.cellule_date_remplacement_theorique,
          statut: 'attente_commande'
        })
    }
  }

  // 4. Créer les commandes pour les portables
  for (const portableGaz of portablesGaz || []) {
    const { data: existing } = await supabase
      .from('commandes_cellules')
      .select('id')
      .eq('portable_gaz_id', portableGaz.id)
      .neq('statut', 'remplacé')
      .single()

    if (!existing) {
      await supabase
        .from('commandes_cellules')
        .insert({
          portable_gaz_id: portableGaz.id,
          client_id: portableGaz.portables?.sites?.client_id,
          site_id: portableGaz.portables?.site_id,
          gaz: portableGaz.gaz,
          gamme_mesure: portableGaz.gamme_mesure,
          date_remplacement_theorique: portableGaz.date_prochain_remplacement,
          statut: 'attente_commande'
        })
    }
  }

  return {
    detecteursGazAlertes: detecteursGaz?.length || 0,
    portablesGazAlertes: portablesGaz?.length || 0
  }
}
```

### Créer une route API `app/api/cron/check-cellules/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { checkAndCreateCellulesAlerts } from '@/lib/alerts/checkCellulesAlerts'

export async function GET(request: Request) {
  // Vérifier l'authentification (optionnel: utiliser un token secret)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkAndCreateCellulesAlerts()
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Erreur vérification cellules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Configurer un cron job (Vercel Cron ou autre)

Dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/cron/check-cellules",
    "schedule": "0 9 * * *"
  }]
}
```

Ou manuellement appeler `/api/cron/check-cellules` une fois par jour.

---

## 5. Notes importantes

- Assurez-vous que les migrations SQL sont exécutées avant d'utiliser ces composants
- Les composants sont indépendants et peuvent être intégrés séparément
- Le système d'alertes automatiques nécessite un cron job ou une tâche planifiée
- Testez en local avant de déployer en production
