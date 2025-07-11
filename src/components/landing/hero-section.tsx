'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, MessageCircle, Sparkles } from 'lucide-react'
import { Suspense, lazy } from 'react'

// Lazy load the 3D scene for better performance
const Scene = lazy(() => import('@/components/three/Scene').then(module => ({ default: module.Scene })))

interface HeroSectionProps {
  stats: {
    memberCount: string
    onlineMembers: string
    channelsCount: string
    dailyMessages: string
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-black to-purple-900">
      {/* 3D Background Scene */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-purple-900/50 animate-pulse" />
        }>
          <Scene />
        </Suspense>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Main Content */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge 
              variant="outline" 
              className="bg-purple-500/20 border-purple-500/50 text-purple-200 px-4 py-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Where Imagination Meets Reality
            </Badge>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
              The Mirage
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join our vibrant community of creators, artists, and dreamers. 
              Discover limitless possibilities in our Discord server.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.memberCount}</div>
              <div className="text-sm text-gray-400">Members</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.onlineMembers}</div>
              <div className="text-sm text-gray-400">Online</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.channelsCount}</div>
              <div className="text-sm text-gray-400">Channels</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.dailyMessages}</div>
              <div className="text-sm text-gray-400">Daily Messages</div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-purple-500/25 transition-all hover:scale-105 group"
              asChild
            >
              <a
                href="https://discord.gg/themirage"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Join Our Discord
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all hover:scale-105"
              asChild
            >
              <a href="/auth/signin" className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Login with Discord
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-purple-400 cursor-pointer"
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Loading skeleton component
export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-purple-900/50 animate-pulse" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Title skeleton */}
          <div className="h-20 bg-purple-500/20 rounded-lg animate-pulse" />
          <div className="h-12 bg-purple-500/10 rounded-lg animate-pulse mx-auto max-w-2xl" />
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20 animate-pulse">
                <div className="h-6 bg-purple-500/20 rounded mb-2" />
                <div className="h-8 bg-purple-500/20 rounded mb-2" />
                <div className="h-4 bg-purple-500/20 rounded" />
              </div>
            ))}
          </div>

          {/* Buttons skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <div className="h-16 w-48 bg-purple-500/20 rounded-full animate-pulse" />
            <div className="h-16 w-48 bg-purple-500/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
} 