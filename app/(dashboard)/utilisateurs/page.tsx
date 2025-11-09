'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UtilisateursPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  
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
  }

  async function loadUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Loaded users:', data)
    console.log('Error loading users:', error)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-slate-800">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-slate-800">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-slate-600 hover:text-slate-800"
            >
              ← Retour
            </button>
            <h1 className="text-xl font-bold">Gestion des utilisateurs</h1>
          </div>
          <button
            onClick={() => {
              setEditingUser(null)
              setFormData({ email: '', password: '', full_name: '', role: 'technicien', phone: '' })
              setShowAddModal(true)
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-lg"
          >
            + Nouvel utilisateur
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      user.role === 'technicien' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800"
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800"
                >
                  <option value="technicien">Technicien</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-lg"
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