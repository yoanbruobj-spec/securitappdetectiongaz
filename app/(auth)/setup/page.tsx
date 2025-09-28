'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const [email, setEmail] = useState('admin@securit.com')
  const [password, setPassword] = useState('Admin123!')
  const [fullName, setFullName] = useState('Admin SÉCUR\'IT')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      // 1. Créer l'utilisateur dans auth.users
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (signUpError) {
        setMessage('Erreur : ' + signUpError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        setMessage('✅ Utilisateur admin créé avec succès ! Redirection...')
        
        // Attendre que le trigger crée le profil
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Configuration initiale</h1>
          <p className="text-slate-400">Créer le premier utilisateur admin</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {message && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${
                message.includes('✅') 
                  ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-400 mb-2">
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Création...' : 'Créer l\'admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-slate-400 hover:text-white">
              ← Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}