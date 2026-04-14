'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users } from 'lucide-react'
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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setName(data.name ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url)
      }
    }
    load()
  }, [])

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
      <div className="glass-juicy rounded-2xl p-6 mb-4">
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
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:bg-black/90 active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

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
        className="liquid-button w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 text-destructive"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </main>
  )
}
