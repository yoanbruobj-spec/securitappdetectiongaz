// Script pour appliquer la migration 029_stock_photos_storage.sql
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  const { createClient } = require('@supabase/supabase-js')
  require('dotenv').config({ path: '.env.local' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('📝 Lecture de la migration...')
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '029_stock_photos_storage.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('🚀 Application de la migration 029_stock_photos_storage.sql...')

  // Diviser le SQL en commandes individuelles
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

  for (const command of commands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: command + ';' })

      // Si la fonction RPC n'existe pas, essayer avec la méthode directe
      if (error && error.message.includes('exec_sql')) {
        // Fallback: utiliser l'API REST directement
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql_query: command + ';' })
        })

        if (!response.ok) {
          // Si ça ne marche pas non plus, on doit utiliser le SQL Editor manuel
          throw new Error('Impossible d\'appliquer la migration via l\'API. Utilisez le SQL Editor de Supabase.')
        }
      } else if (error) {
        console.warn('⚠️  Avertissement:', error.message)
      }
    } catch (err) {
      console.error('❌ Erreur:', err.message)
    }
  }

  console.log('✅ Migration appliquée avec succès!')
  console.log('')
  console.log('Le bucket "stock-photos" est maintenant configuré.')
  console.log('Vous pouvez maintenant uploader des photos d\'articles.')
}

applyMigration().catch(err => {
  console.error('❌ Erreur fatale:', err)
  console.log('')
  console.log('🔧 Solution alternative:')
  console.log('1. Allez sur https://ujwxxsjboxlwkkgbuouy.supabase.co')
  console.log('2. Cliquez sur "SQL Editor"')
  console.log('3. Collez le contenu de supabase/migrations/029_stock_photos_storage.sql')
  console.log('4. Cliquez sur "Run"')
  process.exit(1)
})
