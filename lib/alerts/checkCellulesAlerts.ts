import { createClient } from '@supabase/supabase-js'

/**
 * Vérifie les dates de remplacement des cellules et crée automatiquement
 * des commandes pour les cellules arrivant à échéance dans les 2 prochains mois
 */
export async function checkAndCreateCellulesAlerts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Date limite : 2 mois à partir de maintenant
  const dateLimite = new Date()
  dateLimite.setMonth(dateLimite.getMonth() + 2)
  const dateLimiteStr = dateLimite.toISOString().split('T')[0]

  console.log(`Vérification des cellules avec échéance avant le ${dateLimiteStr}`)

  // 1. Vérifier les détecteurs gaz fixes
  const { data: detecteursGaz, error: errorDetecteurs } = await supabase
    .from('detecteurs_gaz')
    .select(`
      *,
      centrales!inner (
        id,
        numero,
        modele,
        type_equipement,
        intervention_id,
        interventions!inner (
          site_id,
          sites!inner (
            id,
            nom,
            client_id,
            clients!inner (
              id,
              nom
            )
          )
        )
      )
    `)
    .lte('cellule_date_remplacement_theorique', dateLimiteStr)
    .not('cellule_date_remplacement_theorique', 'is', null)

  if (errorDetecteurs) {
    console.error('Erreur récupération détecteurs gaz:', errorDetecteurs)
  }

  // 2. Vérifier les portables gaz
  const { data: portablesGaz, error: errorPortables } = await supabase
    .from('portables_gaz')
    .select(`
      *,
      portables!inner (
        id,
        marque,
        modele,
        numero_serie,
        site_id,
        sites!inner (
          id,
          nom,
          client_id,
          clients!inner (
            id,
            nom
          )
        )
      )
    `)
    .lte('date_prochain_remplacement', dateLimiteStr)
    .not('date_prochain_remplacement', 'is', null)

  if (errorPortables) {
    console.error('Erreur récupération portables gaz:', errorPortables)
  }

  let nbCommandesCreees = 0

  // 3. Créer les commandes pour les détecteurs fixes
  if (detecteursGaz && detecteursGaz.length > 0) {
    for (const detecteur of detecteursGaz) {
      // Vérifier si une commande existe déjà pour ce détecteur (non remplacée)
      const { data: existing } = await supabase
        .from('commandes_cellules')
        .select('id, statut')
        .eq('detecteur_gaz_id', detecteur.id)
        .neq('statut', 'remplacé')
        .maybeSingle()

      if (!existing) {
        const centrale = Array.isArray(detecteur.centrales)
          ? detecteur.centrales[0]
          : detecteur.centrales

        const intervention = Array.isArray(centrale?.interventions)
          ? centrale.interventions[0]
          : centrale?.interventions

        const site = Array.isArray(intervention?.sites)
          ? intervention.sites[0]
          : intervention?.sites

        const client = Array.isArray(site?.clients)
          ? site.clients[0]
          : site?.clients

        const { error: insertError } = await supabase
          .from('commandes_cellules')
          .insert({
            detecteur_gaz_id: detecteur.id,
            client_id: client?.id,
            site_id: site?.id,
            centrale_id: detecteur.centrale_id,
            modele_detecteur: detecteur.modele,
            gaz: detecteur.gaz,
            gamme_mesure: detecteur.gamme_mesure,
            numero_serie_detecteur: detecteur.numero_serie,
            date_remplacement_theorique: detecteur.cellule_date_remplacement_theorique,
            statut: 'attente_commande',
            notes: 'Créée automatiquement par le système d\'alertes'
          })

        if (insertError) {
          console.error(`Erreur création commande pour détecteur ${detecteur.id}:`, insertError)
        } else {
          nbCommandesCreees++
          console.log(`Commande créée pour détecteur ${detecteur.numero} - Gaz: ${detecteur.gaz}`)
        }
      } else {
        console.log(`Commande existante pour détecteur ${detecteur.id} (statut: ${existing.statut})`)
      }
    }
  }

  // 4. Créer les commandes pour les portables
  if (portablesGaz && portablesGaz.length > 0) {
    for (const portableGaz of portablesGaz) {
      // Vérifier si une commande existe déjà
      const { data: existing } = await supabase
        .from('commandes_cellules')
        .select('id, statut')
        .eq('portable_gaz_id', portableGaz.id)
        .neq('statut', 'remplacé')
        .maybeSingle()

      if (!existing) {
        const portable = Array.isArray(portableGaz.portables)
          ? portableGaz.portables[0]
          : portableGaz.portables

        const site = Array.isArray(portable?.sites)
          ? portable.sites[0]
          : portable?.sites

        const client = Array.isArray(site?.clients)
          ? site.clients[0]
          : site?.clients

        const { error: insertError } = await supabase
          .from('commandes_cellules')
          .insert({
            portable_gaz_id: portableGaz.id,
            client_id: client?.id,
            site_id: site?.id,
            modele_detecteur: `${portable?.marque} ${portable?.modele}`,
            gaz: portableGaz.gaz,
            gamme_mesure: portableGaz.gamme_mesure,
            date_remplacement_theorique: portableGaz.date_prochain_remplacement,
            statut: 'attente_commande',
            notes: 'Créée automatiquement par le système d\'alertes (portable)'
          })

        if (insertError) {
          console.error(`Erreur création commande pour portable gaz ${portableGaz.id}:`, insertError)
        } else {
          nbCommandesCreees++
          console.log(`Commande créée pour portable - Gaz: ${portableGaz.gaz}`)
        }
      }
    }
  }

  const result = {
    detecteursGazAlertes: detecteursGaz?.length || 0,
    portablesGazAlertes: portablesGaz?.length || 0,
    commandesCreees: nbCommandesCreees,
    dateVerification: new Date().toISOString()
  }

  console.log('Résultat vérification:', result)

  return result
}
