'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Calendar,
  Users,
  Building2,
  Package,
  Settings,
  Plus,
  Camera,
  History,
  LayoutDashboard,
  ArrowRight,
  Clock,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: any
  action: () => void
  keywords?: string[]
  category?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Commandes disponibles
  const commands: Command[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Aller au Dashboard',
      icon: LayoutDashboard,
      action: () => router.push('/admin'),
      keywords: ['home', 'accueil'],
      category: 'Navigation',
    },
    {
      id: 'interventions',
      label: 'Voir les Interventions',
      icon: FileText,
      action: () => router.push('/interventions'),
      keywords: ['rapports', 'reports'],
      category: 'Navigation',
    },
    {
      id: 'planning',
      label: 'Ouvrir le Planning',
      icon: Calendar,
      action: () => router.push('/planning'),
      keywords: ['calendrier', 'calendar'],
      category: 'Navigation',
    },
    {
      id: 'stock',
      label: 'Gérer le Stock',
      icon: Package,
      action: () => router.push('/stock'),
      keywords: ['inventaire', 'inventory'],
      category: 'Navigation',
    },
    {
      id: 'clients',
      label: 'Voir les Clients',
      icon: Building2,
      action: () => router.push('/clients'),
      keywords: ['customers'],
      category: 'Navigation',
    },
    {
      id: 'users',
      label: 'Gérer les Utilisateurs',
      icon: Users,
      action: () => router.push('/utilisateurs'),
      keywords: ['team', 'équipe'],
      category: 'Navigation',
    },

    // Actions rapides
    {
      id: 'new-report',
      label: 'Créer un nouveau rapport',
      icon: Plus,
      action: () => router.push('/select-rapport-type'),
      keywords: ['intervention', 'nouveau', 'new'],
      category: 'Actions',
    },
    {
      id: 'new-article',
      label: 'Ajouter un article au stock',
      icon: Package,
      action: () => router.push('/stock/nouveau'),
      keywords: ['créer', 'nouveau', 'inventaire'],
      category: 'Actions',
    },
    {
      id: 'scan-qr',
      label: 'Scanner un QR code',
      icon: Camera,
      action: () => router.push('/stock/scanner'),
      keywords: ['qr', 'scan', 'camera'],
      category: 'Actions',
    },
    {
      id: 'stock-history',
      label: 'Voir l\'historique des mouvements',
      icon: History,
      action: () => router.push('/stock'),
      keywords: ['historique', 'mouvements'],
      category: 'Actions',
    },
  ]

  // Filtrer les commandes basées sur la recherche
  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower)) ||
      cmd.category?.toLowerCase().includes(searchLower)
    )
  })

  // Grouper par catégorie
  const groupedCommands = filteredCommands.reduce<Record<string, Command[]>>((acc, cmd) => {
    const cat = cmd.category || 'Autres'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cmd)
    return acc
  }, {})

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K / Ctrl+K pour ouvrir/fermer
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }

      if (!open) return

      // Escape pour fermer
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
        setSelectedIndex(0)
      }

      // Navigation avec flèches
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      }

      // Enter pour exécuter
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filteredCommands[selectedIndex]
        if (cmd) {
          cmd.action()
          setOpen(false)
          setSearch('')
          setSelectedIndex(0)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex])

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const executeCommand = (cmd: Command) => {
    cmd.action()
    setOpen(false)
    setSearch('')
    setSelectedIndex(0)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[9999] px-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une commande ou une action..."
                  className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base"
                />
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                  ESC
                </kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Aucune commande trouvée</p>
                    <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedCommands).map(([category, cmds]) => (
                      <div key={category} className="mb-4">
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {category}
                        </div>
                        <div className="space-y-1">
                          {cmds.map((cmd, idx) => {
                            const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id)
                            const isSelected = globalIndex === selectedIndex
                            const Icon = cmd.icon

                            return (
                              <button
                                key={cmd.id}
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 ring-2 ring-emerald-500/50'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p
                                    className={`text-sm font-medium ${
                                      isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {cmd.label}
                                  </p>
                                  {cmd.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</p>
                                  )}
                                </div>
                                {isSelected && <ArrowRight className="w-4 h-4 text-emerald-600" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-semibold">
                        ↑↓
                      </kbd>
                      <span>Naviguer</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-semibold">
                        ↵
                      </kbd>
                      <span>Sélectionner</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-semibold">
                      ⌘K
                    </kbd>
                    <span>pour ouvrir</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
