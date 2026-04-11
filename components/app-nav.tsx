'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, Images, User, Camera, Users, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import AddModal from '@/components/add-modal'

// Desktop sidebar items в новом порядке
const desktopNavItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function AppNav() {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0 })
  const navRefs = useRef<(HTMLDivElement | null)[]>([])

  const isDocsActive = pathname.startsWith('/docs')
  const isAboutActive = pathname === '/about'

  // Mobile nav items
  const mobileNavItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/gallery', label: 'Gallery', icon: Images },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  // Find active index for mobile nav
  useEffect(() => {
    const activeItemIndex = mobileNavItems.findIndex(item => pathname.startsWith(item.href))
    if (activeItemIndex !== -1 && activeItemIndex !== activeIndex) {
      setActiveIndex(activeItemIndex)
    }
  }, [pathname, mobileNavItems, activeIndex])

  // Update bubble position for mobile
  useEffect(() => {
    const activeElement = navRefs.current[activeIndex]
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect()
      const containerRect = activeElement.parentElement?.parentElement?.getBoundingClientRect()
      if (containerRect) {
        setBubbleStyle({
          left: rect.left - containerRect.left,
          width: rect.width,
        })
      }
    }
  }, [activeIndex])

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
          {/* Desktop navigation items */}
          <div className="flex-1">
            {/* Feed */}
            <Link
              href="/feed"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/feed')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/feed') ? 'page' : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              Feed
            </Link>

            {/* Search */}
            <Link
              href="/search"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/search')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/search') ? 'page' : undefined}
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              Search
            </Link>

            {/* Add button - между Search и Gallery */}
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

            {/* Gallery */}
            <Link
              href="/gallery"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/gallery')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
              aria-current={pathname.startsWith('/gallery') ? 'page' : undefined}
            >
              <Images className="w-5 h-5 flex-shrink-0" />
              Gallery
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/profile')
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
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

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white rounded-2xl border border-gray-200 shadow-lg"
        aria-label="Main navigation"
      >
        <div className="relative flex items-center justify-around px-2 py-2">
          {/* Прозрачный пузырек */}
          <div
            className="absolute rounded-full bg-gray-100 transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: bubbleStyle.left,
              width: bubbleStyle.width,
              height: 48,
              top: 4,
            }}
          />
          
          {/* Feed */}
          <div
            ref={el => { navRefs.current[0] = el }}
            className="flex-1 flex justify-center"
          >
            <Link
              href="/feed"
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-all rounded-full',
                pathname.startsWith('/feed') ? 'text-black' : 'text-gray-500',
                'hover:text-black'
              )}
              style={{ width: 48 }}
              aria-current={pathname.startsWith('/feed') ? 'page' : undefined}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-full">Feed</span>
            </Link>
          </div>

          {/* Search */}
          <div
            ref={el => { navRefs.current[1] = el }}
            className="flex-1 flex justify-center"
          >
            <Link
              href="/search"
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-all rounded-full',
                pathname.startsWith('/search') ? 'text-black' : 'text-gray-500',
                'hover:text-black'
              )}
              style={{ width: 48 }}
              aria-current={pathname.startsWith('/search') ? 'page' : undefined}
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-full">Search</span>
            </Link>
          </div>

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

          {/* Gallery */}
          <div
            ref={el => { navRefs.current[2] = el }}
            className="flex-1 flex justify-center"
          >
            <Link
              href="/gallery"
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-all rounded-full',
                pathname.startsWith('/gallery') ? 'text-black' : 'text-gray-500',
                'hover:text-black'
              )}
              style={{ width: 48 }}
              aria-current={pathname.startsWith('/gallery') ? 'page' : undefined}
            >
              <Images className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-full">Gallery</span>
            </Link>
          </div>

          {/* Profile */}
          <div
            ref={el => { navRefs.current[3] = el }}
            className="flex-1 flex justify-center"
          >
            <Link
              href="/profile"
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-all rounded-full',
                pathname.startsWith('/profile') ? 'text-black' : 'text-gray-500',
                'hover:text-black'
              )}
              style={{ width: 48 }}
              aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-full">Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
