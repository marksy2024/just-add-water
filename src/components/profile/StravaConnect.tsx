'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, RefreshCw } from 'lucide-react'

interface StravaConnectProps {
  isConnected: boolean
  authUrl: string
}

export function StravaConnect({ isConnected, authUrl }: StravaConnectProps) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

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

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.imported > 0) {
          setSyncResult(`Imported ${data.imported} paddle${data.imported !== 1 ? 's' : ''}`)
          router.refresh()
        } else {
          setSyncResult('All up to date')
        }
      } else {
        setSyncResult('Sync failed')
      }
    } catch {
      setSyncResult('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#FC4C02]" />
            <span className="text-sm font-semibold text-[#FC4C02]">Strava connected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FC4C02] bg-[#FC4C02]/10 hover:bg-[#FC4C02]/20 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-driftwood bg-storm-grey/10 hover:bg-storm-grey/20 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
        {syncResult && (
          <p className="text-xs text-driftwood text-right">{syncResult}</p>
        )}
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
