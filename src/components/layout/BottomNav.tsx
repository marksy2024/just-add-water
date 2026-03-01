'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Map, Users, Compass } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/routes', icon: Map, label: 'Routes' },
  { href: '/conditions', icon: Compass, label: 'Conditions' },
  { href: '/group', icon: Users, label: 'Group' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-salt-white border-t border-storm-grey/10 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-deep-ocean'
                  : 'text-driftwood hover:text-storm-grey'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
