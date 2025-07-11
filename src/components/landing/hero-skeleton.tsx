export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-purple-900/50 animate-pulse" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge skeleton */}
          <div className="h-8 w-64 bg-purple-500/20 rounded-full animate-pulse mx-auto" />
          
          {/* Title skeleton */}
          <div className="h-24 bg-purple-500/20 rounded-lg animate-pulse" />
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