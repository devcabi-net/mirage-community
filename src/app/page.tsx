import { Suspense } from 'react'
import { Metadata } from 'next'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { StatsSection } from '@/components/landing/stats-section'
import { HeroSkeleton } from '@/components/landing/hero-skeleton'
import { FeaturesSkeleton } from '@/components/landing/features-skeleton'

// Enhanced metadata for the homepage
export const metadata: Metadata = {
  title: 'The Mirage Community - Where Imagination Meets Reality',
  description: 'Join The Mirage Discord community for art, gaming, and creative collaboration. Connect with creators, share your work, and explore limitless possibilities.',
  keywords: ['discord community', 'art community', 'gaming', 'creative collaboration', 'the mirage'],
  openGraph: {
    title: 'The Mirage Community - Where Imagination Meets Reality',
    description: 'Join our vibrant Discord community for art, gaming, and creative collaboration',
    images: ['/og-home.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Mirage Community',
    description: 'Join our vibrant Discord community for art, gaming, and creative collaboration',
    images: ['/twitter-home.png'],
  },
  alternates: {
    canonical: '/',
  },
}

// Server function to fetch homepage data
async function getHomepageData() {
  try {
    // Parallel data fetching for better performance
    const [statsData, featuresData] = await Promise.all([
      getServerStats(),
      getFeaturesData(),
    ])

    return {
      stats: statsData,
      features: featuresData,
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    // Return fallback data
    return {
      stats: {
        memberCount: '1,000+',
        onlineMembers: '200+',
        channelsCount: '50+',
        dailyMessages: '1,500+',
      },
      features: getDefaultFeatures(),
    }
  }
}

// Server function to get server statistics
async function getServerStats() {
  // In production, this would fetch from your Discord bot API
  // For now, we'll return mock data that would be fetched from the server
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`, {
    next: { 
      revalidate: 300, // Cache for 5 minutes
      tags: ['server-stats']
    },
  }).catch(() => null)

  if (response?.ok) {
    return response.json()
  }

  // Fallback data
  return {
    memberCount: '1,200+',
    onlineMembers: '250+',
    channelsCount: '45+',
    dailyMessages: '2,000+',
  }
}

// Server function to get features data
async function getFeaturesData() {
  // This could fetch from a CMS or database
  return getDefaultFeatures()
}

// Static features data
function getDefaultFeatures() {
  return [
    {
      icon: 'Users',
      title: 'Community First',
      description: 'Join a vibrant community of creators, gamers, and friends',
      highlight: true,
    },
    {
      icon: 'Shield',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security',
      highlight: false,
    },
    {
      icon: 'MessageSquare',
      title: 'Stay Connected',
      description: 'Real-time chat, voice, and collaboration tools',
      highlight: false,
    },
    {
      icon: 'Sparkles',
      title: 'Exclusive Features',
      description: 'Access unique tools and content for members only',
      highlight: true,
    },
  ]
}

// Main page component (Server Component)
export default async function HomePage() {
  // Fetch data on the server
  const data = await getHomepageData()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'The Mirage Community',
            description: 'A Discord community for art, gaming, and creative collaboration',
            url: 'https://themirage.xxx',
            logo: 'https://themirage.xxx/logo.png',
            sameAs: [
              'https://discord.gg/themirage',
              'https://twitter.com/themiragecomm',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Community Support',
              url: 'https://themirage.xxx/discord',
            },
          }),
        }}
      />

      {/* Hero Section with Progressive Enhancement */}
      <section aria-label="Welcome to The Mirage">
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection stats={data.stats} />
        </Suspense>
      </section>

      {/* Features Section */}
      <section aria-label="Community Features" id="features">
        <Suspense fallback={<FeaturesSkeleton />}>
          <FeaturesSection features={data.features} />
        </Suspense>
      </section>

      {/* Statistics Section */}
      <section aria-label="Community Statistics" id="stats">
        <Suspense fallback={<div className="py-20 bg-muted/50" />}>
          <StatsSection stats={data.stats} />
        </Suspense>
      </section>

      {/* Call to Action Section */}
      <section 
        aria-label="Join Our Community" 
        className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 py-20"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Join The Mirage?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Become part of our growing community and start your creative journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://discord.gg/themirage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-700 font-semibold rounded-full hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-700"
              aria-label="Join our Discord server (opens in new tab)"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord Server
            </a>
            <a
              href="/auth/signin"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-700"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Login with Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 