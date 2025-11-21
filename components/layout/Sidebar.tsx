'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  Settings,
  Menu,
  X,
  Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  userRole?: 'admin' | 'technicien'
  userName?: string
  onLogout?: () => void
}

interface MenuItem {
  icon: any
  label: string
  href: string
  badge?: string
  color?: string
}

export function Sidebar({ userRole = 'admin', userName, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const menuItems: MenuItem[] = userRole === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', color: 'emerald' },
    { icon: FileText, label: 'Interventions', href: '/interventions', color: 'cyan' },
    { icon: Calendar, label: 'Planning', href: '/planning', color: 'blue' },
    { icon: Package, label: 'Stock', href: '/stock', color: 'purple' },
    { icon: Building2, label: 'Clients', href: '/clients', color: 'orange' },
    { icon: Users, label: 'Utilisateurs', href: '/utilisateurs', color: 'pink' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/technicien', color: 'emerald' },
    { icon: FileText, label: 'Interventions', href: '/interventions', color: 'cyan' },
    { icon: Calendar, label: 'Planning', href: '/planning', color: 'blue' },
    { icon: Building2, label: 'Clients', href: '/clients', color: 'orange' },
  ]

  const isActive = (href: string) => pathname === href

  const getColorClasses = (color: string, active: boolean) => {
    if (active) {
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
        text: 'text-white',
        icon: 'text-white'
      }
    }

    const colors: any = {
      emerald: 'text-emerald-600 group-hover:text-emerald-700',
      cyan: 'text-cyan-600 group-hover:text-cyan-700',
      blue: 'text-blue-600 group-hover:text-blue-700',
      purple: 'text-purple-600 group-hover:text-purple-700',
      orange: 'text-orange-600 group-hover:text-orange-700',
      pink: 'text-pink-600 group-hover:text-pink-700',
    }

    return {
      bg: 'bg-gray-50 group-hover:bg-gray-100',
      text: 'text-gray-700 group-hover:text-gray-900',
      icon: colors[color] || 'text-gray-600'
    }
  }

  return (
    <>
      {/* Bouton burger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Backdrop mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 80 : 280,
          x: isMobile ? (mobileOpen ? 0 : -280) : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed lg:relative h-screen bg-white border-r border-gray-200 flex flex-col shadow-xl z-50"
      >
      {/* Header with Logo */}
      <div className="h-20 border-b border-gray-300 bg-gray-800 flex items-center justify-center px-4 relative">
        {/* Bouton fermer mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Image
                src="/logo-securit-blanc.png"
                alt="SÉCUR'IT"
                width={140}
                height={35}
                priority
                className="object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              key="logo-small"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-xl">S</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - masqué sur mobile */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-700 border border-gray-600 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-white" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white" />
          )}
        </button>
      </div>

      {/* New Report Button */}
      <div className="p-4">
        <button
          onClick={() => router.push('/select-rapport-type')}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold whitespace-nowrap overflow-hidden"
              >
                Nouveau rapport
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const active = isActive(item.href)
          const colors = getColorClasses(item.color || 'gray', active)
          const Icon = item.icon

          return (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 rounded-xl transition-all group ${colors.bg}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${colors.icon}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className={`font-medium whitespace-nowrap overflow-hidden ${colors.text}`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-200 p-4">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="profile-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3"
            >
              <p className="text-xs text-gray-500 mb-1">Connecté en tant que</p>
              <p className="text-sm text-gray-800 font-semibold truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </motion.div>
          ) : (
            <motion.div
              key="profile-compact"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-3 flex justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
                {userName?.charAt(0).toUpperCase()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  )
}
