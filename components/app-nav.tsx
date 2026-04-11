'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, Images, User, Camera, Users, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import AddModal from '@/components/add-modal'

// Desktop sidebar items
const desktopNavItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function AppNav() {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)

  const isDocsActive = pathname.startsWith('/docs')
  const isAboutActive = pathname === '/about'

  // Mobile nav items
  const mobileNavItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/gallery', label: 'Gallery', icon: Images },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 z-40 bg-white border-r border-gray-200">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-gray-900">
            <Link href="/about" className="hover:text-gray-600 transition-colors">
              StartOrigin
            </Link>
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4" aria-label="Main navigation">
          <div className="flex-1">
            <Link
              href="/feed"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/feed')
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/feed') ? 'page' : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              Feed
            </Link>

            <Link
              href="/search"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/search')
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/search') ? 'page' : undefined}
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              Search
            </Link>

            {/* Add button */}
            <div className="my-1">
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full group"
              >
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Plus className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors">Add</span>
              </button>
            </div>

            <Link
              href="/gallery"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/gallery')
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/gallery') ? 'page' : undefined}
            >
              <Images className="w-5 h-5 flex-shrink-0" />
              Gallery
            </Link>

            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/profile')
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              Profile
            </Link>
          </div>

          {/* Docs link */}
          <div className="mb-2">
            <Link
              href="/docs"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                isDocsActive
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={isDocsActive ? 'page' : undefined}
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              Documentation
            </Link>
          </div>

          {/* About link */}
          <div className="mb-2">
            <Link
              href="/about"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                isAboutActive
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={isAboutActive ? 'page' : undefined}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              About
            </Link>
          </div>

          {/* Settings at the bottom */}
          <div className="mt-auto pt-2 border-t border-gray-200">
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/settings')
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              Settings
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile Bottom Nav — без пузырька */}
      <nav
        className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white rounded-2xl border border-gray-200 shadow-lg"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {/* Feed */}
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            
            return (
              <div key={item.href} className="flex-1 flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2 transition-all rounded-full',
                    isActive ? 'text-black' : 'text-gray-500',
                    'hover:text-black'
                  )}
                  style={{ width: 48 }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
                </Link>
              </div>
            )
          })}
          
          {/* Add button */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              aria-label="Add content"
            >
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
