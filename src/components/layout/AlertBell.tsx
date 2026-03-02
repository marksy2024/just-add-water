'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export function AlertBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications/count')
        if (res.ok) {
          const data = await res.json()
          if (active) setCount(data.count ?? 0)
        }
      } catch {
        // silently ignore
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <Link
      href="/alerts"
      className="relative w-8 h-8 rounded-full bg-sea-foam text-deep-ocean flex items-center justify-center hover:bg-sea-foam/70 transition-colors"
    >
      <Bell className={`w-4 h-4 ${count > 0 ? 'text-deep-ocean' : 'text-storm-grey'}`} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-sunset-coral text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
