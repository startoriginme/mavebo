import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/feed/feed-client'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get following IDs
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user!.id)

  const followingIds = (follows ?? []).map((f: any) => f.following_id)

  async function fetchPhotos(userIds: string[]) {
    if (userIds.length === 0) return []
    const { data: photos } = await supabase
      .from('photos')
      .select(`*, profile:profiles(id, name, username, avatar_url, badges), likes(count)`)
      .in('user_id', userIds)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      // УБРАЛ .limit(60) — теперь загружает ВСЕ фото
    
    const photoIds = (photos ?? []).map((p: any) => p.id)
    let likedIds = new Set<string>()
    if (photoIds.length > 0) {
      const { data: userLikes } = await supabase
        .from('likes').select('photo_id').eq('user_id', user!.id).in('photo_id', photoIds)
      likedIds = new Set((userLikes ?? []).map((l: any) => l.photo_id))
    }
    return (photos ?? []).map((p: any) => ({
      ...p,
      likes_count: p.likes?.[0]?.count ?? 0,
      is_liked: likedIds.has(p.id),
    }))
  }

  // Following photos (own + people you follow)
  const followingPhotos = await fetchPhotos([user!.id, ...followingIds])

  // All public photos
  const { data: allPhotosRaw } = await supabase
    .from('photos')
    .select(`*, profile:profiles(id, name, username, avatar_url, badges), likes(count)`)
    .eq('privacy', 'public')
    .order('created_at', { ascending: false })
    // УБРАЛ .limit(100) — теперь загружает ВСЕ ФОТО (все 144+)

  const allPhotoIds = (allPhotosRaw ?? []).map((p: any) => p.id)
  let allLikedIds = new Set<string>()
  if (allPhotoIds.length > 0) {
    const { data: userLikes } = await supabase
      .from('likes').select('photo_id').eq('user_id', user!.id).in('photo_id', allPhotoIds)
    allLikedIds = new Set((userLikes ?? []).map((l: any) => l.photo_id))
  }
  const allPhotos = (allPhotosRaw ?? []).map((p: any) => ({
    ...p,
    likes_count: p.likes?.[0]?.count ?? 0,
    is_liked: allLikedIds.has(p.id),
  }))

  return (
    <FeedClient
      initialFollowingPhotos={followingPhotos}
      initialAllPhotos={allPhotos}
      userId={user!.id}
    />
  )
}
