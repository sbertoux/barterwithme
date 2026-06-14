'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Lazy import so the browser client is never instantiated during SSR
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => setUser(data.user))
      const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
      })
      return () => listener.subscription.unsubscribe()
    })
  }, [])

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-brand-600 ${
        pathname === href ? 'text-brand-600' : 'text-stone-600'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <span className="font-bold text-stone-900">BarterWithMe</span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          {navLink('/browse', 'Browse')}
          {navLink('/why', 'Why')}
          {user && navLink('/listings/new', 'List Something')}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/profile" className="btn-secondary py-2 px-3 text-xs">
              My Profile
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary py-2 px-3 text-xs">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary py-2 px-3 text-xs">
                Join
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-200 bg-white sm:hidden">
        <MobileNavLink href="/" icon="🏠" label="Home" active={pathname === '/'} />
        <MobileNavLink href="/browse" icon="🔍" label="Browse" active={pathname.startsWith('/browse')} />
        {user ? (
          <>
            <MobileNavLink href="/listings/new" icon="+" label="List" active={pathname === '/listings/new'} />
            <MobileNavLink href="/offers" icon="💬" label="Offers" active={pathname.startsWith('/offers')} />
            <MobileNavLink href="/profile" icon="👤" label="Profile" active={pathname === '/profile'} />
          </>
        ) : (
          <MobileNavLink href="/signup" icon="👋" label="Join" active={pathname === '/signup'} />
        )}
      </div>
    </header>
  )
}

function MobileNavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center py-2 text-xs transition-colors ${
        active ? 'text-brand-600' : 'text-stone-500'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="mt-0.5">{label}</span>
    </Link>
  )
}
