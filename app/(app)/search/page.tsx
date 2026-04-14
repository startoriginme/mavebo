'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, BadgeCheck, Snowflake, Star, Monitor, Crown, Users } from 'lucide-react'
import type { Profile, Photo } from '@/lib/types'
import Link from 'next/link'
import PhotoViewer from '@/components/photo-viewer'

interface OfficialUser {
  username: string
  name: string
  icon: React.ElementType
  color: string
  badge: string
  role: string
  description: string
  category: 'official' | 'friends'
}

const OFFICIAL_USERS: OfficialUser[] = [
  // OFFICIAL category
  { 
    username: 'startorigin', 
    name: 'StartOrigin', 
    icon: BadgeCheck, 
    color: 'text-blue-500', 
    badge: 'verified',
    role: 'Official Account',
    description: 'Blog and updates about StartOrigin',
    category: 'official'
  },
  { 
    username: 'mavebo', 
    name: 'Mavebo', 
    icon: BadgeCheck, 
    color: 'text-yellow-500', 
    badge: 'verified',
    role: 'Founder & CEO',
    description: 'Founder of StartOrigin',
    category: 'official'
  },
  { 
    username: 'winterwastaken', 
    name: 'winterwastaken', 
    icon: Snowflake, 
    color: 'text-cyan-400', 
    badge: 'snowflake',
    role: 'Creative Director',
    description: 'Creative vision and design',
    category: 'official'
  },
  // StartOrigin's Friends category
  { 
    username: 'viscaelbarca', 
    name: 'Pavel Radzhabov', 
    icon: Star, 
    color: 'text-amber-400', 
    badge: 'star',
    role: 'Friend',
    description: 'StartOrigin Community Member',
    category: 'friends'
  },
  { 
    username: 'zaharques', 
    name: 'Zakhar', 
    icon: Monitor, 
    color: 'text-violet-500', 
    badge: 'computer',
    role: 'Friend',
    description: 'StartOrigin Community Member',
    category: 'friends'
  },
  { 
    username: 'camilakiriek', 
    name: 'Camila', 
    icon: Star, 
    color: 'text-amber-400', 
    badge: 'star',
    role: 'Friend',
    description: 'StartOrigin Community Member',
    category: 'friends'
  },
]

export default function SearchPage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'people' | 'photos'>('people')
  const [viewer, setViewer] = useState<Photo | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setUsers([])
      setPhotos([])
      return
    }
    const timeout = setTimeout(() => doSearch(query.trim()), 300)
    return () => clearTimeout(timeout)
  }, [query])

  async function doSearch(q: string) {
    setLoading(true)
    const [{ data: userResults }, { data: photoResults }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(20),
      supabase
        .from('photos')
        .select('*, profile:profiles(name, username, avatar_url), likes(count), comments(count)')
        .eq('privacy', 'public')
        .or(`name.ilike.%${q}%`)
        .limit(30),
    ])
    setUsers((userResults as Profile[]) ?? [])
    setPhotos(
      ((photoResults ?? []) as any[]).map((p) => ({
        ...p,
        likes_count: p.likes?.[0]?.count ?? 0,
        comments_count: p.comments?.[0]?.count ?? 0,
      })),
    )
    setLoading(false)
  }

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'verified':
        return <BadgeCheck className="h-4 w-4 text-blue-500" />
      case 'snowflake':
        return <Snowflake className="h-4 w-4 text-cyan-400" />
      case 'star':
        return <Star className="h-4 w-4 text-amber-400" />
      case 'computer':
        return <Monitor className="h-4 w-4 text-violet-500" />
      default:
        return null
    }
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'verified':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'snowflake':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      case 'star':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'computer':
        return 'bg-violet-500/10 text-violet-500 border-violet-500/20'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  const officialUsers = OFFICIAL_USERS.filter(u => u.category === 'official')
  const friendUsers = OFFICIAL_USERS.filter(u => u.category === 'friends')

  return (
    <main className="px-4 pt-6 pb-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Search</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people or photos..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Official Users Section - показываем когда нет поиска */}
      {!query && (
        <div className="mb-8 space-y-6">
          {/* OFFICIAL Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-yellow-500" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official</h2>
            </div>
            <div className="flex flex-col gap-2">
              {officialUsers.map((official) => (
                <Link
                  key={official.username}
                  href={`/profile/${official.username}`}
                  className="glass flex items-center gap-3 px-4 py-3 rounded-2xl hover:scale-[1.01] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{official.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{official.name}</p>
                      <official.icon className={`h-4 w-4 ${official.color}`} />
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {official.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">@{official.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">{official.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* StartOrigin's Friends Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">StartOrigin's Friends</h2>
            </div>
            <div className="flex flex-col gap-2">
              {friendUsers.map((official) => (
                <Link
                  key={official.username}
                  href={`/profile/${official.username}`}
                  className="glass flex items-center gap-3 px-4 py-3 rounded-2xl hover:scale-[1.01] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{official.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{official.name}</p>
                      <official.icon className={`h-4 w-4 ${official.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">@{official.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">{official.description}</p>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    getBadgeColor(official.badge)
                  )}>
                    {official.badge}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <>
          <div className="flex gap-2 mb-4">
            {(['people', 'photos'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
                  tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-muted-foreground text-center py-6">Searching...</p>}

          {!loading && tab === 'people' && (
            <div className="flex flex-col gap-2">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No users found.</p>
              ) : (
                users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="glass flex items-center gap-3 px-4 py-3 rounded-2xl hover:scale-[1.01] transition-all"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {u.name?.[0] ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                        {u.badges?.map((badge) => (
                          <span key={badge}>{getBadgeIcon(badge)}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {!loading && tab === 'photos' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.length === 0 ? (
                <p className="col-span-3 text-sm text-muted-foreground text-center py-6">No photos found.</p>
              ) : (
                photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setViewer(photo)}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State - только когда нет поиска */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center border-t border-border">
          <Search className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Search for people or public photos</p>
        </div>
      )}

      {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
    </main>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
