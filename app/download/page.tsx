// app/download/page.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Camera, ArrowRight, Heart, Download, Smartphone, Sparkles, Check, X, Menu } from 'lucide-react'

export default function DownloadPage() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
    
    // Проверяем, установлено ли уже PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true)
    }

    // Слушаем событие beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsPWAInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (!window.matchMedia('(display-mode: standalone)').matches) {
      alert('To install the app, click the share button in your browser and select "Add to Home Screen"')
    }
  }

  const steps = [
    {
      icon: Smartphone,
      title: "Open in Browser",
      description: "Open startorigin.me in Safari or Chrome"
    },
    {
      icon: Download,
      title: "Share Menu",
      description: "Tap the share button (iOS) or menu (Android)"
    },
    {
      icon: Sparkles,
      title: "Add to Home Screen",
      description: 'Select "Add to Home Screen" or "Install App"'
    },
    {
      icon: Check,
      title: "Enjoy!",
      description: "StartOrigin will appear on your home screen"
    }
  ]

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">StartOrigin</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/download" className="text-sm text-primary transition-colors flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              Download
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link
              href="/auth/choose"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 nav-glass border-b border-border">
            <div className="flex flex-col p-4 gap-3">
              <Link
                href="/download"
                className="px-4 py-2 text-primary transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Download className="w-4 h-4" />
                Download
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/docs"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link
                href="/auth/choose"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-center font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Download className="w-4 h-4" />
              <span>Available on all devices</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
              Get{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                StartOrigin
              </span>
              .
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Install our PWA and take your photography experience everywhere you go.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isPWAInstalled && deferredPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              ) : (
                <button
                  onClick={handleInstallPWA}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {isPWAInstalled ? 'Already Installed' : 'Install App'}
                </button>
              )}
              <Link
                href="/auth/choose"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent transition-all"
              >
                Get Started Online
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How to Install Section */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-2">How to Install</h2>
              <p className="text-muted-foreground">Just a few taps and you're ready to go</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">0{index + 1}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Works everywhere</h2>
            <p className="text-lg text-muted-foreground mb-8">
              StartOrigin PWA works on iOS, Android, and Desktop browsers
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl">🍎</span>
                </div>
                <p className="text-sm font-medium text-foreground">iOS</p>
                <p className="text-xs text-muted-foreground">Safari</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-sm font-medium text-foreground">Android</p>
                <p className="text-xs text-muted-foreground">Chrome</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl">💻</span>
                </div>
                <p className="text-sm font-medium text-foreground">Desktop</p>
                <p className="text-xs text-muted-foreground">Chrome, Edge</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-2">Why install the app?</h2>
              <p className="text-muted-foreground">Better experience, right on your home screen</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <div className="w-2 h-5 bg-green-500 rounded-full" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Faster access</h3>
                <p className="text-sm text-muted-foreground">Launch from your home screen in one tap</p>
              </div>
        
              
              <div className="glass rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full" />
                  <div className="w-6 h-0.5 bg-purple-500 mt-1" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">App-like experience</h3>
                <p className="text-sm text-muted-foreground">Full-screen mode with no browser bars</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Ready to install?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get StartOrigin on your device now
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isPWAInstalled && deferredPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              ) : (
                <button
                  onClick={handleInstallPWA}
                  disabled={isPWAInstalled}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isPWAInstalled ? 'Already Installed' : 'Install App'}
                </button>
              )}
              <Link
                href="/auth/choose"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent transition-all"
              >
                Continue to Web App
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">StartOrigin</span>
            </div>
            <div className="flex items-center justify-center gap-6 mb-4">
              <Link href="/download" className="text-xs text-primary hover:underline">
                Download
              </Link>
              <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground">
                Docs
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {currentYear} StartOrigin — Made with <Heart className="w-3 h-3 inline text-red-500 fill-red-500" /> for photographers
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
