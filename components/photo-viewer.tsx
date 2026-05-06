'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/lib/types'
import { X, Heart, ImageOff } from 'lucide-react'

interface Props {
  photo: Photo
  onClose: () => void
}

export default function PhotoViewer({ photo, onClose }: Props) {
  const supabase = createClient()
  const [liked, setLiked] = useState(photo.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(photo.likes_count ?? 0)
  const [userId, setUserId] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Load likes status
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('photo_id', photo.id)
        .eq('user_id', user.id)
        .maybeSingle()
      setLiked(!!likeData)

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photo.id)
      setLikesCount(count ?? 0)
    }
    load()
  }, [photo.id, supabase])

  async function toggleLike() {
    if (!userId) return
    if (liked) {
      await supabase.from('likes').delete().eq('photo_id', photo.id).eq('user_id', userId)
      setLiked(false)
      setLikesCount((n) => Math.max(0, n - 1))
    } else {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: userId })
      setLiked(true)
      setLikesCount((n) => n + 1)
    }
  }

  // Функция для получения оптимизированного URL с параметрами Supabase Image Transformation
  function getOptimizedImageUrl(url: string, width: number = 1200, height: number = 1600): string {
    if (!url) return url
    
    // Проверяем, что это Supabase Storage URL
    if (url.includes('supabase.co/storage/v1/object')) {
      // Добавляем параметры трансформации
      const separator = url.includes('?') ? '&' : '?'
      
      // Оптимизации:
      // - width: ограничиваем ширину
      // - height: ограничиваем высоту
      // - quality: снижаем качество до 80%
      // - fit: cover - обрезаем лишнее
      // - format: webp - лучшая компрессия
      return `${url}${separator}width=${width}&height=${height}&quality=80&fit=cover&format=webp`
    }
    
    return url
  }

  // Fallback для очень медленных соединений
  const thumbnailUrl = getOptimizedImageUrl(photo.url, 400, 600)
  const fullUrl = getOptimizedImageUrl(photo.url, 1600, 2000)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] glass rounded-2xl overflow-hidden z-10 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading skeleton */}
        {isLoading && !imageError && (
          <div className="w-full h-auto min-h-[400px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="w-full h-auto min-h-[400px] flex flex-col items-center justify-center gap-3">
            <ImageOff className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load image</p>
          </div>
        )}

        {/* Photo with lazy loading and optimization */}
        <div className={`relative ${isLoading && !imageError ? 'hidden' : ''}`}>
          {/* Только после загрузки показываем картинку */}
          {!imageError && (
            <picture>
              {/* WebP для современных браузеров */}
              <source 
                srcSet={fullUrl} 
                type="image/webp"
              />
              {/* Fallback для старых браузеров */}
              <img
                src={thumbnailUrl}
                alt={photo.name}
                className="w-full h-auto max-h-[85vh] object-contain"
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  console.error('Failed to load image:', photo.url)
                  setImageError(true)
                  setIsLoading(false)
                }}
              />
            </picture>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Photo name overlay */}
          <div className="absolute bottom-3 left-3 right-16">
            <h3 className="text-white font-semibold text-lg drop-shadow-lg">{photo.name}</h3>
          </div>

          {/* Like button */}
          <button
            onClick={toggleLike}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
            <span className={`text-sm font-medium ${liked ? 'text-red-500' : 'text-white'}`}>
              {likesCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
