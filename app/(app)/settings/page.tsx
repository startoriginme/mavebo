'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users, ShoppingBag, Coins, Key, X, Eye, EyeOff } from 'lucide-react'
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
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [originsModalOpen, setOriginsModalOpen] = useState(false)
  const [secretModalOpen, setSecretModalOpen] = useState(false)
  
  // Shop modal state (для отслеживания шага)
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
  
  // Secret quest state
  const [secretCompleted, setSecretCompleted] = useState(false)
  const [secretButtonFound, setSecretButtonFound] = useState(false)
  const [showSecretHint, setShowSecretHint] = useState(false)
  
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
      
      // Load origins balance
      await loadOriginsBalance(user.id)
      
      // Check if secret achievement is already completed
      await checkSecretAchievement(user.id)
    }
    load()
  }, [])

  async function loadOriginsBalance(userId: string) {
    // Get swipe count
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count')
      .eq('id', userId)
      .single()
    
    const swipeCountValue = profileData?.swipe_count || 0
    setSwipeCount(swipeCountValue)
    
    // Get photo count
    const { count: photoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    const photoCountValue = photoCount || 0
    setUploadCount(photoCountValue)
    
    // Calculate origins: photos (1 each) + swipes * 0.5
    const balance = photoCountValue + (swipeCountValue * 0.5)
    setOriginsBalance(balance)
  }

  async function checkSecretAchievement(userId: string) {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_name', 'Secret Agent: 1st Quest')
      .maybeSingle()
    
    if (data) {
      setSecretCompleted(true)
    }
  }

  async function completeSecretQuest() {
    if (secretCompleted) return
    
    const { error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_type: 'secret',
        achievement_name: 'Secret Agent: 1st Quest',
        achieved_at: new Date().toISOString()
      })
    
    if (!error) {
      setSecretCompleted(true)
      setSecretModalOpen(false)
      alert('🎉 Achievement unlocked: Secret Agent: 1st Quest!')
    }
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
        className="w-full py-3 rounded-xl glass mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white/20"
      >
        <ShoppingBag className="w-4 h-4" />
        Shop
      </button>

      {/* My Origins Button */}
      <button
        onClick={() => setOriginsModalOpen(true)}
        className="w-full py-3 rounded-xl glass mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white/20"
      >
        <Coins className="w-4 h-4" />
        My Origins
      </button>

      {/* Secret Button */}
      <button
        onClick={() => setSecretModalOpen(true)}
        className="w-full py-3 rounded-xl glass mb-4 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white/20"
      >
        <Key className="w-4 h-4" />
        Secret
        {secretCompleted && (
          <span className="ml-2 text-xs text-green-500">✓ Completed</span>
        )}
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
        className="liquid-button w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 text-destructive"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* Shop Modal */}
      {shopModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShopModalOpen(false)}>
          <div className="glass rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                {shopDialogStep + 1 < shopDialogMessages.length ? 'Continue...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Origins Modal */}
      {originsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOriginsModalOpen(false)}>
          <div className="glass rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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
                className="w-full py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Add Origins to Balance (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Modal - Hidden Button Quest */}
      {secretModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSecretModalOpen(false)}>
          <div className="glass rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-500" />
                Secret Quest
              </h2>
              <button onClick={() => setSecretModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {secretCompleted ? (
                <div className="text-center">
                  <p className="text-green-500 mb-2">✓ Achievement Unlocked!</p>
                  <p className="text-sm text-muted-foreground">You've already completed this quest.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground mb-4 text-center">
                    Find the hidden button to unlock "Secret Agent: 1st Quest" achievement
                  </p>
                  
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop" 
                      alt="Mysterious background" 
                      className="w-full h-40 object-cover rounded-lg opacity-70"
                    />
                    
                    {/* Скрытая кнопка - нужно найти! */}
                    <button
                      onClick={completeSecretQuest}
                      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-purple-500/0 hover:bg-purple-500/80 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100"
                      style={{ 
                        boxShadow: 'none',
                        background: secretButtonFound ? 'rgba(168, 85, 247, 0.8)' : 'transparent'
                      }}
                      onMouseEnter={() => setSecretButtonFound(true)}
                      onMouseLeave={() => setSecretButtonFound(false)}
                    >
                      <Key className="w-4 h-4 text-white" />
                    </button>
                    
                    {/* Подсказка при наведении на область */}
                    <button
                      className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gray-500/30 hover:bg-gray-500/50 transition-all flex items-center justify-center group"
                      onClick={() => setShowSecretHint(!showSecretHint)}
                    >
                      <span className="text-white text-xs">?</span>
                    </button>
                  </div>
                  
                  {showSecretHint && (
                    <p className="text-xs text-muted-foreground text-center mt-2 animate-pulse">
                      Hint: Look in the bottom right corner... 👀
                    </p>
                  )}
                  
                  {secretButtonFound && !secretCompleted && (
                    <p className="text-xs text-green-500 text-center mt-2">
                      You found it! Click the key button to claim your achievement!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
