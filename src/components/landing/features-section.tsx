'use client'

import { motion } from 'framer-motion'
import { Users, Shield, MessageCircle, Sparkles, Palette, Gamepad2, Heart, Star } from 'lucide-react'

interface Feature {
  icon: string
  title: string
  description: string
  highlight: boolean
}

interface FeaturesSectionProps {
  features: Feature[]
}

// Icon mapping for dynamic icon rendering
const IconMap = {
  Users,
  Shield,
  MessageCircle,
  Sparkles,
  Palette,
  Gamepad2,
  Heart,
  Star,
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="relative py-20 bg-gradient-to-b from-black via-purple-900/10 to-black">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
            Why Choose The Mirage?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of community interaction with our cutting-edge platform built for creators, artists, and passionate community members.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = IconMap[feature.icon as keyof typeof IconMap] || Users
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className={`
                  relative group p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300
                  ${feature.highlight 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/40 hover:border-purple-500/60' 
                    : 'bg-black/30 border-purple-500/20 hover:border-purple-500/40'
                  }
                `}
              >
                {/* Highlight badge */}
                {feature.highlight && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300
                  ${feature.highlight 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110' 
                    : 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
                  }
                `}>
                  <IconComponent className={`w-6 h-6 ${feature.highlight ? 'text-white' : 'text-purple-400'}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            )
          })}
        </div>

        {/* Additional Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Art Gallery</h4>
              <p className="text-gray-400 text-sm">
                Showcase your artwork in our curated gallery with AI-powered categorization and community voting.
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Gaming Hub</h4>
              <p className="text-gray-400 text-sm">
                Connect with fellow gamers, organize tournaments, and share your gaming achievements.
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Community Care</h4>
              <p className="text-gray-400 text-sm">
                Mental health support, inclusive environment, and a caring community that supports each other.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Loading skeleton component
export function FeaturesSkeleton() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-black via-purple-900/10 to-black">
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center mb-16">
          <div className="h-12 bg-purple-500/20 rounded-lg animate-pulse mb-6 max-w-md mx-auto" />
          <div className="h-6 bg-purple-500/10 rounded-lg animate-pulse max-w-2xl mx-auto" />
        </div>

        {/* Features grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 animate-pulse">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg mb-4" />
              <div className="h-6 bg-purple-500/20 rounded mb-2" />
              <div className="h-16 bg-purple-500/10 rounded" />
            </div>
          ))}
        </div>

        {/* Additional features skeleton */}
        <div className="mt-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 animate-pulse">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full mx-auto mb-4" />
                <div className="h-5 bg-purple-500/20 rounded mb-2" />
                <div className="h-12 bg-purple-500/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 