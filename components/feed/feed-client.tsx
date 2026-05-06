'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import type { Photo } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Heart, Images, Globe, Users, X, Heart as HeartIcon, Flame, Trophy, Sparkles, Camera, Star, Search, ExternalLink } from 'lucide-react'
import PhotoViewer from '@/components/photo-viewer'
import Link from 'next/link'

interface Props {
  initialFollowingPhotos: Photo[]
  initialAllPhotos: Photo[]
  userId: string
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

// Функция для форматирования чисел
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Мемоизированный компонент PhotoCard для предотвращения лишних ререндеров
const PhotoCard = memo(function PhotoCard({
  photo,
  onLike,
  onOpen,
  onOpenInNewTab,
}: {
  photo: Photo
  onLike: () => void
  onOpen: () => void
  onOpenInNewTab: () => void
}) {
  const formatLikes = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }, [])

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Link href={`/profile/${photo.profile?.username}`} className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {photo.profile?.avatar_url ? (
            <img 
              src={photo.profile.avatar_url} 
              alt={photo.profile.name} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {photo.profile?.name?.[0] ?? '?'}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{photo.profile?.name}</p>
          <p className="text-xs text-muted-foreground">@{photo.profile?.username}</p>
        </div>
      </Link>

      <div
        className="w-full bg-muted cursor-pointer relative"
        style={{ paddingBottom: '75%' }}
        onClick={onOpen}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 transition-colors group"
            aria-label={photo.is_liked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={`w-5 h-5 transition-all ${photo.is_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover:text-red-400'}`}
            />
            <span className={`text-sm ${photo.is_liked ? 'text-red-500' : 'text-muted-foreground'}`}>
              {formatLikes(photo.likes_count ?? 0)}
            </span>
          </button>
          <button
            onClick={onOpenInNewTab}
            className="flex items-center gap-1.5 transition-colors group text-muted-foreground hover:text-foreground"
            aria-label="Open in new tab"
            title="Open photo in full screen"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-xs">Fullscreen</span>
          </button>
        </div>
        <p className="text-sm font-semibold text-foreground">{photo.name}</p>
      </div>
    </div>
  )
})

export default function FeedClient({ initialFollowingPhotos, initialAllPhotos, userId }: Props) {
  const supabase = createClient()
  const [followingPhotos, setFollowingPhotos] = useState<Photo[]>(initialFollowingPhotos)
  const [allPhotos, setAllPhotos] = useState<Photo[]>(initialAllPhotos)
  const [showAll, setShowAll] = useState(false)
  const [viewer, setViewer] = useState<Photo | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [isLoadingInitial, setIsLoadingInitial] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastPhotoRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Tinder Mode states
  const [tinderMode, setTinderMode] = useState(false)
  const [tinderPhotos, setTinderPhotos] = useState<Photo[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [swipeCount, setSwipeCount] = useState(0)
  const [showAchievement, setShowAchievement] = useState<any>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const swipeAchievementRef = useRef<Set<string>>(new Set())

  const photos = showAll ? allPhotos : followingPhotos
  const isFollowingEmpty = followingPhotos.length === 0
  const hasPhotos = photos.length > 0
  const totalPosts = photos.length

  // Скрываем/показываем навигацию
  useEffect(() => {
    if (tinderMode) {
      document.body.classList.add('hide-nav')
    } else {
      document.body.classList.remove('hide-nav')
    }
    return () => {
      document.body.classList.remove('hide-nav')
    }
  }, [tinderMode])

  // Загружаем счетчик свайпов (один раз)
  useEffect(() => {
    if (userId) {
      loadUserSwipeCount()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadUserSwipeCount() {
    const { data } = await supabase
      .from('profiles')
      .select('swipe_count')
      .eq('id', userId)
      .single()
    
    if (data) {
      setSwipeCount(data.swipe_count || 0)
    }
  }

  async function updateSwipeCount(newCount: number) {
    // Оптимизация: проверяем, не получали ли уже эту ачивку
    const newAchievement = SWIPE_ACHIEVEMENTS.find(a => a.count === newCount)
    if (newAchievement && !swipeAchievementRef.current.has(newAchievement.title)) {
      swipeAchievementRef.current.add(newAchievement.title)
      setShowAchievement(newAchievement)
      setTimeout(() => setShowAchievement(null), 3000)
      
      // Асинхронное сохранение без ожидания
      supabase
        .from('profiles')
        .update({ swipe_count: newCount })
        .eq('id', userId)
        .then(() => {
          supabase
            .from('achievements')
            .upsert({
              user_id: userId,
              achievement_type: 'swipe',
              achievement_name: newAchievement.title,
              achieved_at: new Date().toISOString()
            })
            .catch(console.error)
        })
        .catch(console.error)
    } else {
      // Просто обновляем счетчик
      await supabase
        .from('profiles')
        .update({ swipe_count: newCount })
        .eq('id', userId)
    }
  }

  // Вход в Tinder Mode
  const enterTinderMode = useCallback(() => {
    const allPublicPhotos = [...allPhotos, ...followingPhotos].filter(p => p.privacy === 'public')
    if (allPublicPhotos.length > 0) {
      setTinderPhotos(allPublicPhotos)
      setCurrentPhotoIndex(0)
      setTinderMode(true)
    } else {
      alert("No photos available. Upload some photos first!")
    }
  }, [allPhotos, followingPhotos])

  // Выход из Tinder Mode
  const exitTinderMode = useCallback(() => {
    setTinderMode(false)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  // Обработка свайпа
  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    setCurrentPhotoIndex(prev => (prev >= tinderPhotos.length - 1 ? 0 : prev + 1))
    
    const newCount = swipeCount + 1
    setSwipeCount(newCount)
    await updateSwipeCount(newCount)
    setDragOffset({ x: 0, y: 0 })
  }, [tinderPhotos.length, swipeCount])

  // Обработка drag
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX, y: clientY })
  }, [])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (Math.abs(dragOffset.x) > 100) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left')
    }
    setDragOffset({ x: 0, y: 0 })
  }, [isDragging, dragOffset, handleSwipe])

  // Оптимизированная загрузка фото
  const loadMorePhotos = useCallback(async () => {
    if (loadingMore || !hasMore || isLoadingInitial) return
    
    setLoadingMore(true)
    
    try {
      const limit = 20
      const offset = page * limit
      
      let query = supabase
        .from('photos')
        .select(`
          *,
          profile:profiles(id, name, username, avatar_url)
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
      
      if (!showAll && followingPhotos.length > 0) {
        const followedUserIds = [...new Set(followingPhotos.map(p => p.profile?.id).filter(Boolean))]
        if (followedUserIds.length > 0) {
          query = query.in('user_id', followedUserIds)
        } else {
          setLoadingMore(false)
          return
        }
      }
      
      const { data, error } = await query.range(offset, offset + limit - 1)
      
      if (!error && data && data.length > 0) {
        const newPhotoIds = data.map(p => p.id)
        
        // Параллельные запросы для оптимизации
        const [likesResult, likesCountsResult] = await Promise.all([
          supabase.from('likes').select('photo_id').eq('user_id', userId),
          supabase.from('likes').select('photo_id').in('photo_id', newPhotoIds)
        ])
        
        const likedPhotoIds = new Set(likesResult.data?.map(l => l.photo_id) || [])
        
        const likesCountMap = new Map()
        if (likesCountsResult.data) {
          likesCountsResult.data.forEach(like => {
            likesCountMap.set(like.photo_id, (likesCountMap.get(like.photo_id) || 0) + 1)
          })
        }
        
        const newPhotos = data.map(photo => ({
          ...photo,
          is_liked: likedPhotoIds.has(photo.id),
          likes_count: likesCountMap.get(photo.id) || 0
        }))
        
        const existingIds = new Set(photos.map(p => p.id))
        const uniqueNewPhotos = newPhotos.filter(photo => !existingIds.has(photo.id))
        
        if (uniqueNewPhotos.length > 0) {
          if (showAll) {
            setAllPhotos(prev => [...prev, ...uniqueNewPhotos])
          } else {
            setFollowingPhotos(prev => [...prev, ...uniqueNewPhotos])
          }
        }
        
        setPage(prev => prev + 1)
        setHasMore(data.length === limit)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more photos:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, showAll, followingPhotos, photos, supabase, userId, isLoadingInitial])

  // Intersection observer
  useEffect(() => {
    if (!hasPhotos || loadingMore || !hasMore) return
    
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          loadMorePhotos()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    
    if (lastPhotoRef.current) {
      observerRef.current.observe(lastPhotoRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasPhotos, loadingMore, hasMore, loadMorePhotos])

  async function toggleLike(photo: Photo) {
    const isLiked = photo.is_liked
    const newLikesCount = Math.max(0, (photo.likes_count ?? 0) + (isLiked ? -1 : 1))
    
    // Оптимистичное обновление UI
    const updateState = (prev: Photo[]) =>
      prev.map((p) =>
        p.id === photo.id
          ? { ...p, is_liked: !isLiked, likes_count: newLikesCount }
          : p
      )
    
    setFollowingPhotos(updateState)
    setAllPhotos(updateState)

    // Фоновый запрос к БД
    if (isLiked) {
      await supabase.from('likes').delete().eq('photo_id', photo.id).eq('user_id', userId)
    } else {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: userId })
    }
  }

  const toggleFeed = useCallback(() => {
    setShowAll(prev => !prev)
    setPage(1)
    setHasMore(true)
  }, [])

  const openPhotoInNewTab = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  // Tinder Mode UI
  if (tinderMode) {
    const currentPhoto = tinderPhotos[currentPhotoIndex]
    const rotate = dragOffset.x * 0.05

    if (!currentPhoto) return null

    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={exitTinderMode}
            className="glass rounded-full p-3 hover:bg-primary/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="fixed top-4 left-4 z-50">
          <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold">{swipeCount}</span>
          </div>
        </div>

        {showAchievement && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <showAchievement.icon className={`w-8 h-8 ${showAchievement.color}`} />
              <div>
                <p className="font-bold text-foreground">Achievement Unlocked!</p>
                <p className="text-sm text-muted-foreground">{showAchievement.title}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            ref={cardRef}
            className="relative w-full max-w-md aspect-[3/4] cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl transition-all"
              style={{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotate}deg)`,
                transition: isDragging ? 'none' : 'all 0.3s ease-out',
              }}
            >
              <img
                src={currentPhoto.url}
                alt={currentPhoto.name}
                className="w-full h-full object-cover"
              />
              
              {dragOffset.x > 50 && (
                <div className="absolute top-8 left-8 bg-green-500/80 backdrop-blur-sm rounded-lg px-4 py-2 transform -rotate-12">
                  <HeartIcon className="w-8 h-8 text-white" />
                </div>
              )}
              {dragOffset.x < -50 && (
                <div className="absolute top-8 right-8 bg-red-500/80 backdrop-blur-sm rounded-lg px-4 py-2 transform rotate-12">
                  <X className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-lg">{currentPhoto.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {currentPhoto.profile?.avatar_url && (
                    <img
                      src={currentPhoto.profile.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <p className="text-white/90 text-sm">@{currentPhoto.profile?.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/50 flex items-center justify-center hover:scale-110 transition-all"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/50 flex items-center justify-center hover:scale-110 transition-all"
          >
            <HeartIcon className="w-8 h-8 text-green-500" />
          </button>
        </div>

        {currentPhotoIndex === tinderPhotos.length - 1 && (
          <div className="fixed bottom-32 left-0 right-0 text-center">
            <div className="glass rounded-full px-4 py-2 inline-block">
              <p className="text-xs text-muted-foreground">You've seen all photos! Starting over...</p>
            </div>
          </div>
        )}
      </main>
    )
  }

  // Empty state
  if (isFollowingEmpty && !showAll) {
    return (
      <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Feed</h1>
          <button
            onClick={enterTinderMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Tinder Mode</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-base">No posts from people you follow yet.</p>
            <p className="text-sm text-muted-foreground">Follow some users to see their photos here.</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
            <Link href="/search" className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-center">
              Find people to follow
            </Link>
            <button
              onClick={toggleFeed}
              className="w-full px-4 py-2.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Show all posts
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Feed</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={enterTinderMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:scale-105 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Tinder Mode</span>
          </button>
          {!isFollowingEmpty && (
            <button
              onClick={toggleFeed}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${showAll 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {showAll ? (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>All</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Following</span>
                </>
              )}
            </button>
          )}
          {showAll && !isFollowingEmpty && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {formatNumber(totalPosts)} posts
            </span>
          )}
        </div>
      </div>

      {!isFollowingEmpty && !showAll && followingPhotos.length > 0 && (
        <div className="mb-4 p-3 bg-muted/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Showing posts from {new Set(followingPhotos.map(p => p.profile?.id)).size} people you follow</span>
          </div>
          <button
            onClick={toggleFeed}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Globe className="w-3 h-3" />
            Show all
          </button>
        </div>
      )}

      {showAll && !isFollowingEmpty && (
        <div className="mb-4 p-3 bg-muted/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>Showing all public posts</span>
          </div>
          <button
            onClick={toggleFeed}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Users className="w-3 h-3" />
            Show following only
          </button>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            ref={index === photos.length - 1 ? lastPhotoRef : null}
          >
            <PhotoCard
              photo={photo}
              onLike={() => toggleLike(photo)}
              onOpen={() => setViewer(photo)}
              onOpenInNewTab={() => openPhotoInNewTab(photo.url)}
            />
          </div>
        ))}
        
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {!loadingMore && hasPhotos && !hasMore && (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">
              {showAll ? "You've seen all public posts" : "You've seen all posts from people you follow"}
            </p>
            {!showAll && followingPhotos.length > 0 && (
              <button
                onClick={toggleFeed}
                className="mt-3 text-sm text-primary hover:underline flex items-center justify-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                Browse all posts
              </button>
            )}
            {showAll && !isFollowingEmpty && (
              <button
                onClick={toggleFeed}
                className="mt-3 text-sm text-primary hover:underline flex items-center justify-center gap-1"
              >
                <Users className="w-3.5 h-3.5" />
                Back to following feed
              </button>
            )}
          </div>
        )}
      </div>

      {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
    </main>
  )
}
