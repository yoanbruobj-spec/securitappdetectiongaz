import { NextResponse } from 'next/server'
import { checkAndCreateCellulesAlerts } from '@/lib/alerts/checkCellulesAlerts'

/**
 * Route API pour la vérification automatique des cellules
 * À appeler quotidiennement via un cron job
 *
 * Exemple d'utilisation:
 * GET /api/cron/check-cellules
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  // Vérifier l'authentification avec un token secret
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'default-secret-change-me'}`

  if (authHeader !== expectedAuth) {
    console.warn('Tentative d\'accès non autorisée à /api/cron/check-cellules')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('Démarrage de la vérification des cellules...')
    const result = await checkAndCreateCellulesAlerts()

    return NextResponse.json({
      success: true,
      message: 'Vérification terminée avec succès',
      ...result
    })
  } catch (error: any) {
    console.error('Erreur lors de la vérification des cellules:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Permettre aussi les requêtes POST pour plus de flexibilité
export async function POST(request: Request) {
  return GET(request)
}
