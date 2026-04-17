'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users, ShoppingBag, Coins, X } from 'lucide-react'

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
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [originsModalOpen, setOriginsModalOpen] = useState(false)
  
  // Shop modal state
  const [shopDialogStep, setShopDialogStep] = useState(0)
  const shopDialogMessages = [
    "No entry.",
    "Go away.",
    "Closed! Forbidden!",
    "Does the word \"closed\" means something to you?",
    "Okay. Here's the hint.",
    "There are 2 options: or the shop isn't ready yet, or you don't have enough Origins to enter.",
    "Now go away. The shop will open when you're ready. When you're prepared. Now you actually aren't.",
    "(bye!)"
  ]
  
  // Origins balance
  const [originsBalance, setOriginsBalance] = useState(0)
  const [uploadCount, setUploadCount] = useState(0)
  const [swipeCount, setSwipeCount] = useState(0)

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
      
      await loadOriginsBalance(user.id)
    }
    load()
  }, [])

  async function loadOriginsBalance(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count')
      .eq('id', userId)
      .single()
    
    const swipeCountValue = profileData?.swipe_count || 0
    setSwipeCount(swipeCountValue)
    
    const { count: photoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    const photoCountValue = photoCount || 0
    setUploadCount(photoCountValue)
    
    const balance = photoCountValue + (swipeCountValue * 0.5)
    setOriginsBalance(balance)
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function handleShopClick() {
    setShopDialogStep(0)
    setShopModalOpen(true)
  }

  function handleShopNext() {
    if (shopDialogStep + 1 < shopDialogMessages.length) {
      setShopDialogStep(shopDialogStep + 1)
    } else {
      setShopModalOpen(false)
      setShopDialogStep(0)
    }
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

      {/* Shop Button */}
      <button
        onClick={handleShopClick}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <ShoppingBag className="w-4 h-4" />
        Shop
      </button>

      {/* My Origins Button */}
      <button
        onClick={() => setOriginsModalOpen(true)}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-4 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <Coins className="w-4 h-4" />
        My Origins
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
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border text-sm font-medium transition-all flex items-center justify-center gap-2 text-destructive hover:bg-white dark:hover:bg-gray-900"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* Shop Modal */}
      {shopModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShopModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=400&fit=crop)' }}>
              <button
                onClick={() => setShopModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-lg font-medium text-foreground mb-4">
                {shopDialogMessages[shopDialogStep]}
              </p>
              <button
                onClick={handleShopNext}
                className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-black/90 dark:hover:bg-white/90 transition-all"
              >
                {shopDialogStep + 1 < shopDialogMessages.length ? 'Continue...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Origins Modal */}
      {originsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setOriginsModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                My Origins
              </h2>
              <button onClick={() => setOriginsModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-amber-500">{originsBalance.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">Origins</p>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-foreground mb-2">📸 Rules:</p>
                <p className="text-xs text-muted-foreground">
                  The more swipes and photos, the more Origins.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  • {uploadCount} photos × 1 = {uploadCount} Origins<br />
                  • {swipeCount} swipes × 0.5 = {(swipeCount * 0.5).toFixed(1)} Origins
                </p>
              </div>
              
              <button
                disabled
                className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Add Origins to Balance (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
