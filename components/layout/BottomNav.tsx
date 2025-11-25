'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Package,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  isAction?: boolean
}

interface BottomNavProps {
  userRole?: 'admin' | 'technicien'
}

export function BottomNav({ userRole = 'admin' }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Accueil',
      href: userRole === 'admin' ? '/admin' : '/technicien'
    },
    {
      icon: ClipboardList,
      label: 'Rapports',
      href: '/interventions'
    },
    {
      icon: Plus,
      label: 'Nouveau',
      href: '/select-rapport-type',
      isAction: true
    },
    {
      icon: Package,
      label: 'Stock',
      href: '/stock'
    },
    {
      icon: User,
      label: 'Profil',
      href: '/profil'
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/technicien') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          if (item.isAction) {
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex items-center justify-center -mt-4"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                active ? 'text-emerald-600' : 'text-slate-400'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'text-emerald-500')} />
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-emerald-600' : 'text-slate-500'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
