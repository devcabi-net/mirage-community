'use client'

import { motion } from 'framer-motion'
import { Users, Activity, MessageCircle, Calendar, TrendingUp, Award, Clock, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Stats {
  memberCount: string
  onlineMembers: string
  channelsCount: string
  dailyMessages: string
}

interface StatsSectionProps {
  stats: Stats
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let requestId: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        requestId = requestAnimationFrame(animate)
      }
    }
    
    requestId = requestAnimationFrame(animate)
    
    return () => cancelAnimationFrame(requestId)
  }, [end, duration])
  
  return count
}

// Extract numeric value from string (e.g., "1,200+" -> 1200)
function extractNumber(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0
}

export function StatsSection({ stats }: StatsSectionProps) {
  const memberCount = useAnimatedCounter(extractNumber(stats.memberCount))
  const onlineMembers = useAnimatedCounter(extractNumber(stats.onlineMembers))
  const channelsCount = useAnimatedCounter(extractNumber(stats.channelsCount))
  const dailyMessages = useAnimatedCounter(extractNumber(stats.dailyMessages))

  return (
    <section className="relative py-20 bg-gradient-to-b from-purple-900/10 via-black to-purple-900/10">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
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
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-6">
            Community at a Glance
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of creators, artists, and community members who call The Mirage home.
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {memberCount.toLocaleString()}+
            </div>
            <div className="text-sm text-gray-400">Total Members</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2" />
                <Activity className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors" />
              </div>
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {onlineMembers.toLocaleString()}+
            </div>
            <div className="text-sm text-gray-400">Online Now</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {channelsCount.toLocaleString()}+
            </div>
            <div className="text-sm text-gray-400">Active Channels</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-8 h-8 text-orange-400 group-hover:text-orange-300 transition-colors" />
              <Award className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {dailyMessages.toLocaleString()}+
            </div>
            <div className="text-sm text-gray-400">Daily Messages</div>
          </motion.div>
        </div>

        {/* Additional Community Insights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Global Community</h4>
              <p className="text-gray-400">
                Members from over 50 countries across all timezones, creating a truly global creative hub.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Quality Content</h4>
              <p className="text-gray-400">
                Curated artwork, engaging discussions, and meaningful connections that inspire creativity.
              </p>
            </div>

            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Growing Fast</h4>
              <p className="text-gray-400">
                Our community grows by 15% monthly, with new members joining every day to share their passion.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-xl text-gray-300 mb-6">
            Ready to become part of these amazing numbers?
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="https://discord.gg/themirage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full shadow-2xl shadow-purple-500/25 transition-all duration-300 group"
            >
              Join {memberCount.toLocaleString()}+ Members
              <Users className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 