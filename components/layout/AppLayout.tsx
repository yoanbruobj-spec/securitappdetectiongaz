'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!showNav) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Desktop Sidebar */}
      <Sidebar
        userRole={profile?.role}
        userName={profile?.full_name}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav userRole={profile?.role} />
    </div>
  )
}
