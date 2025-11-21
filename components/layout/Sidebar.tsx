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
      {/* Bouton burger mobile - GLASSMORPHISM 3D */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 glass-strong ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-xl opacity-50 animate-pulse-glow" />
        <Menu className="relative w-6 h-6 text-white drop-shadow-lg" />
      </motion.button>

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

      {/* Sidebar - GLASSMORPHISM SPECTACULAIRE */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 80 : 280,
          x: isMobile ? (mobileOpen ? 0 : -280) : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed lg:relative h-screen bg-white/95 backdrop-blur-2xl border-r-2 border-emerald-500/20 flex flex-col shadow-2xl z-50 overflow-hidden relative"
      >
        {/* Gradient mesh background animé */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 45, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-0 w-[200px] h-[200px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
          />
          <motion.div
            animate={{
              x: [0, -40, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
              rotate: [0, -45, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
          />
        </div>
      {/* Header with Logo - GLASSMORPHISM */}
      <div className="relative h-20 border-b-2 border-emerald-500/20 glass flex items-center justify-center px-4 overflow-hidden">
        {/* Glow effect animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 animate-gradient opacity-50" />

        {/* Bouton fermer mobile */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-red-500/10 transition shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/20 group-hover:to-red-500/20 transition-all duration-300" />
          <X className="relative w-5 h-5 text-gray-700 drop-shadow-sm" />
        </motion.button>

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
              {/* Logo avec fond adaptatif */}
              <div className="relative px-4 py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl">
                <Image
                  src="/logo-securit-blanc.png"
                  alt="SÉCUR'IT"
                  width={140}
                  height={35}
                  priority
                  className="object-contain"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-small"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-md opacity-60 animate-pulse-glow" />
              <span className="relative text-white font-black text-xl drop-shadow-lg">S</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - masqué sur mobile - 3D */}
        <motion.button
          whileHover={{ scale: 1.2, rotate: collapsed ? 180 : 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 glass-strong bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full items-center justify-center shadow-xl hover:shadow-2xl transition-all z-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-sm opacity-60 animate-pulse-glow" />
          {collapsed ? (
            <ChevronRight className="relative w-3 h-3 text-white drop-shadow-lg" />
          ) : (
            <ChevronLeft className="relative w-3 h-3 text-white drop-shadow-lg" />
          )}
        </motion.button>
      </div>

      {/* New Report Button - 3D GLASSMORPHISM */}
      <div className="relative p-4">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/select-rapport-type')}
          className={`relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all overflow-hidden group`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shimmer" />

          <Plus className="relative w-5 h-5 flex-shrink-0 drop-shadow-lg" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="relative font-black whitespace-nowrap overflow-hidden drop-shadow-lg"
              >
                Nouveau rapport
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Navigation Menu - GLASSMORPHISM 3D */}
      <nav className="relative flex-1 px-3 py-2 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const active = isActive(item.href)
          const colors = getColorClasses(item.color || 'gray', active)
          const Icon = item.icon

          return (
            <motion.button
              key={index}
              onClick={() => router.push(item.href)}
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 rounded-2xl transition-all group overflow-hidden ${
                active
                  ? 'glass ring-2 ring-emerald-500/30 shadow-xl'
                  : 'hover:glass hover:ring-1 hover:ring-gray-300/30'
              }`}
            >
              {/* Glow effect pour item actif */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 animate-gradient" />
              )}

              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg'
                  : 'group-hover:bg-gray-100'
              }`}>
                {active && <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 blur-md opacity-50 animate-pulse-glow" />}
                <Icon className={`relative w-5 h-5 flex-shrink-0 ${active ? 'text-white drop-shadow-lg' : colors.icon}`} />
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className={`relative font-bold whitespace-nowrap overflow-hidden ${active ? 'text-gray-900' : colors.text}`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg"
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* User Profile & Logout - GLASSMORPHISM */}
      <div className="relative border-t-2 border-emerald-500/20 p-4 glass">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-cyan-500/5 to-transparent opacity-50" />

        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="profile-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative mb-3 p-3 glass rounded-2xl ring-1 ring-emerald-500/20"
            >
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Connecté en tant que</p>
              <p className="text-sm text-gray-900 font-black truncate">{userName}</p>
              <p className="text-xs text-emerald-600 font-bold capitalize">{userRole}</p>
            </motion.div>
          ) : (
            <motion.div
              key="profile-compact"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="relative mb-3 flex justify-center"
            >
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-md opacity-60 animate-pulse-glow" />
                <span className="relative drop-shadow-lg">{userName?.charAt(0).toUpperCase()}</span>
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
