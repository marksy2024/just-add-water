export function RippleLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="ripple-loader" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="ripple-loader mx-auto mb-4" />
        <p className="text-sm text-driftwood">Loading...</p>
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-storm-grey/10 rounded-xl ${className}`} />
  )
}
