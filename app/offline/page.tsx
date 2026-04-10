'use client'

import Link from 'next/link'
import { WifiOff, Home, RefreshCw, Camera } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          You're offline
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Please check your internet connection and try again.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
