'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()

      async function init() {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)
        if (data.user) await refreshPendingCount(data.user.id)
      }

      async function refreshPendingCount(userId: string) {
        // Fetch in parallel: my listings, unread messages, unseen status changes
        const [listingsRes, unreadMsgsRes, unseenStatusRes] = await Promise.all([
          supabase.from('listings').select('id').eq('user_id', userId),
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('to_user_id', userId)
            .is('read_at', null),
          supabase
            .from('offers')
            .select('responded_at, from_user_last_seen_at')
            .eq('from_user_id', userId)
            .in('status', ['accepted', 'declined']),
        ])

        let total = 0

        // Pending incoming offers on my listings
        if (listingsRes.data?.length) {
          const { count } = await supabase
            .from('offers')
            .select('id', { count: 'exact', head: true })
            .in('listing_id', listingsRes.data.map((l) => l.id))
            .eq('status', 'pending')
          total += count ?? 0
        }

        // Unread messages
        total += unreadMsgsRes.count ?? 0

        // Unseen status changes (client-side filter for column comparison)
        const unseen = (unseenStatusRes.data ?? []).filter(
          (o) =>
            !o.from_user_last_seen_at ||
            new Date(o.from_user_last_seen_at) < new Date(o.responded_at as string)
        ).length
        total += unseen

        setPendingCount(total)
      }

      init()

      const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          refreshPendingCount(session.user.id)
        } else {
          setPendingCount(0)
        }
      })
      return () => listener.subscription.unsubscribe()
    })
  }, [])

  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <span className="font-bold text-stone-900">BarterWithMe</span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          <NavLink href="/browse" label="Browse" isActive={active('/browse')} />
          <NavLink href="/stories" label="Stories" isActive={active('/stories')} />
          {user && <NavLink href="/listings/new" label="List Something" isActive={active('/listings/new')} />}
          {user && <NavLink href="/offers" label="Offers" isActive={active('/offers')} badge={pendingCount} />}
          <NavLink href="/why" label="Why" isActive={active('/why')} />
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
            <MobileNavLink href="/offers" icon="💬" label="Offers" active={pathname.startsWith('/offers')} badge={pendingCount} />
            <MobileNavLink href="/profile" icon="👤" label="Profile" active={pathname === '/profile'} />
          </>
        ) : (
          <MobileNavLink href="/signup" icon="👋" label="Join" active={pathname === '/signup'} />
        )}
      </div>
    </header>
  )
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function NavLink({
  href, label, isActive, badge = 0,
}: {
  href: string; label: string; isActive: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-600 ${
        isActive ? 'text-brand-600' : 'text-stone-600'
      }`}
    >
      {label}
      <Badge count={badge} />
    </Link>
  )
}

function MobileNavLink({
  href, icon, label, active, badge = 0,
}: {
  href: string; icon: string; label: string; active: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-1 flex-col items-center py-2 text-xs transition-colors ${
        active ? 'text-brand-600' : 'text-stone-500'
      }`}
    >
      <span className="relative text-lg leading-none">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1 -right-2.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="mt-0.5">{label}</span>
    </Link>
  )
}
