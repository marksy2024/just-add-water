'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full card p-3 flex items-center gap-3 text-left hover:bg-red-flag/5 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-5 h-5 text-red-flag" />
      <div>
        <p className="text-sm font-semibold text-red-flag">
          {loading ? 'Signing out...' : 'Sign Out'}
        </p>
        <p className="text-xs text-driftwood">See you on the water</p>
      </div>
    </button>
  )
}
