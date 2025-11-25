'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  Moon,
  HelpCircle,
  FileText,
  Settings,
  Package,
  AlertTriangle,
  ClipboardList,
  Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  role: 'admin' | 'technicien'
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          nom: userData.nom,
          prenom: userData.prenom,
          telephone: userData.telephone,
          role: userData.role
        })
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const quickLinks = [
    { icon: ClipboardList, label: 'Interventions', href: '/interventions', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Package, label: 'Stock', href: '/stock', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: AlertTriangle, label: 'Anomalies', href: '/anomalies', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Settings, label: 'Suivi Cellules', href: '/suivi-cellules', color: 'text-slate-500', bg: 'bg-slate-100' },
  ]

  const menuItems = [
    { icon: Bell, label: 'Notifications', href: '#', badge: '3' },
    { icon: Moon, label: 'Mode sombre', href: '#', toggle: true },
    { icon: HelpCircle, label: 'Aide & Support', href: '#' },
    { icon: FileText, label: 'Conditions d\'utilisation', href: '#' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        userRole={user?.role}
        userName={user ? `${user.prenom} ${user.nom}` : undefined}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-24 lg:pb-8">
        {/* Header Mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">Mon Profil</h1>
        </header>

        {/* Header Desktop */}
        <header className="hidden lg:block bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Mon Profil</h1>
          <p className="text-slate-500 mt-1">Gérez vos informations personnelles</p>
        </header>

        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
          {/* User Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">
                  {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {user?.prenom} {user?.nom}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {user?.role === 'admin' ? 'Administrateur' : 'Technicien'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-sm">{user?.email}</span>
              </div>
              {user?.telephone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span className="text-sm">{user?.telephone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm">Compte vérifié</span>
              </div>
            </div>
          </div>

          {/* Quick Links - Mobile Only */}
          <div className="lg:hidden mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
              Accès rapide
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {quickLinks.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 active:scale-95 transition-transform"
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-1.5', item.bg)}>
                      <Icon className={cn('w-5 h-5', item.color)} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left',
                    index !== menuItems.length - 1 && 'border-b border-slate-100'
                  )}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-900">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.toggle ? (
                    <div className="w-11 h-6 bg-slate-200 rounded-full relative">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>

          {/* Version */}
          <p className="text-center text-xs text-slate-400 mt-6">
            SÉCUR'IT v1.0.0
          </p>
        </div>
      </main>

      <BottomNav userRole={user?.role} />
    </div>
  )
}
