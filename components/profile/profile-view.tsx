'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Photo, BadgeType } from '@/lib/types'
import { UserPlus, UserCheck, Images, BadgeCheck, Snowflake, Monitor, Star, Settings, Trophy, Flame, Camera, Sparkles, X, Search, Upload, Eye, EyeOff, Edit2, Minus, Plus, Coins, Play, GalleryHorizontalEnd } from 'lucide-react'
import PhotoViewer from '@/components/photo-viewer'
import Link from 'next/link'

interface Props {
  profile: Profile
  photos: Photo[]
  isOwn: boolean
  currentUserId: string | null
}

const BADGE_CONFIG: Record<BadgeType, { icon: React.ElementType; color: string; label: string }> = {
  verified: { icon: BadgeCheck, color: 'text-blue-500', label: 'Verified' },
  snowflake: { icon: Snowflake, color: 'text-cyan-400', label: 'Snowflake' },
  computer: { icon: Monitor, color: 'text-violet-500', label: 'Computer' },
  star: { icon: Star, color: 'text-amber-400', label: 'Star' },
}

// Ачивки за свайпы
const SWIPE_ACHIEVEMENTS = [
  { count: 10, title: "Tinder Mode Exists?", icon: Play, color: "text-black-500", description: "Swiped 10 photos" },
  { count: 30, title: "Can't Stop Swiping", icon: GalleryHorizontalEnd, color: "text-blue-500", description: "Swiped 30 photos" },
  { count: 60, title: "Looking for... What?", icon: Star, color: "text-purple-500", description: "Swiped 60 photos" },
  { count: 120, title: "Swipe. Swipe. Swipe", icon: Flame, color: "text-orange-500", description: "Swiped 120 photos" },
  { count: 250, title: "Make Tinder Mode Shine", icon: Sparkles, color: "text-yellow-500", description: "Swiped 250 photos" },
  { count: 500, title: "Stop. It's the Final Trophy", icon: Trophy, color: "text-cyan-500", description: "Swiped 500 photos" },
]

// Ачивки за загруженные фотки
const UPLOAD_ACHIEVEMENTS = [
  { count: 1, title: "StartOrigin was Made for Photos", icon: Upload, color: "text-gray-500", description: "Uploaded first photo" },
  { count: 5, title: "Getting Started", icon: Camera, color: "text-green-500", description: "Uploaded 5 photos" },
  { count: 10, title: "Photo Enthusiast", icon: Camera, color: "text-red-500", description: "Uploaded 10 photos" },
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
  { count: 100, title: "Keep Going", icon: Trophy, color: "text-black-500", description: "Uploaded 100 photos" },
]

type Achievement = {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  achieved_at: string
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

  // Загружаем данные пользователя
  useEffect(() => {
    loadUserStats()
    loadAchievements()
    loadUserSettings()
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
  }, [swipeCount, uploadCount])

  async function calculateOriginsBalance() {
    // Формула: количество фоток (1 за каждую) + (свайпы * 0.5)
    const balance = uploadCount + (swipeCount * 0.5)
    setOriginsBalance(balance)
    
    // Сохраняем баланс в БД (опционально, если нужно хранить)
    if (isOwn) {
      await supabase
        .from('profiles')
        .update({ origins_balance: balance })
        .eq('id', profile.id)
    }
  }

  async function loadUserStats() {
    // Загружаем счетчик свайпов
    const { data: profileData } = await supabase
      .from('profiles')
      .select('swipe_count, origins_balance')
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
    }
    
    // Загружаем количество фото
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
    
    setUploadCount(count || 0)
  }

  async function loadUserSettings() {
    // Загружаем настройки скрытия свайпов
    const { data: swipeData } = await supabase
      .from('user_settings')
      .select('hide_swipe_count')
      .eq('user_id', profile.id)
      .maybeSingle()
    
    if (swipeData) {
      setHideSwipeCount(swipeData.hide_swipe_count || false)
    }
    
    // Загружаем скрытые ачивки
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

  // Добавляем значок snowflake для конкретного пользователя
  let badges: BadgeType[] = profile.badges ?? []
  
  // Проверяем, является ли пользователь @winterwastaken
  const isWinterWastaken = profile.username === 'winterwastaken' || profile.id === 'c2c721aa-bc04-4c6e-a86b-f3f105bd738f'
  const isViscaelbarca = profile.username === 'viscaelbarca' || profile.id === 'ce0f7b34-b8d7-41b7-8437-dc3fc95399bd'
const isZaharques = profile.username === 'zaharques' || profile.id === '9e6a9c61-1205-4149-9328-7ea038b10726'
  const isMavebo = profile.username === 'mavebo' || profile.id === 'fb94ce38-cdd4-4968-9e3a-ed49e12693c0'
    const isCamilakiriek = profile.username === 'camilakiriek' || profile.id === '87fbca9a-f9ea-4f58-b1e5-c6bf6d6cce7e'
  

  
  if (isWinterWastaken && !badges.includes('snowflake')) {
    badges = [...badges, 'snowflake']
  }
    if (isCamilakiriek && !badges.includes('star')) {
    badges = [...badges, 'star']
  }

  if (isViscaelbarca && !badges.includes('star')) {
  badges.push('star')
}

    if (isMavebo && !badges.includes('verified')) {
  badges.push('verified')
}

if (isZaharques && !badges.includes('computer')) {
  badges.push('computer')
}
if (isZaharques && !badges.includes('star')) {
  badges.push('star')
}

// Проверяем и добавляем значки для конкретных пользователей

if (isViscaelbarca && !badges.includes('star')) {
  badges.push('star')
}

if (isZaharques && !badges.includes('computer')) {
  badges.push('computer')
}
  
  // Фильтруем ачивки для отображения (скрытые не показываем другим)
  const visibleAchievements = achievements.filter(ach => !hiddenAchievements.has(ach.id))
  const hiddenAchievementsList = achievements.filter(ach => hiddenAchievements.has(ach.id))

  const getAchievementConfig = (achievementName: string) => {
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

  return (
    <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
      {/* Profile header */}
      <div className="glass rounded-2xl p-5 mb-5 flex flex-col items-center text-center gap-3 relative">
        {isOwn && (
          <Link
            href="/settings"
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
        
        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {profile.name?.[0] ?? '?'}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-foreground">{profile.name}</h1>
            {badges.length > 0 && (
              <div className="flex items-center gap-1">
                {badges.map((badge) => {
                  const cfg = BADGE_CONFIG[badge]
                  if (!cfg) return null
                  const Icon = cfg.icon
                  return (
                    <span key={badge} title={cfg.label} aria-label={cfg.label}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{profile.bio}</p>}
        </div>

        {/* Stats with links */}
        <div className="flex gap-6 text-center">
          <Link href={isOwn ? '/following?tab=followers' : '#'} className="hover:opacity-80 transition-opacity">
            <p className="text-lg font-semibold text-foreground">{followersCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </Link>
          <Link href={isOwn ? '/following' : '#'} className="hover:opacity-80 transition-opacity">
            <p className="text-lg font-semibold text-foreground">{profile.following_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </Link>
          <div>
            <p className="text-lg font-semibold text-foreground">{uploadCount}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </div>
          <div className="relative">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-lg font-semibold text-foreground">
                {hideSwipeCount && !isOwn ? '???' : swipeCount}
              </p>
              {isOwn && (
                <button
                  onClick={() => {
                    setTempSwipeValue(swipeCount)
                    setShowSwipeEditor(true)
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit swipe count"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Swipes</p>
            {isOwn && (
              <button
                onClick={toggleHideSwipeCount}
                className="absolute -right-6 top-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                title={hideSwipeCount ? "Show swipe count to others" : "Hide swipe count from others"}
              >
                {hideSwipeCount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Origins Balance - только для владельца профиля */}
        {isOwn && (
          <div className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">
                {originsBalance.toFixed(1)} Origins
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {uploadCount} photos + {swipeCount} swipes ×0.5
            </p>
          </div>
        )}

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

      {/* Swipe Editor Modal */}
      {showSwipeEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full">
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

      {/* Visible Achievements Section - видны всем */}
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

      {/* Hidden Achievements Section - видна только владельцу */}
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

      {/* Photos grid */}
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

      {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
    </main>
  )
}  
