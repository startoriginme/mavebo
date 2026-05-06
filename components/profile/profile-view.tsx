'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Photo, BadgeType } from '@/lib/types'
import { UserPlus, UserCheck, Images, BadgeCheck, Snowflake, Monitor, Star, Settings, Trophy, Flame, Camera, Sparkles, X, Search, Upload, Eye, EyeOff, Edit2, Minus, Plus, Coins, Glasses, Crown, Diamond, Heart, Award, ShoppingCart, ShoppingBag, Zap, Rocket, Leaf, Moon, Sun, Music, Book, Coffee, Gamepad, Gift, Smile } from 'lucide-react'
import PhotoViewer from '@/components/photo-viewer'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  image_url: string
  price: number
  rarity: string
}

interface UserPet {
  id: string
  user_id: string
  pet_id: string
  pet_name: string | null
  is_active: boolean
  is_hidden: boolean
  acquired_at: string
  pets?: Pet
}

interface Props {
  profile: Profile
  photos: Photo[]
  isOwn: boolean
  currentUserId: string | null
}

// РАСШИРЕННАЯ КОНФИГУРАЦИЯ ЗНАЧКОВ
const BADGE_CONFIG: Record<BadgeType, { icon: React.ElementType; color: string; label: string }> = {
  verified: { icon: BadgeCheck, color: 'text-blue-500', label: 'Verified' },
  snowflake: { icon: Snowflake, color: 'text-cyan-400', label: 'Snowflake' },
  computer: { icon: Monitor, color: 'text-violet-500', label: 'Computer' },
  star: { icon: Star, color: 'text-amber-400', label: 'Star' },
  crown: { icon: Crown, color: 'text-yellow-500', label: 'Crown' },
  diamond: { icon: Diamond, color: 'text-sky-400', label: 'Diamond' },
  heart: { icon: Heart, color: 'text-pink-500', label: 'Heart' },
  award: { icon: Award, color: 'text-emerald-500', label: 'Award' },
  rocket: { icon: Rocket, color: 'text-red-500', label: 'Rocket' },
  leaf: { icon: Leaf, color: 'text-green-600', label: 'Leaf' },
  moon: { icon: Moon, color: 'text-indigo-400', label: 'Moon' },
  sun: { icon: Sun, color: 'text-orange-500', label: 'Sun' },
  music: { icon: Music, color: 'text-pink-600', label: 'Music' },
  book: { icon: Book, color: 'text-amber-700', label: 'Book' },
  coffee: { icon: Coffee, color: 'text-amber-700', label: 'Coffee' },
  gamepad: { icon: Gamepad, color: 'text-purple-600', label: 'Gamepad' },
  gift: { icon: Gift, color: 'text-red-500', label: 'Gift' },
  smile: { icon: Smile, color: 'text-yellow-500', label: 'Smile' },
  sparkles: { icon: Sparkles, color: 'text-purple-400', label: 'Sparkles' },
}

// Ачивки за свайпы
const SWIPE_ACHIEVEMENTS = [
  { count: 10, title: "Photo Explorer", icon: Camera, color: "text-green-500", description: "Swiped 10 photos" },
  { count: 30, title: "Photo Hunter", icon: Search, color: "text-blue-500", description: "Swiped 30 photos" },
  { count: 60, title: "Photo Master", icon: Star, color: "text-purple-500", description: "Swiped 60 photos" },
  { count: 120, title: "Photo Legend", icon: Flame, color: "text-orange-500", description: "Swiped 120 photos" },
  { count: 250, title: "Photo Guru", icon: Sparkles, color: "text-yellow-500", description: "Swiped 250 photos" },
  { count: 500, title: "Photo God", icon: Trophy, color: "text-cyan-500", description: "Swiped 500 photos" },
]

// Ачивки за загруженные фотки
const UPLOAD_ACHIEVEMENTS = [
  { count: 1, title: "First Step", icon: Upload, color: "text-gray-500", description: "Uploaded first photo" },
  { count: 5, title: "Getting Started", icon: Camera, color: "text-green-500", description: "Uploaded 5 photos" },
  { count: 10, title: "Photo Enthusiast", icon: Camera, color: "text-green-500", description: "Uploaded 10 photos" },
  { count: 15, title: "Shutterbug", icon: Camera, color: "text-emerald-500", description: "Uploaded 15 photos" },
  { count: 20, title: "Getting Serious", icon: Flame, color: "text-orange-500", description: "Uploaded 20 photos" },
  { count: 25, title: "Dedicated", icon: Flame, color: "text-orange-500", description: "Uploaded 25 photos" },
  { count: 30, title: "Photography Addict", icon: Star, color: "text-purple-500", description: "Uploaded 30 photos" },
  { count: 35, title: "Photo Lover", icon: Star, color: "text-purple-500", description: "Uploaded 35 photos" },
  { count: 40, title: "Creative Eye", icon: Star, color: "text-purple-500", description: "Uploaded 40 photos" },
  { count: 45, title: "Visual Artist", icon: Star, color: "text-indigo-500", description: "Uploaded 45 photos" },
  { count: 50, title: "Photography Pro", icon: Trophy, color: "text-yellow-500", description: "Uploaded 50 photos" },
  { count: 55, title: "Expert", icon: Trophy, color: "text-yellow-500", description: "Uploaded 55 photos" },
  { count: 60, title: "Master Photographer", icon: Trophy, color: "text-yellow-500", description: "Uploaded 60 photos" },
  { count: 65, title: "Visionary", icon: Trophy, color: "text-amber-500", description: "Uploaded 65 photos" },
  { count: 70, title: "Photo Virtuoso", icon: Trophy, color: "text-amber-500", description: "Uploaded 70 photos" },
  { count: 75, title: "Artistic Soul", icon: Sparkles, color: "text-pink-500", description: "Uploaded 75 photos" },
  { count: 80, title: "Photo Legend", icon: Sparkles, color: "text-pink-500", description: "Uploaded 80 photos" },
  { count: 85, title: "Iconic", icon: Sparkles, color: "text-rose-500", description: "Uploaded 85 photos" },
  { count: 90, title: "Masterpiece Creator", icon: Sparkles, color: "text-rose-500", description: "Uploaded 90 photos" },
  { count: 95, title: "Photography Guru", icon: Trophy, color: "text-purple-500", description: "Uploaded 95 photos" },
  { count: 100, title: "Photo God", icon: Trophy, color: "text-cyan-500", description: "Uploaded 100 photos" },
]

// Ачивки из магазина (РАСШИРЕННЫЕ)
const SHOP_ACHIEVEMENTS = [
  { title: "Shopkeepers' Favorite", icon: ShoppingCart, color: "text-purple-500", description: "Spent 500 Origins in shop" },
  { title: "Buyer", icon: ShoppingBag, color: "text-green-500", description: "Made first purchase" },
  { title: "Shopping", icon: Zap, color: "text-yellow-500", description: "Bought 3 items" },
  { title: "Collector", icon: Star, color: "text-amber-500", description: "Collected 5 badges" },
  { title: "Big Spender", icon: Trophy, color: "text-red-500", description: "Spent 2000 Origins in shop" },
  { title: "Legendary", icon: Crown, color: "text-yellow-500", description: "Bought a legendary item" },
  { title: "Completionist", icon: Award, color: "text-emerald-500", description: "Collected all badges" },
  { title: "Daily Shopper", icon: ShoppingBag, color: "text-blue-500", description: "Bought something 3 days in a row" },
]

// Секретные ачивки
const SECRET_ACHIEVEMENTS = [
  { title: "Secret Agent: 1st Quest", icon: Glasses, color: "text-purple-500", description: "Completed the first secret quest" },
]

type Achievement = {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  achieved_at: string
}

// Theme configurations
const THEMES: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-white dark:bg-gray-900', text: 'text-black dark:text-white' },
  black: { bg: 'bg-black', text: 'text-white' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-900' },
  gray: { bg: 'bg-gray-300', text: 'text-gray-800' },
  green: { bg: 'bg-green-100', text: 'text-green-900' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-900 dark:text-purple-100' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-900 dark:text-orange-100' },
  red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-900 dark:text-red-100' },
}

// Pattern configurations
const PATTERNS: Record<string, string> = {
  none: '',
  circles: 'bg-[radial-gradient(circle_at_center,_#999_1px,_transparent_1px)] bg-[length:20px_20px]',
  triangles: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20d%3D%22M10%200L20%2017.32H0L10%200z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  squares: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  flowers: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%223%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%223%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2217%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%223%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2217%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  hearts: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20d%3D%22M10%2018l-1.5-1.4C4.5%2012.8%202%2010.5%202%207.5%202%205%204%203%206.5%203c1.5%200%202.9.8%203.5%202.1.6-1.3%202-2.1%203.5-2.1C16%203%2018%205%2018%207.5c0%203-2.5%205.3-6.5%209.1L10%2018z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  stars: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpolygon%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20points%3D%2210%200%2013%207%2020%207%2015%2011%2017%2018%2010%2014%203%2018%205%2011%200%207%207%207%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
}

export default function ProfileView({ profile, photos, isOwn, currentUserId }: Props) {
  const supabase = createClient()
  const [following, setFollowing] = useState(profile.is_following ?? false)
  const [followersCount, setFollowersCount] = useState(profile.followers_count ?? 0)
  const [viewer, setViewer] = useState<Photo | null>(null)
  const [swipeCount, setSwipeCount] = useState(0)
  const [originalSwipeCount, setOriginalSwipeCount] = useState(0)
  const [uploadCount, setUploadCount] = useState(photos.length)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showSwipeEditor, setShowSwipeEditor] = useState(false)
  const [tempSwipeValue, setTempSwipeValue] = useState(0)
  const [hideSwipeCount, setHideSwipeCount] = useState(false)
  const [hiddenAchievements, setHiddenAchievements] = useState<Set<string>>(new Set())
  const [showHiddenAchievements, setShowHiddenAchievements] = useState(false)
  const [originsBalance, setOriginsBalance] = useState(0)
  const [maxOriginsBalance, setMaxOriginsBalance] = useState(0)
  const [spentOrigins, setSpentOrigins] = useState(0)
  const [receivedOrigins, setReceivedOrigins] = useState(0)
  
  // Badge settings
  const [hiddenBadges, setHiddenBadges] = useState<string[]>([])
  const [badgesOrder, setBadgesOrder] = useState<string[]>(['star', 'computer', 'snowflake', 'verified', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles'])
  
  // Decoration state for profile container only
  const [themePreference, setThemePreference] = useState<string>('default')
  const [patternPreference, setPatternPreference] = useState<string>('none')

  // Pets state
  const [userPets, setUserPets] = useState<UserPet[]>([])
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null)
  const [activeTab, setActiveTab] = useState<'photos' | 'pets'>('photos')

  // Загружаем данные пользователя
  useEffect(() => {
    loadUserStats()
    loadAchievements()
    loadUserSettings()
    loadDecorations()
    loadBadgeSettings()
    loadPets()
  }, [profile.id])

  // Проверяем и добавляем ачивки за фото
  useEffect(() => {
    if (uploadCount > 0) {
      checkAndAddUploadAchievements()
    }
  }, [uploadCount])

  // Пересчитываем баланс Origins при изменении свайпов и фоток
  useEffect(() => {
    calculateOriginsBalance()
  }, [swipeCount, uploadCount, receivedOrigins])

  async function loadBadgeSettings() {
    const { data } = await supabase
      .from('profiles')
      .select('hidden_badges, badges_order')
      .eq('id', profile.id)
      .single()
    
    if (data) {
      setHiddenBadges(data.hidden_badges || [])
      setBadgesOrder(data.badges_order || ['star', 'computer', 'snowflake', 'verified', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles'])
    }
  }

  async function loadDecorations() {
    const { data } = await supabase
      .from('profiles')
      .select('theme_preference, pattern_preference')
      .eq('id', profile.id)
      .single()
    
    if (data) {
      setThemePreference(data.theme_preference || 'default')
      setPatternPreference(data.pattern_preference || 'none')
    }
  }

  async function loadPets() {
    const { data: petsData } = await supabase
      .from('pets')
      .select('*')
    
    if (petsData) {
      setAllPets(petsData)
    }
    
    const { data: userPetsData } = await supabase
      .from('user_pets')
      .select('*, pets(*)')
      .eq('user_id', profile.id)
    
    if (userPetsData) {
      setUserPets(userPetsData)
    }
  }

  async function toggleHidePet(userPetId: string) {
    const pet = userPets.find(p => p.id === userPetId)
    if (!pet) return
    
    const newHidden = !pet.is_hidden
    
    await supabase
      .from('user_pets')
      .update({ is_hidden: newHidden })
      .eq('id', userPetId)
    
    setUserPets(prev => prev.map(p => 
      p.id === userPetId ? { ...p, is_hidden: newHidden } : p
    ))
  }

  function getCurrentTheme() {
    return THEMES[themePreference] || THEMES.default
  }

  function getCurrentPattern() {
    return PATTERNS[patternPreference] || ''
  }

  async function calculateOriginsBalance() {
    // Получаем spent_origins и received_origins из БД
    const { data: profileData } = await supabase
      .from('profiles')
      .select('spent_origins, received_origins')
      .eq('id', profile.id)
      .single()
    
    const spent = profileData?.spent_origins || 0
    const received = profileData?.received_origins || 0
    
    setSpentOrigins(spent)
    setReceivedOrigins(received)
    
    // НОВАЯ ФОРМУЛА: фото + свайпы×0.5 + полученные - потраченные
    const maxBalance = uploadCount + (swipeCount * 0.5) + received
    setMaxOriginsBalance(maxBalance)
    
    const currentBalance = maxBalance - spent
    setOriginsBalance(currentBalance)
    
    if (isOwn) {
      await supabase
        .from('profiles')
        .update({ 
          origins_balance: currentBalance,
          max_origins_balance: maxBalance
        })
        .eq('id', profile.id)
    }
  }

  async function loadUserStats() {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count, origins_balance, purchased_badges, spent_origins, purchased_achievements, received_origins')
      .eq('id', profile.id)
      .single()
    
    if (profileData) {
      const count = profileData.swipe_count || 0
      setSwipeCount(count)
      setOriginalSwipeCount(count)
      setTempSwipeValue(count)
      if (profileData.origins_balance !== undefined) {
        setOriginsBalance(profileData.origins_balance)
      }
      if (profileData.spent_origins !== undefined) {
        setSpentOrigins(profileData.spent_origins)
      }
      if (profileData.received_origins !== undefined) {
        setReceivedOrigins(profileData.received_origins)
      }
    }
    
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
    
    setUploadCount(count || 0)
  }

  async function loadUserSettings() {
    const { data: swipeData } = await supabase
      .from('user_settings')
      .select('hide_swipe_count')
      .eq('user_id', profile.id)
      .maybeSingle()
    
    if (swipeData) {
      setHideSwipeCount(swipeData.hide_swipe_count || false)
    }
    
    const { data: hiddenData } = await supabase
      .from('user_settings')
      .select('hidden_achievements')
      .eq('user_id', profile.id)
      .maybeSingle()
    
    if (hiddenData?.hidden_achievements) {
      setHiddenAchievements(new Set(hiddenData.hidden_achievements))
    }
  }

  async function toggleHideSwipeCount() {
    const newValue = !hideSwipeCount
    setHideSwipeCount(newValue)
    
    await supabase
      .from('user_settings')
      .upsert({
        user_id: profile.id,
        hide_swipe_count: newValue
      }, { onConflict: 'user_id' })
  }

  async function toggleHideAchievement(achievementId: string) {
    const newHiddenSet = new Set(hiddenAchievements)
    
    if (newHiddenSet.has(achievementId)) {
      newHiddenSet.delete(achievementId)
    } else {
      newHiddenSet.add(achievementId)
    }
    
    setHiddenAchievements(newHiddenSet)
    
    await supabase
      .from('user_settings')
      .upsert({
        user_id: profile.id,
        hidden_achievements: Array.from(newHiddenSet)
      }, { onConflict: 'user_id' })
  }

  async function updateSwipeCount(newCount: number) {
    if (newCount > originalSwipeCount) {
      alert(`You cannot exceed your actual swipe count (${originalSwipeCount})`)
      return false
    }
    
    if (newCount < 0) {
      alert("Swipe count cannot be negative")
      return false
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ swipe_count: newCount })
      .eq('id', profile.id)
    
    if (!error) {
      setSwipeCount(newCount)
      setShowSwipeEditor(false)
      await checkAndAddSwipeAchievements(newCount)
      return true
    }
    return false
  }

  async function checkAndAddSwipeAchievements(currentCount: number) {
    for (const ach of SWIPE_ACHIEVEMENTS) {
      if (currentCount >= ach.count) {
        const hasAchievement = achievements.some(a => a.achievement_name === ach.title)
        if (!hasAchievement) {
          const { error } = await supabase
            .from('achievements')
            .insert({
              user_id: profile.id,
              achievement_type: 'swipe',
              achievement_name: ach.title,
              achieved_at: new Date().toISOString()
            })
          
          if (!error) {
            setAchievements(prev => [...prev, {
              id: Date.now().toString(),
              user_id: profile.id,
              achievement_type: 'swipe',
              achievement_name: ach.title,
              achieved_at: new Date().toISOString()
            }])
          }
        }
      }
    }
  }

  async function checkAndAddUploadAchievements() {
    for (const ach of UPLOAD_ACHIEVEMENTS) {
      if (uploadCount >= ach.count) {
        const hasAchievement = achievements.some(a => a.achievement_name === ach.title)
        if (!hasAchievement) {
          const { error } = await supabase
            .from('achievements')
            .insert({
              user_id: profile.id,
              achievement_type: 'upload',
              achievement_name: ach.title,
              achieved_at: new Date().toISOString()
            })
          
          if (!error) {
            setAchievements(prev => [...prev, {
              id: Date.now().toString(),
              user_id: profile.id,
              achievement_type: 'upload',
              achievement_name: ach.title,
              achieved_at: new Date().toISOString()
            }])
          }
        }
      }
    }
  }

  async function loadAchievements() {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', profile.id)
      .order('achieved_at', { ascending: false })
    
    if (data) {
      setAchievements(data)
    }
  }

  async function toggleFollow() {
    if (!currentUserId) return
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile.id)
      setFollowing(false)
      setFollowersCount((n) => Math.max(0, n - 1))
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id })
      setFollowing(true)
      setFollowersCount((n) => n + 1)
    }
  }

  // Собираем все значки с учетом скрытых и порядка
  let allAvailableBadges: BadgeType[] = []
  
  const purchasedBadges = profile.purchased_badges || []
  for (const badge of purchasedBadges) {
    if (!allAvailableBadges.includes(badge as BadgeType)) {
      allAvailableBadges.push(badge as BadgeType)
    }
  }
  
  // Специальные значки
  const isWinterWastaken = profile.username === 'winterwastaken' || profile.id === 'c2c721aa-bc04-4c6e-a86b-f3f105bd738f'
  const isViscaelbarca = profile.username === 'viscaelbarca' || profile.id === 'ce0f7b34-b8d7-41b7-8437-dc3fc95399bd'
  const isZaharques = profile.username === 'zaharques' || profile.id === '9e6a9c61-1205-4149-9328-7ea038b10726'
  const isMavebo = profile.username === 'mavebo' || profile.id === 'fb94ce38-cdd4-4968-9e3a-ed49e12693c0'
  const isCamilakiriek = profile.username === 'camilakiriek' || profile.id === '87fbca9a-f9ea-4f58-b1e5-c6bf6d6cce7e'
  
  if (isWinterWastaken && !allAvailableBadges.includes('snowflake')) {
    allAvailableBadges.push('snowflake')
  }
  if (isCamilakiriek && !allAvailableBadges.includes('star')) {
    allAvailableBadges.push('star')
  }
  if (isViscaelbarca && !allAvailableBadges.includes('star')) {
    allAvailableBadges.push('star')
  }
  if (isMavebo && !allAvailableBadges.includes('verified')) {
    allAvailableBadges.push('verified')
  }
  if (isZaharques && !allAvailableBadges.includes('computer')) {
    allAvailableBadges.push('computer')
  }
  if (isZaharques && !allAvailableBadges.includes('star')) {
    allAvailableBadges.push('star')
  }
  
  const visibleBadges = badgesOrder.filter(badgeId => 
    allAvailableBadges.includes(badgeId as BadgeType) && !hiddenBadges.includes(badgeId)
  )
  
  // Ачивки
  const purchasedAchievements = profile.purchased_achievements || []
  const allAchievements = [...achievements]
  
  for (const achId of purchasedAchievements) {
    let achName = ''
    if (achId === 'shopkeeper') achName = "Shopkeepers' Favorite"
    if (achId === 'buyer') achName = 'Buyer'
    if (achId === 'shopping') achName = 'Shopping'
    if (achId === 'collector') achName = 'Collector'
    if (achId === 'big_spender') achName = 'Big Spender'
    if (achId === 'legendary') achName = 'Legendary'
    if (achId === 'completionist') achName = 'Completionist'
    if (achId === 'daily_shopper') achName = 'Daily Shopper'
    
    if (achName && !allAchievements.some(a => a.achievement_name === achName)) {
      allAchievements.push({
        id: `shop_${achId}`,
        user_id: profile.id,
        achievement_type: 'shop',
        achievement_name: achName,
        achieved_at: new Date().toISOString()
      })
    }
  }
  
  const visibleAchievements = allAchievements.filter(ach => !hiddenAchievements.has(ach.id))
  const hiddenAchievementsList = allAchievements.filter(ach => hiddenAchievements.has(ach.id))

  const getAchievementConfig = (achievementName: string) => {
    const secretAch = SECRET_ACHIEVEMENTS.find(a => a.title === achievementName)
    if (secretAch) {
      return { icon: secretAch.icon, color: secretAch.color, label: secretAch.description }
    }
    
    const shopAch = SHOP_ACHIEVEMENTS.find(a => a.title === achievementName)
    if (shopAch) {
      return { icon: shopAch.icon, color: shopAch.color, label: shopAch.description }
    }
    
    const swipeAch = SWIPE_ACHIEVEMENTS.find(a => a.title === achievementName)
    if (swipeAch) {
      return { icon: swipeAch.icon, color: swipeAch.color, label: swipeAch.description }
    }
    const uploadAch = UPLOAD_ACHIEVEMENTS.find(a => a.title === achievementName)
    if (uploadAch) {
      return { icon: uploadAch.icon, color: uploadAch.color, label: uploadAch.description }
    }
    return null
  }

  const currentTheme = getCurrentTheme()
  const currentPattern = getCurrentPattern()
  
  const visiblePets = userPets.filter(pet => !pet.is_hidden)
  const hasVisiblePets = visiblePets.length > 0

  return (
    <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
      {/* Profile header */}
      <div className={`rounded-2xl p-5 mb-5 flex flex-col items-center text-center gap-3 relative shadow-lg transition-all duration-300 ${currentTheme.bg} ${currentTheme.text}`}>
        
        {currentPattern && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundImage: currentPattern, backgroundRepeat: 'repeat', opacity: 0.4 }} />
        )}
        
        <div className="relative z-10 w-full">
          {isOwn && (
            <Link
              href="/settings"
              className="absolute top-0 right-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
          
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted mx-auto">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {profile.name?.[0] ?? '?'}
              </div>
            )}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{profile.name}</h1>
              {visibleBadges.length > 0 && (
                <div className="flex items-center gap-1">
                  {visibleBadges.map((badgeId) => {
                    const cfg = BADGE_CONFIG[badgeId as BadgeType]
                    if (!cfg) return null
                    const Icon = cfg.icon
                    return (
                      <span key={badgeId} title={cfg.label} aria-label={cfg.label}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-sm opacity-80">@{profile.username}</p>
            {profile.bio && <p className="text-sm opacity-80 mt-1.5 leading-relaxed">{profile.bio}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center justify-center mt-3">
            <Link href={isOwn ? '/following?tab=followers' : '#'} className="hover:opacity-80 transition-opacity">
              <p className="text-lg font-semibold">{followersCount}</p>
              <p className="text-xs opacity-70">Followers</p>
            </Link>
            <Link href={isOwn ? '/following' : '#'} className="hover:opacity-80 transition-opacity">
              <p className="text-lg font-semibold">{profile.following_count ?? 0}</p>
              <p className="text-xs opacity-70">Following</p>
            </Link>
            <div>
              <p className="text-lg font-semibold">{uploadCount}</p>
              <p className="text-xs opacity-70">Photos</p>
            </div>
            <div className="relative">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-lg font-semibold">
                  {hideSwipeCount && !isOwn ? '???' : swipeCount}
                </p>
                {isOwn && (
                  <button
                    onClick={() => {
                      setTempSwipeValue(swipeCount)
                      setShowSwipeEditor(true)
                    }}
                    className="p-1 rounded-md opacity-70 hover:opacity-100 transition-colors"
                    title="Edit swipe count"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs opacity-70">Swipes</p>
              {isOwn && (
                <button
                  onClick={toggleHideSwipeCount}
                  className="absolute -right-6 top-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-colors"
                  title={hideSwipeCount ? "Show swipe count to others" : "Hide swipe count from others"}
                >
                  {hideSwipeCount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Origins Balance - новая формула */}
          {isOwn && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 inline-block mx-auto">
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold">
                  {originsBalance.toFixed(1)} Origins
                </p>
              </div>
              <p className="text-xs opacity-70 mt-1">
                {uploadCount} photos + {swipeCount}×0.5 + {receivedOrigins} received - {spentOrigins} spent = {maxOriginsBalance.toFixed(1)} - {spentOrigins} = {originsBalance.toFixed(1)}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-4 flex justify-center">
            {isOwn ? (
              <Link
                href="/settings"
                className="px-6 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors inline-flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={toggleFollow}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                  following
                    ? 'bg-secondary text-secondary-foreground hover:bg-accent'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20'
                }`}
              >
                {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Swipe Editor Modal */}
      {showSwipeEditor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Swipe Count</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Current: {swipeCount} / Max: {originalSwipeCount}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setTempSwipeValue(Math.max(0, tempSwipeValue - 1))}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={tempSwipeValue}
                onChange={(e) => setTempSwipeValue(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-center"
                min={0}
                max={originalSwipeCount}
              />
              <button
                onClick={() => setTempSwipeValue(Math.min(originalSwipeCount, tempSwipeValue + 1))}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateSwipeCount(tempSwipeValue)}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={() => setShowSwipeEditor(false)}
                className="flex-1 py-2 rounded-lg bg-muted hover:bg-muted/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visible Achievements */}
      {visibleAchievements.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Achievements
          </h2>
          <div className="flex flex-wrap gap-2">
            {visibleAchievements.map((achievement) => {
              const achConfig = getAchievementConfig(achievement.achievement_name)
              if (!achConfig) return null
              const Icon = achConfig.icon
              return (
                <div key={achievement.id} className="relative group">
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border hover:border-primary/50 transition-all"
                    title={achConfig.label}
                  >
                    <Icon className={`w-4 h-4 ${achConfig.color}`} />
                    <span className="text-xs font-medium text-foreground">{achievement.achievement_name}</span>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => toggleHideAchievement(achievement.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center transition-opacity hover:scale-110 hover:bg-destructive hover:text-destructive-foreground md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Hide achievement"
                      title="Hide from profile"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hidden Achievements */}
      {isOwn && hiddenAchievementsList.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-5 opacity-75 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowHiddenAchievements(!showHiddenAchievements)}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-3"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span>Hidden Achievements ({hiddenAchievementsList.length})</span>
            </div>
            <span className="text-xs text-muted-foreground">{showHiddenAchievements ? '▼' : '▶'}</span>
          </button>
          
          {showHiddenAchievements && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hiddenAchievementsList.map((achievement) => {
                const achConfig = getAchievementConfig(achievement.achievement_name)
                if (!achConfig) return null
                const Icon = achConfig.icon
                return (
                  <div key={achievement.id} className="relative group">
                    <div 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-dashed border-border opacity-70"
                      title={achConfig.label}
                    >
                      <Icon className={`w-4 h-4 ${achConfig.color} opacity-70`} />
                      <span className="text-xs font-medium text-muted-foreground">{achievement.achievement_name}</span>
                    </div>
                    <button
                      onClick={() => toggleHideAchievement(achievement.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-opacity hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Show achievement"
                      title="Show on profile"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${
            activeTab === 'photos' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Photos
          {activeTab === 'photos' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        {hasVisiblePets && (
          <button
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              activeTab === 'pets' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🐾 Pets
            {activeTab === 'pets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Images className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No public photos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setViewer(photo)}
                >
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pets Tab */}
      {activeTab === 'pets' && hasVisiblePets && (
        <div className="grid grid-cols-2 gap-3">
          {visiblePets.map((userPet) => {
            const pet = allPets.find(p => p.id === userPet.pet_id)
            if (!pet) return null
            return (
              <div
                key={userPet.id}
                className="glass rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={() => setSelectedPet(userPet)}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mx-auto mb-2">
                  <img 
                    src={pet.image_url} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">{userPet.pet_name || pet.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{pet.rarity}</p>
                {isOwn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleHidePet(userPet.id)
                    }}
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {userPet.is_hidden ? 'Show' : 'Hide'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pet Detail Modal */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPet(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative p-6 text-center">
              <button
                onClick={() => setSelectedPet(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
              
              {(() => {
                const pet = allPets.find(p => p.id === selectedPet.pet_id)
                if (!pet) return null
                return (
                  <>
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-muted mx-auto mb-4">
                      <img 
                        src={pet.image_url} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {selectedPet.pet_name || pet.name}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize mb-2">{pet.rarity}</p>
                    {!isOwn && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Price: <Coins className="w-4 h-4 inline text-amber-500" /> {pet.price}
                      </p>
                    )}
                    {isOwn && (
                      <button
                        onClick={() => {
                          toggleHidePet(selectedPet.id)
                          setSelectedPet(null)
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                      >
                        {selectedPet.is_hidden ? 'Show on profile' : 'Hide from profile'}
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
    </main>
  )
}
