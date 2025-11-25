'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Calendar,
  Building2,
  User,
  X,
  Package,
  AlertTriangle,
  Settings,
  MoreHorizontal
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
  const [showMore, setShowMore] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Accueil',
      href: userRole === 'admin' ? '/admin' : '/technicien'
    },
    {
      icon: Calendar,
      label: 'Planning',
      href: '/planning'
    },
    {
      icon: Plus,
      label: 'Nouveau',
      href: '/select-rapport-type',
      isAction: true
    },
    {
      icon: Building2,
      label: 'Clients',
      href: '/clients'
    },
    {
      icon: User,
      label: 'Profil',
      href: '/profil'
    },
  ]

  const moreItems: NavItem[] = [
    {
      icon: ClipboardList,
      label: 'Interventions',
      href: '/interventions'
    },
    {
      icon: Package,
      label: 'Stock',
      href: '/stock'
    },
    {
      icon: AlertTriangle,
      label: 'Anomalies',
      href: '/anomalies'
    },
    {
      icon: Settings,
      label: 'Suivi Cellules',
      href: '/suivi-cellules'
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/technicien') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Check if any "more" item is active
  const isMoreActive = moreItems.some(item => isActive(item.href))

  const handleNavigation = (href: string) => {
    router.push(href)
    setShowMore(false)
  }

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Panel */}
      {showMore && (
        <div className="lg:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-4 right-4 bg-white rounded-2xl shadow-float z-50 overflow-hidden animate-slide-in-up">
          <div className="p-3">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-semibold text-slate-900">Plus d'options</span>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item, index) => {
                const active = isActive(item.href)
                const Icon = item.icon

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-xl transition-all touch-feedback',
                      active ? 'bg-emerald-50' : 'hover:bg-slate-50 active:bg-slate-100'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 transition-colors',
                      active ? 'bg-emerald-100' : 'bg-slate-100'
                    )}>
                      <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-emerald-600' : 'text-slate-600')} />
                    </div>
                    <span className={cn(
                      'text-[11px] font-medium transition-colors',
                      active ? 'text-emerald-600' : 'text-slate-600'
                    )}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/50" />

        {/* Safe area padding */}
        <div className="relative pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-[72px] px-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              if (item.isAction) {
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className="flex items-center justify-center -mt-6 touch-feedback"
                  >
                    <div className={cn(
                      'w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center',
                      'shadow-lg shadow-emerald-500/30 transition-all duration-200',
                      'hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105',
                      'active:scale-95 active:shadow-md'
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </button>
                )
              }

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all touch-feedback',
                    'max-w-[72px]'
                  )}
                >
                  <div className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                    active ? 'bg-emerald-50' : 'bg-transparent'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      active ? 'text-emerald-600' : 'text-slate-400'
                    )} />
                    {/* Active indicator dot */}
                    {active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full animate-scale-in" />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    active ? 'text-emerald-600' : 'text-slate-500'
                  )}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
