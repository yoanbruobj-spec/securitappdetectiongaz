'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  User,
  X,
  Search
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function UtilisateursPage() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'technicien' as 'admin' | 'technicien' | 'client',
    phone: ''
  })

  useEffect(() => {
    checkAuth()
    loadUsers()
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

    if (profileData?.role !== 'admin') {
      router.push('/admin')
      return
    }

    setProfile(profileData)
  }

  async function loadUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone
          })
          .eq('id', editingUser.id)

        if (error) throw error
        alert('Utilisateur modifié avec succès')
      } else {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur')
        }

        alert('Utilisateur créé avec succès')
      }

      setShowAddModal(false)
      setEditingUser(null)
      setFormData({ email: '', password: '', full_name: '', role: 'technicien', phone: '' })

      if (!editingUser) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      await loadUsers()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur: ' + error.message)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'utilisateur')
      }

      alert('Utilisateur supprimé avec succès')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur: ' + error.message)
    }
  }

  function openEditModal(user: any) {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || ''
    })
    setShowAddModal(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" size="sm">Admin</Badge>
      case 'technicien':
        return <Badge variant="info" size="sm">Technicien</Badge>
      case 'client':
        return <Badge variant="success" size="sm">Client</Badge>
      default:
        return <Badge variant="default" size="sm">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar userRole="admin" userName={profile?.full_name} onLogout={handleLogout} />

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/admin')}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Utilisateurs</h1>
                  <p className="text-sm text-slate-500 hidden lg:block">{users.length} utilisateur(s)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setFormData({ email: '', password: '', full_name: '', role: 'technicien', phone: '' })
                  setShowAddModal(true)
                }}
                className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouvel utilisateur</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun utilisateur</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery ? 'Aucun résultat pour votre recherche' : 'Créez votre premier utilisateur'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Téléphone</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-emerald-600 font-semibold">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 text-slate-600">{user.phone || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="h-8 px-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="h-8 px-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold text-lg">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.full_name}</p>
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex-1 h-9 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex-1 h-9 text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav userRole="admin" />

      {/* Modal Utilisateur */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingUser(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  required
                  className={cn(
                    "w-full h-11 px-4 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    editingUser ? "bg-slate-100 cursor-not-allowed" : "bg-slate-50"
                  )}
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="technicien">Technicien</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 h-11 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
