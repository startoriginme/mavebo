'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Photo } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Heart, Flame, X, Heart as HeartIcon, ExternalLink, Globe, Users } from 'lucide-react'
import PhotoViewer from '@/components/photo-viewer'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  initialFollowingPhotos: Photo[]
  initialAllPhotos: Photo[]
  userId: string
}

const SWIPE_ACHIEVEMENTS = [
  { count: 10, title: "Photo Explorer", color: "text-green-500" },
  { count: 30, title: "Photo Hunter", color: "text-blue-500" },
  { count: 60, title: "Photo Master", color: "text-purple-500" },
  { count: 120, title: "Photo Legend", color: "text-orange-500" },
  { count: 250, title: "Photo Guru", color: "text-yellow-500" },
  { count: 500, title: "Photo God", color: "text-cyan-500" },
]

export default function FeedClient({ initialFollowingPhotos, initialAllPhotos, userId }: Props) {
  const supabase = createClient()
  const [followingPhotos, setFollowingPhotos] = useState(initialFollowingPhotos)
  const [allPhotos, setAllPhotos] = useState(initialAllPhotos)
  const [showAll, setShowAll] = useState(false)
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null)
  const [tinderMode, setTinderMode] = useState(false)
  const [tinderIndex, setTinderIndex] = useState(0)
  const [swipeCount, setSwipeCount] = useState(0)
  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  
  const photos = useMemo(() => showAll ? allPhotos : followingPhotos, [showAll, allPhotos, followingPhotos])
  const isFollowingEmpty = followingPhotos.length === 0

  // Загрузка счетчика свайпов
  useEffect(() => {
    const loadSwipeCount = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('swipe_count')
        .eq('id', userId)
        .single()
      if (data) setSwipeCount(data.swipe_count || 0)
    }
    loadSwipeCount()
  }, [userId])

  // Скрытие навигации в Tinder Mode
  useEffect(() => {
    if (tinderMode) {
      document.body.classList.add('hide-nav')
    } else {
      document.body.classList.remove('hide-nav')
    }
    return () => document.body.classList.remove('hide-nav')
  }, [tinderMode])

  const updateSwipeCount = async (newCount: number) => {
    await supabase.from('profiles').update({ swipe_count: newCount }).eq('id', userId)
    
    const achievement = SWIPE_ACHIEVEMENTS.find(a => a.count === newCount)
    if (achievement) {
      setShowAchievement(achievement.title)
      setTimeout(() => setShowAchievement(null), 3000)
      await supabase.from('achievements').upsert({
        user_id: userId,
        achievement_type: 'swipe',
        achievement_name: achievement.title,
        achieved_at: new Date().toISOString()
      })
    }
  }

  const handleSwipe = async () => {
    const newCount = swipeCount + 1
    setSwipeCount(newCount)
    await updateSwipeCount(newCount)
    
    if (tinderIndex >= (showAll ? allPhotos : followingPhotos).length - 1) {
      setTinderIndex(0)
    } else {
      setTinderIndex(prev => prev + 1)
    }
  }

  const toggleLike = async (photo: Photo) => {
    const isLiked = photo.is_liked
    const updater = (prev: Photo[]) =>
      prev.map(p => p.id === photo.id ? { ...p, is_liked: !isLiked, likes_count: (p.likes_count || 0) + (isLiked ? -1 : 1) } : p)
    
    setFollowingPhotos(updater)
    setAllPhotos(updater)

    if (isLiked) {
      await supabase.from('likes').delete().eq('photo_id', photo.id).eq('user_id', userId)
    } else {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: userId })
    }
  }

  const openPhotoUrl = (url: string) => {
    window.open(url, '_blank')
  }

  // Tinder Mode
  if (tinderMode) {
    const currentPhoto = (showAll ? allPhotos : followingPhotos)[tinderIndex]
    if (!currentPhoto) return null

    return (
      <main className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <button
          onClick={() => setTinderMode(false)}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="relative w-full max-w-lg aspect-[3/4]">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.name}
            className="w-full h-full object-contain"
          />
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-semibold text-lg">{currentPhoto.name}</p>
            <div className="flex items-center gap-2 mt-2">
              {currentPhoto.profile?.avatar_url && (
                <img src={currentPhoto.profile.avatar_url} className="w-6 h-6 rounded-full" />
              )}
              <p className="text-white/80 text-sm">@{currentPhoto.profile?.username}</p>
            </div>
          </div>
        </div>
        
        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={handleSwipe}
            className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center hover:scale-110 transition"
          >
            <HeartIcon className="w-8 h-8 text-green-500" />
          </button>
        </div>
        
        {showAchievement && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 glass rounded-xl p-3 animate-bounce z-50">
            <p className="font-semibold">Achievement Unlocked! 🎉</p>
            <p className="text-sm">{showAchievement}</p>
          </div>
        )}
      </main>
    )
  }

  // Empty state
  if (isFollowingEmpty && !showAll) {
    return (
      <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Feed</h1>
          <button
            onClick={() => setTinderMode(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white"
          >
            <Flame className="w-3.5 h-3.5 inline mr-1" />
            Tinder Mode
          </button>
        </div>
        <div className="text-center py-16">
          <Users className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No posts from people you follow yet.</p>
          <Link href="/search" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg">
            Find people to follow
          </Link>
        </div>
      </main>
    )
  }

  // Main feed
  return (
    <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Feed</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTinderMode(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white"
          >
            <Flame className="w-3.5 h-3.5 inline mr-1" />
            Tinder Mode
          </button>
          {!isFollowingEmpty && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${showAll ? 'bg-primary text-white' : 'bg-muted'}`}
            >
              {showAll ? (
                <><Globe className="w-3.5 h-3.5 inline mr-1" /> All</>
              ) : (
                <><Users className="w-3.5 h-3.5 inline mr-1" /> Following</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {photos.map(photo => (
          <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <Link href={`/profile/${photo.profile?.username}`} className="flex items-center gap-2 p-3">
              <img
                src={photo.profile?.avatar_url || `https://ui-avatars.com/api/?name=${photo.profile?.name}`}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <div>
                <p className="font-semibold text-sm">{photo.profile?.name}</p>
                <p className="text-xs text-gray-500">@{photo.profile?.username}</p>
              </div>
            </Link>

            {/* Image */}
            <div className="relative aspect-square bg-gray-100 cursor-pointer" onClick={() => setViewerPhoto(photo)}>
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
            </div>

            {/* Actions */}
            <div className="p-3">
              <div className="flex items-center gap-4 mb-1">
                <button onClick={() => toggleLike(photo)} className="flex items-center gap-1">
                  <Heart className={`w-5 h-5 ${photo.is_liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                  <span className="text-sm">{photo.likes_count || 0}</span>
                </button>
                <button onClick={() => openPhotoUrl(photo.url)} className="text-gray-500 hover:text-gray-700">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
              <p className="font-semibold text-sm">{photo.name}</p>
            </div>
          </div>
        ))}
      </div>

      {viewerPhoto && <PhotoViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />}
    </main>
  )
}
