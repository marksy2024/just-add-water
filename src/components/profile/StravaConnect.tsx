'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2 } from 'lucide-react'

interface StravaConnectProps {
  isConnected: boolean
  authUrl: string
}

export function StravaConnect({ isConnected, authUrl }: StravaConnectProps) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/strava/disconnect', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setDisconnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#FC4C02]" />
          <span className="text-sm font-semibold text-[#FC4C02]">Strava connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-driftwood bg-storm-grey/10 hover:bg-storm-grey/20 transition-colors disabled:opacity-50"
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-driftwood" />
        <span className="text-sm text-driftwood">Strava</span>
      </div>
      <a
        href={authUrl}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FC4C02] hover:bg-[#e04400] transition-colors"
      >
        Connect Strava
      </a>
    </div>
  )
}
