/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error handling
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Configure image optimization
  images: {
    domains: [
      'cdn.discordapp.com', // Discord avatars
      'themirage.xxx',      // Our domain
      'localhost',          // Local development
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/discord',
        destination: 'https://discord.gg/yourinvitecode', // Replace with actual invite
        permanent: false,
      },
    ]
  },
  
  // Configure rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://themirage.xxx',
    NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for fs module in client-side
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Add rule for handling SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    
    return config
  },
  
  // Experimental features
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    // Do not block production builds on TypeScript errors
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Do not run ESLint during production builds
    ignoreDuringBuilds: false,
  },
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig 