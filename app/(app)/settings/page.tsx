'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, LogOut, Save, BookOpen, Users, ShoppingBag, Coins, Key, X, Star, Computer, Snowflake, BadgeCheck, Palette, Trophy, ShoppingCart, Zap, GripVertical, Eye, EyeOff, Crown, Diamond, Heart, Award, Sparkles, Flame, TrendingUp, Send } from 'lucide-react'

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
  const [decorationsModalOpen, setDecorationsModalOpen] = useState(false)
  const [badgesModalOpen, setBadgesModalOpen] = useState(false)
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false)
  
  // Shop modal state
  const [shopUnlocked, setShopUnlocked] = useState(false)
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
  const [maxOriginsBalance, setMaxOriginsBalance] = useState(0)
  const [spentOrigins, setSpentOrigins] = useState(0)
  const [sentOrigins, setSentOrigins] = useState(0)
  const [receivedOrigins, setReceivedOrigins] = useState(0)
  const [uploadCount, setUploadCount] = useState(0)
  const [swipeCount, setSwipeCount] = useState(0)
  
  // Send Origins state
  const [sendUsername, setSendUsername] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  
  // Purchased items
  const [purchasedBadges, setPurchasedBadges] = useState<string[]>([])
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['default', 'pink', 'gray', 'green'])
  const [purchasedAchievements, setPurchasedAchievements] = useState<string[]>([])
  
  // Badges management
  const [hiddenBadges, setHiddenBadges] = useState<string[]>([])
  const [badgesOrder, setBadgesOrder] = useState<string[]>(['star', 'computer', 'snowflake', 'verified', 'crown', 'diamond', 'heart', 'award'])
  const [draggedBadge, setDraggedBadge] = useState<string | null>(null)

  // Decoration state
  const [selectedTheme, setSelectedTheme] = useState<string>('default')
  const [selectedPattern, setSelectedPattern] = useState<string>('none')

  // Leaderboard data
  const [leaderboardData, setLeaderboardData] = useState({
    photos: [] as any[],
    origins: [] as any[]
  })
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  // Badge config for display
  const BADGE_DISPLAY: Record<string, { name: string; icon: React.ElementType; color: string; price?: number; description?: string }> = {
    star: { name: 'Star Badge', icon: Star, color: 'text-amber-400', price: 450, description: 'A shining star badge' },
    computer: { name: 'Computer Badge', icon: Computer, color: 'text-violet-500', price: 350, description: 'Tech enthusiast badge' },
    snowflake: { name: 'Snowflake Badge', icon: Snowflake, color: 'text-cyan-400', price: 2000, description: 'Rare snowflake badge' },
    verified: { name: 'Verified Badge', icon: BadgeCheck, color: 'text-blue-500', price: 9999, description: 'Official verified badge' },
    crown: { name: 'Crown Badge', icon: Crown, color: 'text-yellow-500', price: 3000, description: 'Royal crown badge' },
    diamond: { name: 'Diamond Badge', icon: Diamond, color: 'text-sky-400', price: 5000, description: 'Rare diamond badge' },
    heart: { name: 'Heart Badge', icon: Heart, color: 'text-pink-500', price: 800, description: 'Loving heart badge' },
    award: { name: 'Award Badge', icon: Award, color: 'text-emerald-500', price: 1200, description: 'Prestigious award badge' },
    sparkles: { name: 'Sparkle Badge', icon: Sparkles, color: 'text-purple-400', price: 1500, description: 'Magical sparkle badge' },
  }

  // Theme options
  const themes = [
    { id: 'default', name: 'Default', bg: 'bg-white dark:bg-gray-900', text: 'text-black dark:text-white', preview: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900', disabled: false },
    { id: 'pink', name: 'Pink', bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-900 dark:text-pink-100', preview: 'bg-pink-300 dark:bg-pink-700', disabled: false },
    { id: 'gray', name: 'Gray', bg: 'bg-gray-300 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', preview: 'bg-gray-400 dark:bg-gray-600', disabled: false },
    { id: 'green', name: 'Green', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-900 dark:text-green-100', preview: 'bg-green-300 dark:bg-green-700', disabled: false },
    { id: 'black', name: 'Black', bg: 'bg-black', text: 'text-white', preview: 'bg-black', disabled: !unlockedThemes.includes('black') },
    { id: 'blue', name: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100', preview: 'bg-blue-300 dark:bg-blue-700', disabled: !unlockedThemes.includes('blue') },
    { id: 'purple', name: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-900 dark:text-purple-100', preview: 'bg-purple-300 dark:bg-purple-700', disabled: !unlockedThemes.includes('purple') },
    { id: 'orange', name: 'Orange', bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-900 dark:text-orange-100', preview: 'bg-orange-300 dark:bg-orange-700', disabled: !unlockedThemes.includes('orange') },
    { id: 'red', name: 'Red', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-900 dark:text-red-100', preview: 'bg-red-300 dark:bg-red-700', disabled: !unlockedThemes.includes('red') },
  ]

  // Pattern options
  const patterns = [
    { id: 'none', name: 'None', preview: 'bg-transparent' },
    { id: 'circles', name: 'Circles', preview: 'bg-[radial-gradient(circle_at_center,_#999_1px,_transparent_1px)] bg-[length:20px_20px]' },
    { id: 'triangles', name: 'Triangles', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%20d%3D%22M10%200L20%2017.32H0L10%200z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]' },
    { id: 'squares', name: 'Squares', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]' },
    { id: 'flowers', name: 'Flowers', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%223%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%223%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2217%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3Ccircle%20cx%3D%223%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3Ccircle%20cx%3D%2217%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]' },
    { id: 'hearts', name: 'Hearts', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%20d%3D%22M10%2018l-1.5-1.4C4.5%2012.8%202%2010.5%202%207.5%202%205%204%203%206.5%203c1.5%200%202.9.8%203.5%202.1.6-1.3%202-2.1%203.5-2.1C16%203%2018%205%2018%207.5c0%203-2.5%205.3-6.5%209.1L10%2018z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]' },
    { id: 'stars', name: 'Stars', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpolygon%20fill%3D%22%23999%22%20fill-opacity%3D%220.2%22%20points%3D%2210%200%2013%207%2020%207%2015%2011%2017%2018%2010%2014%203%2018%205%2011%200%207%207%207%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]' },
  ]

  // Shop items
  const shopItems = {
    badges: [
      { id: 'star', name: 'Star Badge', icon: Star, price: 450, color: 'text-amber-400', description: 'A shining star badge' },
      { id: 'computer', name: 'Computer Badge', icon: Computer, price: 350, color: 'text-violet-500', description: 'Tech enthusiast badge' },
      { id: 'heart', name: 'Heart Badge', icon: Heart, price: 800, color: 'text-pink-500', description: 'Loving heart badge' },
      { id: 'crown', name: 'Crown Badge', icon: Crown, price: 3000, color: 'text-yellow-500', description: 'Royal crown badge' },
      { id: 'diamond', name: 'Diamond Badge', icon: Diamond, price: 5000, color: 'text-sky-400', description: 'Rare diamond badge' },
      { id: 'award', name: 'Award Badge', icon: Award, price: 1200, color: 'text-emerald-500', description: 'Prestigious award badge' },
      { id: 'sparkles', name: 'Sparkle Badge', icon: Sparkles, price: 1500, color: 'text-purple-400', description: 'Magical sparkle badge' },
      { id: 'snowflake', name: 'Snowflake Badge', icon: Snowflake, price: 2000, color: 'text-cyan-400', description: 'Rare snowflake badge' },
      { id: 'verified', name: 'Verified Badge', icon: BadgeCheck, price: 9999, color: 'text-blue-500', description: 'Coming Soon!', disabled: true },
    ],
    themes: [
      { id: 'black', name: 'Black Theme', icon: Palette, price: 500, description: 'Unlock black theme for your profile' },
      { id: 'blue', name: 'Blue Theme', icon: Palette, price: 300, description: 'Unlock blue theme for your profile' },
      { id: 'purple', name: 'Purple Theme', icon: Palette, price: 300, description: 'Unlock purple theme for your profile' },
      { id: 'orange', name: 'Orange Theme', icon: Palette, price: 300, description: 'Unlock orange theme for your profile' },
      { id: 'red', name: 'Red Theme', icon: Palette, price: 300, description: 'Unlock red theme for your profile' },
    ],
    achievements: [
      { id: 'shopkeeper', name: "Shopkeepers' Favorite", icon: ShoppingCart, price: 500, description: 'Spent 500 Origins in shop' },
      { id: 'buyer', name: 'Buyer', icon: ShoppingBag, price: 200, description: 'Made first purchase' },
      { id: 'shopping', name: 'Shopping', icon: Zap, price: 400, description: 'Bought 3 items' },
    ],
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
        setSelectedTheme(data.theme_preference || 'default')
        setSelectedPattern(data.pattern_preference || 'none')
        setShopUnlocked(data.shop_unlocked || false)
        setSpentOrigins(data.spent_origins || 0)
        setSentOrigins(data.sent_origins || 0)
        setReceivedOrigins(data.received_origins || 0)
        setHiddenBadges(data.hidden_badges || [])
        setBadgesOrder(data.badges_order || ['star', 'computer', 'snowflake', 'verified', 'crown', 'diamond', 'heart', 'award'])
      }
      
      await loadOriginsBalance(user.id)
      await checkSecretAchievement(user.id)
      await loadDecorations()
    }
    load()
  }, [])

  async function loadLeaderboard() {
    setLoadingLeaderboard(true)
    
    try {
      const { data: photosTop } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, photo_count')
        .order('photo_count', { ascending: false })
        .limit(5)
      
      const { data: originsTop } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, origins_balance')
        .order('origins_balance', { ascending: false })
        .limit(5)
      
      setLeaderboardData({
        photos: photosTop || [],
        origins: originsTop || []
      })
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  async function loadDecorations() {
    if (!userId) return
    const { data } = await supabase
      .from('profiles')
      .select('theme_preference, pattern_preference')
      .eq('id', userId)
      .maybeSingle()
    
    if (data) {
      setSelectedTheme(data.theme_preference || 'default')
      setSelectedPattern(data.pattern_preference || 'none')
    }
  }

  async function saveThemeAndPattern(themeId: string, patternId: string) {
    setSelectedTheme(themeId)
    setSelectedPattern(patternId)
    
    await supabase
      .from('profiles')
      .update({
        theme_preference: themeId,
        pattern_preference: patternId
      })
      .eq('id', userId)
  }

  async function loadOriginsBalance(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count, origins_balance, spent_origins, sent_origins, received_origins')
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
    
    const sent = profileData?.sent_origins || 0
    const received = profileData?.received_origins || 0
    setSentOrigins(sent)
    setReceivedOrigins(received)
    
    // Новая формула: фото × 1 + свайпы × 0.5 + полученные - отправленные - потраченные
    const maxBalance = photoCountValue + (swipeCountValue * 0.5) + received
    setMaxOriginsBalance(maxBalance)
    
    const currentBalance = maxBalance - sent - (profileData?.spent_origins || 0)
    setOriginsBalance(currentBalance)
    
    // Обновляем баланс в БД если расходится
    if (profileData?.origins_balance !== currentBalance) {
      await supabase
        .from('profiles')
        .update({ origins_balance: currentBalance })
        .eq('id', userId)
    }
  }

  async function sendOrigins() {
    if (!userId) return
    if (!sendUsername.trim()) {
      setSendError('Enter username')
      return
    }
    const amount = parseFloat(sendAmount)
    if (isNaN(amount) || amount <= 0) {
      setSendError('Enter valid amount')
      return
    }
    if (amount > originsBalance) {
      setSendError(`Not enough Origins! You have ${originsBalance.toFixed(1)}`)
      return
    }
    
    setSending(true)
    setSendError('')
    setSendSuccess('')
    
    try {
      // Находим получателя
      const { data: receiver, error: findError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', sendUsername.toLowerCase())
        .maybeSingle()
      
      if (findError || !receiver) {
        setSendError('User not found')
        setSending(false)
        return
      }
      
      if (receiver.id === userId) {
        setSendError('You cannot send Origins to yourself')
        setSending(false)
        return
      }
      
      // Обновляем отправителя
      const newSent = sentOrigins + amount
      const newBalance = originsBalance - amount
      
      const { error: senderError } = await supabase
        .from('profiles')
        .update({
          sent_origins: newSent,
          origins_balance: newBalance
        })
        .eq('id', userId)
      
      if (senderError) throw senderError
      
      // Обновляем получателя
      const { data: receiverData } = await supabase
        .from('profiles')
        .select('origins_balance, received_origins')
        .eq('id', receiver.id)
        .single()
      
      const newReceived = (receiverData?.received_origins || 0) + amount
      const newReceiverBalance = (receiverData?.origins_balance || 0) + amount
      
      const { error: receiverError } = await supabase
        .from('profiles')
        .update({
          received_origins: newReceived,
          origins_balance: newReceiverBalance
        })
        .eq('id', receiver.id)
      
      if (receiverError) throw receiverError
      
      setSentOrigins(newSent)
      setOriginsBalance(newBalance)
      setSendSuccess(`Sent ${amount} Origins to @${receiver.username}!`)
      setSendUsername('')
      setSendAmount('')
      
      // Обновляем максимальный баланс
      const maxBalance = uploadCount + (swipeCount * 0.5) + receivedOrigins
      setMaxOriginsBalance(maxBalance)
      
    } catch (error) {
      console.error('Error sending Origins:', error)
      setSendError('Failed to send Origins')
    } finally {
      setSending(false)
    }
  }

  async function saveBadgesSettings() {
    await supabase
      .from('profiles')
      .update({
        hidden_badges: hiddenBadges,
        badges_order: badgesOrder
      })
      .eq('id', userId)
    
    alert('Badge settings saved!')
    setBadgesModalOpen(false)
  }

  function toggleHideBadge(badgeId: string) {
    if (hiddenBadges.includes(badgeId)) {
      setHiddenBadges(hiddenBadges.filter(id => id !== badgeId))
    } else {
      setHiddenBadges([...hiddenBadges, badgeId])
    }
  }

  function moveBadgeUp(badgeId: string) {
    const index = badgesOrder.indexOf(badgeId)
    if (index > 0) {
      const newOrder = [...badgesOrder]
      ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      setBadgesOrder(newOrder)
    }
  }

  function moveBadgeDown(badgeId: string) {
    const index = badgesOrder.indexOf(badgeId)
    if (index < badgesOrder.length - 1) {
      const newOrder = [...badgesOrder]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      setBadgesOrder(newOrder)
    }
  }

  function handleDragStart(badgeId: string) {
    setDraggedBadge(badgeId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetBadgeId: string) {
    if (draggedBadge && draggedBadge !== targetBadgeId) {
      const draggedIndex = badgesOrder.indexOf(draggedBadge)
      const targetIndex = badgesOrder.indexOf(targetBadgeId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...badgesOrder]
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedBadge)
        setBadgesOrder(newOrder)
      }
    }
    setDraggedBadge(null)
  }

  async function unlockShopPermanently() {
    if (shopUnlocked) return
    
    await supabase
      .from('profiles')
      .update({ shop_unlocked: true })
      .eq('id', userId)
    
    setShopUnlocked(true)
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

  async function purchaseItem(type: string, itemId: string, price: number) {
    if (originsBalance < price) {
      alert(`Not enough Origins! You need ${(price - originsBalance).toFixed(1)} more.`)
      return false
    }

    setPurchasing(itemId)

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

    const newSpent = spentOrigins + price
    const newBalance = originsBalance - price
    
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ 
        spent_origins: newSpent,
        origins_balance: newBalance
      })
      .eq('id', userId)

    if (balanceError) {
      alert('Error processing purchase')
      setPurchasing(null)
      return false
    }

    setSpentOrigins(newSpent)
    setOriginsBalance(newBalance)

    if (type === 'badge') {
      const newBadges = [...purchasedBadges, itemId]
      setPurchasedBadges(newBadges)
      await supabase
        .from('profiles')
        .update({ purchased_badges: newBadges })
        .eq('id', userId)
      
      if (!badgesOrder.includes(itemId)) {
        const newOrder = [...badgesOrder, itemId]
        setBadgesOrder(newOrder)
        await supabase
          .from('profiles')
          .update({ badges_order: newOrder })
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
      setShopModalOpen(true)
    } else if (originsBalance >= 300) {
      unlockShopPermanently()
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
  const visibleBadges = badgesOrder.filter(b => !hiddenBadges.includes(b) && purchasedBadges.includes(b))

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

      {/* Leaderboard Button */}
      <button
        onClick={() => {
          loadLeaderboard()
          setLeaderboardModalOpen(true)
        }}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <TrendingUp className="w-4 h-4" />
        Leaderboard
      </button>

      {/* My Badges Button */}
      <button
        onClick={() => setBadgesModalOpen(true)}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <Star className="w-4 h-4" />
        My Badges
        {visibleBadges.length > 0 && (
          <span className="ml-2 text-xs text-green-500">{visibleBadges.length} shown</span>
        )}
      </button>

      {/* Decorations Button */}
      <button
        onClick={() => setDecorationsModalOpen(true)}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <Palette className="w-4 h-4" />
        Decorations
      </button>

      {/* Shop Button */}
      <button
        onClick={handleShopClick}
        className="w-full py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border mb-3 text-sm font-medium transition-all flex items-center justify-center gap-2 text-foreground hover:bg-white dark:hover:bg-gray-900"
      >
        <ShoppingBag className="w-4 h-4" />
        Shop
        {!shopUnlocked && originsBalance < 300 ? (
          <span className="ml-2 text-xs text-amber-500">🔒 {Math.ceil(300 - originsBalance)} to unlock</span>
        ) : (
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

      {/* Leaderboard Modal */}
      {leaderboardModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setLeaderboardModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </h2>
              <button onClick={() => setLeaderboardModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {loadingLeaderboard ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-green-500" />
                      Most Photos
                    </h3>
                    <div className="space-y-2">
                      {leaderboardData.photos.map((user, idx) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-sm font-bold text-yellow-500">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs">
                                  {user.name?.[0] || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{user.photo_count || 0} photos</span>
                        </div>
                      ))}
                      {leaderboardData.photos.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">No data yet</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Richest (Origins)
                    </h3>
                    <div className="space-y-2">
                      {leaderboardData.origins.map((user, idx) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-sm font-bold text-yellow-500">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs">
                                  {user.name?.[0] || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{user.origins_balance?.toFixed(1) || 0} Origins</span>
                        </div>
                      ))}
                      {leaderboardData.origins.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">No data yet</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Badges Modal */}
      {badgesModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setBadgesModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                My Badges
              </h2>
              <button onClick={() => setBadgesModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Drag to reorder · Click 👁️ to hide/show
              </p>
              
              <div className="space-y-2 mb-6">
                {badgesOrder.map((badgeId) => {
                  const badge = BADGE_DISPLAY[badgeId]
                  if (!badge) return null
                  const Icon = badge.icon
                  const isHidden = hiddenBadges.includes(badgeId)
                  const isOwned = purchasedBadges.includes(badgeId)
                  
                  if (!isOwned) return null
                  
                  return (
                    <div
                      key={badgeId}
                      draggable
                      onDragStart={() => handleDragStart(badgeId)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(badgeId)}
                      className={`flex items-center justify-between p-3 rounded-xl border ${isHidden ? 'border-dashed opacity-50' : 'border-border'} bg-muted/20 cursor-move transition-all hover:bg-muted/40`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${badge.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isHidden ? 'Hidden from profile' : 'Visible on profile'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveBadgeUp(badgeId)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          disabled={badgesOrder.indexOf(badgeId) === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBadgeDown(badgeId)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          disabled={badgesOrder.indexOf(badgeId) === badgesOrder.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleHideBadge(badgeId)}
                          className={`p-1 rounded transition-colors ${isHidden ? 'hover:bg-green-500/20' : 'hover:bg-destructive/20'}`}
                        >
                          {isHidden ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-destructive" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={saveBadgesSettings}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setBadgesModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Modal - Locked State */}
      {shopModalOpen && !shopUnlocked && originsBalance < 300 && (
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
                You need {Math.ceil(300 - originsBalance)} more Origins to unlock the shop!
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
      {(shopModalOpen && (shopUnlocked || originsBalance >= 300)) && (
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
              <div className="text-center mb-6 space-y-2">
                <div>
                  <p className="text-3xl font-bold text-amber-500">{originsBalance.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xl font-semibold text-foreground">{maxOriginsBalance.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-foreground mb-2">📸 How Origins work:</p>
                <p className="text-xs text-muted-foreground">
                  Formula: Photos + Swipes×0.5 + Received - Sent - Spent
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  • {uploadCount} photos × 1 = {uploadCount}<br />
                  • {swipeCount} swipes × 0.5 = {(swipeCount * 0.5).toFixed(1)}<br />
                  • Received: {receivedOrigins.toFixed(1)}<br />
                  • Sent: {sentOrigins.toFixed(1)}<br />
                  • Spent: {spentOrigins.toFixed(1)}
                </p>
                <p className="text-xs text-amber-500 mt-2">
                  Balance: {maxOriginsBalance.toFixed(1)} - {sentOrigins.toFixed(1)} - {spentOrigins.toFixed(1)} = {originsBalance.toFixed(1)}
                </p>
              </div>

              {/* Send Origins Form */}
              <div className="border-t border-border pt-4 mb-4">
                <p className="text-sm font-medium text-foreground mb-3">Send Origins to a friend</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={sendUsername}
                    onChange={(e) => setSendUsername(e.target.value)}
                    placeholder="Username (without @)"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {sendError && <p className="text-sm text-destructive">{sendError}</p>}
                  {sendSuccess && <p className="text-sm text-green-500">{sendSuccess}</p>}
                  <button
                    onClick={sendOrigins}
                    disabled={sending}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Origins'}
                  </button>
                </div>
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

      {/* Decorations Modal */}
      {decorationsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setDecorationsModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                Decorations
              </h2>
              <button onClick={() => setDecorationsModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Themes Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Themes</h3>
                <div className="grid grid-cols-5 gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => !theme.disabled && saveThemeAndPattern(theme.id, selectedPattern)}
                      disabled={theme.disabled}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        selectedTheme === theme.id
                          ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
                          : 'hover:bg-muted/50'
                      } ${theme.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${theme.preview} border border-border`} />
                      <span className={`text-xs ${selectedTheme === theme.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {theme.name}
                      </span>
                      {theme.disabled && (
                        <span className="text-[10px] text-amber-500">🔒</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  💡 New themes (Blue, Purple, Orange, Red) are locked by default. Buy them in the Shop!
                </p>
              </div>

              {/* Patterns Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Patterns</h3>
                <div className="grid grid-cols-3 gap-2">
                  {patterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => saveThemeAndPattern(selectedTheme, pattern.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        selectedPattern === pattern.id
                          ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className={`w-full h-10 rounded-lg bg-gray-200 dark:bg-gray-700 ${pattern.preview} border border-border`} />
                      <span className={`text-xs ${selectedPattern === pattern.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {pattern.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your decorations will appear on your profile page
              </p>
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
