import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/layout/header'
// Note: Analytics will be added after package installation
// import { Analytics } from '@vercel/analytics/react'
// import { SpeedInsights } from '@vercel/speed-insights/next'

// Utility function for conditional classes (inline implementation)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// Optimized font loading with variable fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// Enhanced viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'dark light',
}

// Enhanced metadata with structured data and performance optimizations
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://themirage.xxx'),
  title: {
    default: 'The Mirage Community',
    template: '%s | The Mirage Community',
  },
  description: 'Join The Mirage - A vibrant Discord community for art, gaming, and creative collaboration. Connect with artists, share your work, and explore limitless creativity.',
  keywords: [
    'discord community',
    'art community', 
    'gaming community',
    'digital art',
    'creative collaboration',
    'the mirage',
    'discord server',
    'artist collective',
    'online community',
    'creative platform'
  ],
  authors: [{ name: 'The Mirage Team', url: 'https://themirage.xxx' }],
  creator: 'The Mirage Community',
  publisher: 'The Mirage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://themirage.xxx',
    title: 'The Mirage Community - Art, Gaming & Creative Collaboration',
    description: 'Join our vibrant Discord community where artists, gamers, and creators connect, collaborate, and inspire each other.',
    siteName: 'The Mirage',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Mirage Community - Join our Discord server',
        type: 'image/png',
      },
      {
        url: '/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'The Mirage Community Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mirage Community',
    description: 'Join our vibrant Discord community for art, gaming, and creative collaboration',
    images: ['/twitter-image.png'],
    creator: '@themiragecomm',
    site: '@themiragecomm',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  alternates: {
    canonical: 'https://themirage.xxx',
    languages: {
      'en-US': 'https://themirage.xxx',
    },
  },
  category: 'technology',
  classification: 'Community Platform',
  other: {
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={cn(
        inter.variable,
        jetbrainsMono.variable,
        'scroll-smooth'
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.discordapp.com" />
        <link rel="dns-prefetch" href="https://api.themirage.xxx" />
        
        {/* Critical CSS inlining hint */}
        <link rel="preload" href="/globals.css" as="style" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        'selection:bg-primary/20 selection:text-primary-foreground'
      )}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {/* Skip to main content for accessibility */}
            <a 
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Skip to main content
            </a>
            
            <Header />
            
            <main id="main-content" className="flex-1" role="main">
              {children}
            </main>
            
            <footer className="border-t py-6 md:py-0" role="contentinfo">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built with ❤️ by The Mirage Community. Open source on{' '}
                    <a
                      href="https://github.com/themirage/community"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-4 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                      aria-label="View source code on GitHub (opens in new tab)"
                    >
                      GitHub
                    </a>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <a 
                    href="/privacy" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                  >
                    Privacy
                  </a>
                  <a 
                    href="/terms" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                  >
                    Terms
                  </a>
                  <a 
                    href="/discord" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </a>
                </div>
              </div>
            </footer>
          </div>
          
          {/* Enhanced toast notifications with better accessibility */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'toast-message',
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 10px 38px -10px rgba(0, 0, 0, 0.35), 0 10px 20px -15px rgba(0, 0, 0, 0.2)',
              },
              duration: 4000,
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'hsl(var(--primary-foreground))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'hsl(var(--destructive-foreground))',
                },
              },
            }}
            containerStyle={{
              zIndex: 9999,
            }}
          />
        </Providers>
        
        {/* Performance monitoring will be added after package installation */}
        {/* <Analytics /> */}
        {/* <SpeedInsights /> */}
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'The Mirage Community',
              alternateName: 'The Mirage',
              url: 'https://themirage.xxx',
              description: 'A vibrant Discord community for art, gaming, and creative collaboration',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://themirage.xxx/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
              sameAs: [
                'https://discord.gg/themirage',
                'https://twitter.com/themiragecomm',
                'https://github.com/themirage/community',
              ],
            }),
          }}
        />
      </body>
    </html>
  )
} 