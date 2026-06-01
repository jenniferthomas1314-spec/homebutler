// src/components/layout/AppShell.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown } from 'lucide-react'
import { BUTLER_AVATARS } from '@/lib/butler'
import type { ButlerTrait } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',       label: '🏠 Home'       },
  { href: '/dashboard/tasks', label: '✓ Tasks'       },
  { href: '/dashboard/appliances', label: '⚙️ Apps'  },
  { href: '/dashboard/contractors', label: '📇 Contacts' },
  { href: '/dashboard/seasonal', label: '🌸 Seasonal' },
  { href: '/dashboard/costs', label: '💰 Costs'      },
  { href: '/dashboard/vault', label: '🗄️ Vault'      },
  { href: '/dashboard/timeline', label: '📅 Timeline' },
  { href: '/dashboard/sale',  label: '🔑 Sale'       },
  { href: '/dashboard/fixit', label: '🔧 Fix It'     },
  { href: '/dashboard/ai',    label: '✨ AI'          },
  { href: '/dashboard/household', label: '👥 Household' },
  { href: '/dashboard/properties', label: '🏘️ Props' },
  { href: '/dashboard/settings', label: '⚙ Settings' },
]

interface Props {
  profile: {
    butler_name: string
    butler_trait: string
    plan: string
  }
  children: React.ReactNode
}

export default function AppShell({ profile, children }: Props) {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)
  const butlerAvatar = BUTLER_AVATARS[profile.butler_trait as ButlerTrait] ?? '🎩'

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-base">
            {butlerAvatar}
          </div>
          <div>
            <div className="font-serif text-[17px] font-medium leading-tight">HomeButler</div>
            <div className="text-[9px] text-muted uppercase tracking-widest">Your home</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nav pills */}
          <nav className="flex gap-0.5 flex-wrap">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-dark text-white'
                      : 'text-muted hover:bg-border hover:text-dark'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded-lg border border-border bg-white hover:bg-bg transition-colors"
          >
            <Bell size={16} className="text-muted" />
          </button>

          {/* Plan badge */}
          {profile.plan === 'free' && (
            <Link
              href="/dashboard/settings?tab=billing"
              className="btn btn-gold btn-sm whitespace-nowrap"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="p-5 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
