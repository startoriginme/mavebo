// Load more photos when reaching the end
const loadMorePhotos = useCallback(async () => {
  if (loadingMore) return
  
  const currentPage = showAll ? page.all : page.following
  const hasMore = showAll ? hasMoreAll : hasMoreFollowing
  
  if (!hasMore) return
  
  setLoadingMore(true)
  
  try {
    const nextPage = currentPage + 1
    const limit = 20
    const offset = nextPage * limit
    
    let newPhotos: Photo[] = []
    
    // Получаем лайки пользователя
    const { data: likes } = await supabase
      .from('likes')
      .select('photo_id')
      .eq('user_id', userId)
    
    const likedPhotoIds = new Set(likes?.map(l => l.photo_id) || [])
    
    if (showAll) {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          profile:profiles(id, name, username, avatar_url)
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (!error && data) {
        // Получаем ID всех новых фото
        const newPhotoIds = data.map(p => p.id)
        
        // Получаем реальное количество лайков для каждого фото
        const { data: likesCounts } = await supabase
          .from('likes')
          .select('photo_id', { count: 'exact', head: false })
          .in('photo_id', newPhotoIds)
        
        // Считаем количество лайков для каждого фото
        const likesCountMap = new Map()
        if (likesCounts) {
          likesCounts.forEach(like => {
            likesCountMap.set(like.photo_id, (likesCountMap.get(like.photo_id) || 0) + 1)
          })
        }
        
        newPhotos = data.map(photo => ({
          ...photo,
          is_liked: likedPhotoIds.has(photo.id),
          likes_count: likesCountMap.get(photo.id) || 0
        }))
        
        // Фильтруем дубликаты
        const existingIds = new Set(allPhotos.map(p => p.id))
        const uniqueNewPhotos = newPhotos.filter(photo => !existingIds.has(photo.id))
        
        setAllPhotos(prev => [...prev, ...uniqueNewPhotos])
        setPage(prev => ({ ...prev, all: nextPage }))
        setHasMoreAll(data.length === limit)
      }
    } else if (followingPhotos.length > 0) {
      const followedUserIds = [...new Set(followingPhotos.map(p => p.profile?.id).filter(Boolean))]
      
      if (followedUserIds.length > 0) {
        const { data, error } = await supabase
          .from('photos')
          .select(`
            *,
            profile:profiles(id, name, username, avatar_url)
          `)
          .eq('privacy', 'public')
          .in('user_id', followedUserIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (!error && data) {
          // Получаем ID всех новых фото
          const newPhotoIds = data.map(p => p.id)
          
          // Получаем реальное количество лайков для каждого фото
          const { data: likesCounts } = await supabase
            .from('likes')
            .select('photo_id', { count: 'exact', head: false })
            .in('photo_id', newPhotoIds)
          
          // Считаем количество лайков для каждого фото
          const likesCountMap = new Map()
          if (likesCounts) {
            likesCounts.forEach(like => {
              likesCountMap.set(like.photo_id, (likesCountMap.get(like.photo_id) || 0) + 1)
            })
          }
          
          newPhotos = data.map(photo => ({
            ...photo,
            is_liked: likedPhotoIds.has(photo.id),
            likes_count: likesCountMap.get(photo.id) || 0
          }))
          
          // Фильтруем дубликаты
          const existingIds = new Set(followingPhotos.map(p => p.id))
          const uniqueNewPhotos = newPhotos.filter(photo => !existingIds.has(photo.id))
          
          setFollowingPhotos(prev => [...prev, ...uniqueNewPhotos])
          setPage(prev => ({ ...prev, following: nextPage }))
          setHasMoreFollowing(data.length === limit)
        }
      }
    }
  } catch (error) {
    console.error('Error loading more photos:', error)
  } finally {
    setLoadingMore(false)
  }
}, [showAll, page, hasMoreAll, hasMoreFollowing, loadingMore, supabase, userId, followingPhotos, allPhotos])
