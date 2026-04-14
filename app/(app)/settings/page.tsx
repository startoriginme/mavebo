'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users, User, Palette, Moon, Sun, Sparkles, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false)
  
  // Account settings
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [design, setDesign] = useState<'default' | 'glass'>('default')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setNewEmail(user.email || '')
      
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setName(data.name ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url)
      }
      
      // Load saved preferences
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const savedDesign = localStorage.getItem('design') as 'default' | 'glass' | null
      if (savedTheme) setTheme(savedTheme)
      if (savedDesign) setDesign(savedDesign)
      applyTheme(savedTheme || 'light')
      applyDesign(savedDesign || 'default')
    }
    load()
  }, [])

  function applyTheme(selectedTheme: 'light' | 'dark') {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', selectedTheme)
  }

  function applyDesign(selectedDesign: 'default' | 'glass') {
    if (selectedDesign === 'glass') {
      document.documentElement.classList.add('glass-design')
    } else {
      document.documentElement.classList.remove('glass-design')
    }
    localStorage.setItem('design', selectedDesign)
  }

  function handleThemeChange(selectedTheme: 'light' | 'dark') {
    setTheme(selectedTheme)
    applyTheme(selectedTheme)
  }

  function handleDesignChange(selectedDesign: 'default' | 'glass') {
    setDesign(selectedDesign)
    applyDesign(selectedDesign)
  }

  function handleAvatarChange(f: File) {
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError(null)

    let finalAvatarUrl = avatarUrl

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      finalAvatarUrl = data.publicUrl
    }

    const { error: updateError } = await supabase.from('profiles').update({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setLoading(false)
  }

  async function handleUpdateEmail() {
    if (!newEmail.trim()) {
      setAccountError('Email cannot be empty')
      return
    }
    
    setAccountLoading(true)
    setAccountError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      alert('Verification email sent! Please check your inbox.')
      setAccountModalOpen(false)
    } catch (err: any) {
      setAccountError(err.message)
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      setAccountError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setAccountError('Passwords do not match')
      return
    }
    
    setAccountLoading(true)
    setAccountError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      alert('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setAccountModalOpen(false)
    } catch (err: any) {
      setAccountError(err.message)
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setAccountError('Please type DELETE to confirm')
      return
    }
    
    setAccountLoading(true)
    setAccountError(null)
    
    try {
      // First delete all user data
      await supabase.from('photos').delete().eq('user_id', userId)
      await supabase.from('collections').delete().eq('user_id', userId)
      await supabase.from('albums').delete().eq('user_id', userId)
      await supabase.from('comments').delete().eq('user_id', userId)
      await supabase.from('likes').delete().eq('user_id', userId)
      await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)
      await supabase.from('profiles').delete().eq('id', userId)
      
      // Finally delete the user
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      
      await supabase.auth.signOut()
      router.push('/auth/choose')
    } catch (err: any) {
      setAccountError(err.message)
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const displayAvatar = avatarPreview ?? avatarUrl

  return (
    <main className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Settings</h1>

      {/* Profile Settings */}
      <div className="glass rounded-2xl p-6 mb-4">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {error && <p className="text-sm text-destructive bg-destructive/8 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-muted cursor-pointer relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {name?.[0] ?? '?'}
                </div>
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-all flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])} />
            <p className="text-xs text-muted-foreground">Click to change photo</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                required
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell people a little about yourself..."
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Settings Button */}
      <button
        onClick={() => setAccountModalOpen(true)}
        className="w-full py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2 mb-4"
      >
        <User className="w-4 h-4" />
        Account Settings
      </button>

      {/* Appearance Settings Button */}
      <button
        onClick={() => setAppearanceModalOpen(true)}
        className="w-full py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2 mb-4"
      >
        <Palette className="w-4 h-4" />
        Appearance
      </button>

      {/* Resources Section */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Resources</h2>
        <div className="space-y-2">
          <Link
            href="/about"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Users className="w-4 h-4" />
            <span>About StartOrigin</span>
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Documentation</span>
          </Link>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-card border border-border text-sm font-medium text-destructive hover:bg-destructive/5 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* Account Settings Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAccountModalOpen(false)}>
          <div className="bg-background rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Account Settings</h2>
              <button onClick={() => setAccountModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {accountError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{accountError}</p>
              )}
              
              {/* Change Email */}
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  placeholder="newemail@example.com"
                />
                <button
                  onClick={handleUpdateEmail}
                  disabled={accountLoading}
                  className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Update Email
                </button>
                <p className="text-xs text-muted-foreground mt-1">A verification email will be sent to your new address</p>
              </div>
              
              {/* Change Password */}
              <div className="border-t border-border pt-4">
                <label className="text-sm font-medium mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm pr-10"
                    placeholder="New password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <label className="text-sm font-medium mb-1 block mt-3">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  placeholder="Confirm new password"
                />
                
                <button
                  onClick={handleUpdatePassword}
                  disabled={accountLoading}
                  className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Update Password
                </button>
              </div>
              
              {/* Delete Account */}
              <div className="border-t border-border pt-4">
                <div className="bg-destructive/5 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Delete Account
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    This action is permanent. All your photos, collections, and data will be deleted.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Type "DELETE" to confirm'
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm mb-3"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={accountLoading}
                    className="w-full py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90"
                  >
                    Permanently Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Settings Modal */}
      {appearanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAppearanceModalOpen(false)}>
          <div className="bg-background rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <button onClick={() => setAppearanceModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      theme === 'light' ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      theme === 'dark' ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>
              
              {/* Design Style */}
              <div>
                <label className="text-sm font-medium mb-2 block">Design Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDesignChange('default')}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl border transition-all",
                      design === 'default' ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <span className="text-sm">Default</span>
                  </button>
                  <button
                    onClick={() => handleDesignChange('glass')}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl border transition-all",
                      design === 'glass' ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur border border-white/30" />
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-sm">Liquid Glass</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
