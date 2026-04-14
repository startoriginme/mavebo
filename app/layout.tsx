import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ProgressBar } from '@/components/progress-bar'
import PWAInstall from '@/components/pwa-install'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'StartOrigin',
  description: 'Your personal photo album and social platform',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/startoriginreal.png',
    shortcut: '/startoriginreal.png',
    apple: '/startoriginreal.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/startoriginreal.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="StartOrigin" />
      </head>
      <body className="font-sans antialiased">
        <ProgressBar />
        {children}
        <PWAInstall />
        <Analytics />
      </body>
    </html>
  )
}
