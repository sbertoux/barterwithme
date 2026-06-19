'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PendingOffer {
  id: string
  listingTitle: string
}

export function PendingOffersAlert() {
  const [pending, setPending] = useState<PendingOffer[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return

        const { data: myListings } = await supabase
          .from('listings')
          .select('id, title')
          .eq('user_id', user.id)

        if (!myListings?.length) return

        const { data: offers } = await supabase
          .from('offers')
          .select('id, listing_id')
          .in('listing_id', myListings.map((l) => l.id))
          .eq('status', 'pending')

        if (!offers?.length) return

        const titleMap = Object.fromEntries(myListings.map((l) => [l.id, l.title]))
        setPending(offers.map((o) => ({
          id: o.id,
          listingTitle: titleMap[o.listing_id] ?? 'your listing',
        })))
      })
    })
  }, [])

  if (!pending.length || dismissed) return null

  const firstTitle = pending[0].listingTitle
  const message =
    pending.length === 1
      ? `New offer on "${firstTitle}"`
      : `You have ${pending.length} new offers on your listings`

  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 text-lg">💬</span>
          <p className="text-sm font-medium text-brand-800 truncate">{message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/offers" className="text-xs font-semibold text-brand-600 hover:underline">
            Review →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-brand-400 hover:text-brand-600 text-base leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
