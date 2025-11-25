'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Building2,
  Package,
  ChevronLeft,
  LogOut,
  Plus,
  AlertTriangle,
  Flame,
  ChevronDown,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole?: 'admin' | 'technicien'
  userName?: string
  onLogout?: () => void
}

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
}

interface MenuGroup {
  title: string
  icon: React.ElementType
  items: MenuItem[]
}

export function Sidebar({ userRole = 'admin', userName, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(['detection'])
  const router = useRouter()
  const pathname = usePathname()

  const mainMenuItems: MenuItem[] = userRole === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Calendar, label: 'Planning', href: '/planning' },
    { icon: Package, label: 'Stock', href: '/stock' },
    { icon: Building2, label: 'Clients', href: '/clients' },
    { icon: Users, label: 'Utilisateurs', href: '/utilisateurs' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/technicien' },
    { icon: Calendar, label: 'Planning', href: '/planning' },
    { icon: Building2, label: 'Clients', href: '/clients' },
  ]

  const menuGroups: MenuGroup[] = [
    {
      title: 'Détection Gaz',
      icon: Flame,
      items: [
        { icon: FileText, label: 'Interventions', href: '/interventions' },
        { icon: AlertTriangle, label: 'Anomalies', href: '/anomalies' },
        { icon: Settings, label: 'Suivi Cellules', href: '/suivi-cellules' },
      ]
    }
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(g => g !== title)
        : [...prev, title]
    )
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="bg-slate-700 rounded-lg px-3 py-1.5">
            <Image
              src="/logo-securit.png"
              alt="SÉCUR'IT"
              width={120}
              height={32}
              priority
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* New Report Button */}
      <div className="p-3">
        <button
          onClick={() => router.push('/select-rapport-type')}
          className={cn(
            'w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
            collapsed && 'px-0'
          )}
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span>Nouveau rapport</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* Main Menu */}
        <div className="space-y-1">
          {mainMenuItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-emerald-500')} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>

        {/* Menu Groups */}
        {menuGroups.map((group) => {
          const isOpen = openGroups.includes(group.title.toLowerCase())
          const GroupIcon = group.icon

          return (
            <div key={group.title} className="mt-4">
              <button
                onClick={() => toggleGroup(group.title.toLowerCase())}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                  <GroupIcon className="w-3.5 h-3.5 text-orange-500" />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.title}</span>
                    <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                  </>
                )}
              </button>

              {isOpen && !collapsed && (
                <div className="mt-1 ml-3 pl-5 border-l border-slate-200 space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon

                    return (
                      <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          active
                            ? 'bg-emerald-50 text-emerald-600 font-medium'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', active && 'text-emerald-500')} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-semibold text-sm">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 capitalize">{userRole}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-semibold text-sm">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
