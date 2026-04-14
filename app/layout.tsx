import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ProgressBar } from '@/components/progress-bar'
import PWAInstall from '@/components/pwa-install'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'StartOrigin — No algorithms, pure photography',
    template: '%s | StartOrigin'
  },
  description: 'No Algorithms, Pure Photography',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/startoriginreal.png',
    shortcut: '/startoriginreal.png',
    apple: '/startoriginreal.png',
  },
  openGraph: {
    title: 'StartOrigin — No algorithms, pure photography',
    description: 'No Algorithms, Pure Photography',
    url: 'https://startorigin.me',
    siteName: 'StartOrigin',
    images: [
      {
        url: '/startoriginreal.png',
        width: 512,
        height: 512,
        alt: 'StartOrigin Logo',
      },
    ],
    locale: 'en_EN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StartOrigin — No algorithms, pure photography',
    description: 'No Algorithms, Pure Photography',
    images: ['/startoriginreal.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://startorigin.me',
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
        
        {/* SEO мета-теги */}
        <meta name="keywords" content="photography, social media, photographers, privacy, no algorithms, pure photography, achievments, tinder mode" />
        <meta name="author" content="StartOrigin" />
        <meta name="copyright" content="StartOrigin" />
        
        {/* Структурированные данные для сайта */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "StartOrigin",
              "alternateName": "StartOrigin.me",
              "url": "https://startorigin.me",
              "description": "No algorithms, pure photography",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://startorigin.me/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
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
