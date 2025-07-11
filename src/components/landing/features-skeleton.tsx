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