'use client'

export function WaveDivider({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''} ${className}`}>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-6 md:h-8"
        fill="currentColor"
      >
        <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" />
      </svg>
    </div>
  )
}

export function WaveDividerSubtle({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden py-4 ${className}`}>
      <svg viewBox="0 0 1200 20" preserveAspectRatio="none" className="w-full h-3 text-sea-foam/50">
        <path
          d="M0,10 C150,18 300,2 450,10 C600,18 750,2 900,10 C1050,18 1200,2 1200,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}
