'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Camera, ArrowRight, Heart, Menu, X, Users, BookOpen, Flame, Palette, Star, ShoppingBag, Image, Trophy, Download, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [currentYear, setCurrentYear] = useState(2026)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  const features = [
    {
      icon: Camera,
      title: "Publish photos",
      description: "Share your moments with meaningful titles",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Follow people",
      description: "Build your personal feed",
      color: "text-primary"
    },
    {
      icon: Heart,
      title: "Stay inspired",
      description: "No algorithms, just pure photography",
      color: "text-primary"
    },
    {
      icon: Flame,
      title: "Tinder Mode",
      description: "Swipe through photos like never before",
      color: "text-orange-500",
      highlight: true
    },
    {
      icon: Palette,
      title: "Decorations",
      description: "Customize your profile with themes & patterns",
      color: "text-purple-500",
      highlight: true
    },
    {
      icon: Star,
      title: "Badges",
      description: "Collect unique badges and show off",
      color: "text-amber-400",
      highlight: true
    },
    {
      icon: ShoppingBag,
      title: "Shop",
      description: "Spend Origins on exclusive items",
      color: "text-green-500",
      highlight: true
    },
    {
      icon: Image,
      title: "Gallery",
      description: "Showcase your best photos in style",
      color: "text-blue-500",
      highlight: true
    },
    {
      icon: Trophy,
      title: "Achievements",
      description: "Unlock rewards for your activity",
      color: "text-yellow-500",
      highlight: true
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
            <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
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
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
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
        <section className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Camera className="w-4 h-4" />
              <span>StartOrigin v1.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
              Hey, it's{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                StartOrigin
              </span>
              .
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discovering new possibilities of photographing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/choose"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent transition-all"
              >
                <Download className="w-4 h-4" />
                Download App
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-2">What you can do</h2>
              <p className="text-muted-foreground">Powerful features for every photographer</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl ${feature.highlight ? 'border border-primary/20' : ''}`}
                >
                  <feature.icon className={`w-10 h-10 ${feature.color} mx-auto mb-3`} />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  {feature.highlight && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>New</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tinder Mode Highlight */}
        <section className="py-16 px-4 bg-gradient-to-r from-orange-500/5 to-pink-500/5">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-500 text-sm font-medium mb-6">
              <Flame className="w-4 h-4" />
              <span>Coming Soon</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tinder Mode 🔥
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Swipe through photos like never before. Like or pass — it's that simple. 
              Unlock achievements with every swipe!
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-500" />
                <span className="text-sm text-foreground">Like</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                <span className="text-sm text-foreground">Pass</span>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Ready to start?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join the community of photographers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/choose"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent transition-all"
              >
                <Download className="w-4 h-4" />
                Download PWA
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
              <Link href="/download" className="text-xs text-muted-foreground hover:text-foreground">
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
