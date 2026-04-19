'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users, ShoppingBag, Coins, Key, X, Star, Computer, Snowflake, BadgeCheck, Palette, Trophy, ShoppingCart, Zap } from 'lucide-react'

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
  
  // Shop modal state
  const [shopUnlocked, setShopUnlocked] = useState(false)
  const [shopError, setShopError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  
  // Shop dialog messages for locked shop
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
  
  // Purchased items
  const [purchasedBadges, setPurchasedBadges] = useState<string[]>([])
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['default', 'pink', 'gray', 'green'])
  const [purchasedAchievements, setPurchasedAchievements] = useState<string[]>([])

  // Shop items
  const shopItems = {
    badges: [
      { id: 'star', name: 'Star Badge', icon: Star, price: 450, color: 'text-amber-400', description: 'A shining star badge' },
      { id: 'computer', name: 'Computer Badge', icon: Computer, price: 350, color: 'text-violet-500', description: 'Tech enthusiast badge' },
      { id: 'snowflake', name: 'Snowflake Badge', icon: Snowflake, price: 2000, color: 'text-cyan-400', description: 'Rare snowflake badge' },
      { id: 'verified', name: 'Verified Badge', icon: BadgeCheck, price: 9999, color: 'text-blue-500', description: 'Coming Soon!', disabled: true },
    ],
    themes: [
      { id: 'black', name: 'Black Theme', icon: Palette, price: 500, description: 'Unlock black theme for your profile' },
    ],
    achievements: [
      { id: 'shopkeeper', name: "Shopkeepers' Favorite", icon: ShoppingCart, price: 500, description: 'Spent 500 Origins in shop' },
      { id: 'buyer', name: 'Buyer', icon: ShoppingBag, price: 200, description: 'Made first purchase' },
      { id: 'shopping', name: 'Shopping', icon: Zap, price: 400, description: 'Bought 3 items' },
    ]
  }

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
        setPurchasedBadges(data.purchased_badges || [])
        setUnlockedThemes(data.unlocked_themes || ['default', 'pink', 'gray', 'green'])
        setPurchasedAchievements(data.purchased_achievements || [])
      }
      
      await loadOriginsBalance(user.id)
      await checkSecretAchievement(user.id)
      await checkShopUnlock()
    }
    load()
  }, [])

  async function loadOriginsBalance(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count, origins_balance')
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

  async function checkShopUnlock() {
    // Shop unlocks at 300 Origins
    if (originsBalance >= 300) {
      setShopUnlocked(true)
      setShopError(null)
    } else {
      setShopUnlocked(false)
      setShopError(`Need ${300 - originsBalance} more Origins to unlock the shop`)
    }
  }

  async function purchaseItem(type: string, itemId: string, price: number) {
    if (originsBalance < price) {
      alert(`Not enough Origins! You need ${price - originsBalance} more.`)
      return false
    }

    setPurchasing(itemId)

    // Check if already purchased
    if (type === 'badge' && purchasedBadges.includes(itemId)) {
      alert('You already own this badge!')
      setPurchasing(null)
      return false
    }
    if (type === 'theme' && unlockedThemes.includes(itemId)) {
      alert('You already unlocked this theme!')
      setPurchasing(null)
      return false
    }
    if (type === 'achievement' && purchasedAchievements.includes(itemId)) {
      alert('You already have this achievement!')
      setPurchasing(null)
      return false
    }

    // Deduct Origins
    const newBalance = originsBalance - price
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ origins_balance: newBalance })
      .eq('id', userId)

    if (balanceError) {
      alert('Error processing purchase')
      setPurchasing(null)
      return false
    }

    setOriginsBalance(newBalance)

    // Add purchased item
    if (type === 'badge') {
      const newBadges = [...purchasedBadges, itemId]
      setPurchasedBadges(newBadges)
      await supabase
        .from('profiles')
        .update({ purchased_badges: newBadges })
        .eq('id', userId)
      
      // Also add to profile badges
      const { data: profile } = await supabase.from('profiles').select('badges').eq('id', userId).single()
      const currentBadges = profile?.badges || []
      if (!currentBadges.includes(itemId)) {
        await supabase
          .from('profiles')
          .update({ badges: [...currentBadges, itemId] })
          .eq('id', userId)
      }
    }

    if (type === 'theme') {
      const newThemes = [...unlockedThemes, itemId]
      setUnlockedThemes(newThemes)
      await supabase
        .from('profiles')
        .update({ unlocked_themes: newThemes })
        .eq('id', userId)
    }

    if (type === 'achievement') {
      const newAchievements = [...purchasedAchievements, itemId]
      setPurchasedAchievements(newAchievements)
      await supabase
        .from('profiles')
        .update({ purchased_achievements: newAchievements })
        .eq('id', userId)
      
      // Also add as real achievement
      let achievementName = ''
      if (itemId === 'shopkeeper') achievementName = "Shopkeepers' Favorite"
      if (itemId === 'buyer') achievementName = 'Buyer'
      if (itemId === 'shopping') achievementName = 'Shopping'
      
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: 'shop',
          achievement_name: achievementName,
          achieved_at: new Date().toISOString()
        })
    }

    alert('Purchase successful! 🎉')
    setPurchasing(null)
    return true
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
    if (shopUnlocked) {
      setShopDialogStep(0)
      setShopModalOpen(true)
    } else {
      setShopDialogStep(0)
      setShopModalOpen(true)
    }
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
        {!shopUnlocked && (
          <span className="ml-2 text-xs text-amber-500">🔒 {Math.max(0, 300 - originsBalance)} to unlock</span>
        )}
        {shopUnlocked && (
          <span className="ml-2 text-xs text-green-500">✓ Unlocked</span>
        )}
      </button>

      {/* My Origins Button */}
      <button
        onClick={() => setOriginsModalOpen(true)}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <Coins className="w-4 h-4" />
        My Origins
        <span className="ml-2 text-amber-500 font-semibold">{originsBalance.toFixed(1)}</span>
      </button>

      {/* Secret Button */}
      <button
        onClick={() => setSecretModalOpen(true)}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-4 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
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
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border text-sm font-medium transition-all flex items-center justify-center gap-2 text-destructive hover:bg-white dark:hover:bg-gray-900"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* Shop Modal - Locked State */}
      {shopModalOpen && !shopUnlocked && (
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
              <p className="text-sm text-muted-foreground mb-4">
                You need {300 - originsBalance} more Origins to unlock the shop!
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

      {/* Shop Modal - Unlocked State */}
      {shopModalOpen && shopUnlocked && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShopModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-500" />
                Shop
              </h2>
              <button onClick={() => setShopModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Your Origins: <span className="font-bold">{originsBalance.toFixed(1)}</span>
                </p>
              </div>

              {/* Badges Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Badges
                </h3>
                <div className="space-y-2">
                  {shopItems.badges.map((item) => {
                    const Icon = item.icon
                    const isOwned = purchasedBadges.includes(item.id)
                    const canAfford = originsBalance >= item.price
                    const isDisabled = item.disabled
                    
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isOwned ? 'border-green-500/30 bg-green-500/5' : 'border-border'} ${isDisabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        {isOwned ? (
                          <span className="text-xs text-green-500 font-medium">✓ Owned</span>
                        ) : isDisabled ? (
                          <span className="text-xs text-muted-foreground">Coming Soon</span>
                        ) : (
                          <button
                            onClick={() => purchaseItem('badge', item.id, item.price)}
                            disabled={purchasing === item.id || !canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              canAfford 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            {item.price}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Themes Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Themes
                </h3>
                <div className="space-y-2">
                  {shopItems.themes.map((item) => {
                    const Icon = item.icon
                    const isOwned = unlockedThemes.includes(item.id)
                    const canAfford = originsBalance >= item.price
                    
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isOwned ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        {isOwned ? (
                          <span className="text-xs text-green-500 font-medium">✓ Unlocked</span>
                        ) : (
                          <button
                            onClick={() => purchaseItem('theme', item.id, item.price)}
                            disabled={purchasing === item.id || !canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              canAfford 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            {item.price}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Achievements Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Achievements
                </h3>
                <div className="space-y-2">
                  {shopItems.achievements.map((item) => {
                    const Icon = item.icon
                    const isOwned = purchasedAchievements.includes(item.id)
                    const canAfford = originsBalance >= item.price
                    
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isOwned ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        {isOwned ? (
                          <span className="text-xs text-green-500 font-medium">✓ Owned</span>
                        ) : (
                          <button
                            onClick={() => purchaseItem('achievement', item.id, item.price)}
                            disabled={purchasing === item.id || !canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              canAfford 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            {item.price}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
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

      {/* Secret Modal */}
      {secretModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSecretModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                  
                  <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-8 mb-4 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop" 
                      alt="Mysterious background" 
                      className="w-full h-40 object-cover rounded-lg opacity-80"
                    />
                    
                    <button
                      onClick={completeSecretQuest}
                      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-purple-500/0 hover:bg-purple-500/80 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100"
                      onMouseEnter={() => setSecretButtonFound(true)}
                      onMouseLeave={() => setSecretButtonFound(false)}
                    >
                      <Key className="w-4 h-4 text-white" />
                    </button>
                    
                    <button
                      className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gray-500/50 hover:bg-gray-500/70 transition-all flex items-center justify-center group"
                      onClick={() => setShowSecretHint(!showSecretHint)}
                    >
                      <span className="text-white text-xs font-bold">?</span>
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
