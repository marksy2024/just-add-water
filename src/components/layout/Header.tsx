'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { User, Plus } from 'lucide-react'
import { AlertBell } from '@/components/layout/AlertBell'

export function Header() {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname === '/') return null // Dashboard has its own greeting
    if (pathname === '/calendar') return 'Calendar'
    if (pathname.startsWith('/routes/new')) return 'Add Route'
    if (pathname.startsWith('/routes')) return 'Routes'
    if (pathname === '/conditions') return 'Conditions'
    if (pathname === '/group') return 'Group'
    if (pathname.startsWith('/paddles/new')) return 'Log a Paddle'
    if (pathname.startsWith('/paddles/plan')) return 'Plan a Paddle'
    if (pathname.startsWith('/paddles')) return 'Paddles'
    if (pathname === '/alerts') return 'Alerts'
    if (pathname === '/profile') return 'Profile'
    if (pathname === '/invite') return 'Invite'
    return ''
  }

  const title = getTitle()

  return (
    <header className="sticky top-0 z-40 bg-salt-white/80 backdrop-blur-lg border-b border-storm-grey/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {title ? (
          <h1 className="text-lg font-bold text-deep-ocean">{title}</h1>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-deep-ocean">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-md" />
            Just Add Water
          </Link>
        )}
        <div className="flex items-center gap-2">
          <Link
            href="/paddles/new"
            className="w-8 h-8 rounded-full bg-deep-ocean text-white flex items-center justify-center hover:bg-deep-ocean/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <AlertBell />
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-sea-foam text-deep-ocean flex items-center justify-center hover:bg-sea-foam/70 transition-colors"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
