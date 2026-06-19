'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AlertKind = 'incoming' | 'accepted' | 'declined' | 'message'

interface AlertItem {
  kind: AlertKind
  offerId: string
  listingTitle: string
}

const PRIORITY: Record<AlertKind, number> = {
  accepted: 0,
  incoming: 1,
  message: 2,
  declined: 3,
}

const LABEL: Record<AlertKind, (title: string) => string> = {
  accepted: (t) => `Your offer on "${t}" was accepted!`,
  declined: (t) => `Your offer on "${t}" was declined`,
  incoming: (t) => `New offer on "${t}"`,
  message:  (t) => `New message on "${t}"`,
}

export function ActivityAlert() {
  const [items, setItems] = useState<AlertItem[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return

        const results: AlertItem[] = []

        // No embedded JOIN for listings — the PostgREST implicit INNER JOIN silently
        // drops rows when listing status is non-active and the viewer isn't the owner.
        // Instead: collect all listing_ids we need, then batch-fetch titles once.
        const [listingsRes, outgoingRes, unreadMsgsRes] = await Promise.all([
          supabase.from('listings').select('id, title').eq('user_id', user.id),
          supabase
            .from('offers')
            .select('id, listing_id, status, responded_at, from_user_last_seen_at')
            .eq('from_user_id', user.id)
            .in('status', ['accepted', 'declined']),
          supabase
            .from('messages')
            .select('offer_id')
            .eq('to_user_id', user.id)
            .is('read_at', null),
        ])

        const myListingTitleMap = Object.fromEntries(
          (listingsRes.data ?? []).map((l) => [l.id, l.title])
        )

        // Pending incoming offers on my listings
        if (listingsRes.data?.length) {
          const { data: pending } = await supabase
            .from('offers')
            .select('id, listing_id')
            .in('listing_id', listingsRes.data.map((l) => l.id))
            .eq('status', 'pending')
          for (const o of pending ?? []) {
            results.push({ kind: 'incoming', offerId: o.id, listingTitle: myListingTitleMap[o.listing_id] ?? 'your listing' })
          }
        }

        // Resolve listing_ids for message offer threads
        const uniqueOfferIds = [...new Set((unreadMsgsRes.data ?? []).map((m) => m.offer_id))]
        let msgOffers: { id: string; listing_id: string }[] = []
        if (uniqueOfferIds.length) {
          const { data } = await supabase
            .from('offers')
            .select('id, listing_id')
            .in('id', uniqueOfferIds)
          msgOffers = data ?? []
        }

        // Batch-fetch titles for all external listings (outgoing + message threads) in one query.
        // Migration 010 allows traders to read their offer's listings regardless of status,
        // so this single query covers both active and traded listing titles correctly.
        const externalListingIds = [
          ...new Set([
            ...(outgoingRes.data ?? []).map((o) => o.listing_id),
            ...msgOffers.map((o) => o.listing_id),
          ]),
        ]
        const externalTitleMap: Record<string, string> = {}
        if (externalListingIds.length) {
          const { data: externalListings } = await supabase
            .from('listings')
            .select('id, title')
            .in('id', externalListingIds)
          for (const l of externalListings ?? []) externalTitleMap[l.id] = l.title
        }

        // Accepted / declined offers I made that I haven't seen yet
        for (const o of outgoingRes.data ?? []) {
          const unseen =
            !o.from_user_last_seen_at ||
            new Date(o.from_user_last_seen_at) < new Date(o.responded_at as string)
          if (!unseen) continue
          results.push({ kind: o.status as AlertKind, offerId: o.id, listingTitle: externalTitleMap[o.listing_id] ?? 'a listing' })
        }

        // Unread messages — one item per affected offer thread
        const seenOfferIds = new Set(results.map((r) => r.offerId))
        for (const o of msgOffers) {
          if (seenOfferIds.has(o.id)) continue
          results.push({ kind: 'message', offerId: o.id, listingTitle: externalTitleMap[o.listing_id] ?? 'a listing' })
          seenOfferIds.add(o.id)
        }

        // Sort by priority
        results.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])
        setItems(results)
      })
    })
  }, [])

  if (!items.length || dismissed) return null

  const first = items[0]
  const rest = items.length - 1

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 text-lg">
            {first.kind === 'accepted' ? '🎉' : first.kind === 'declined' ? '↩️' : first.kind === 'incoming' ? '💬' : '✉️'}
          </span>
          <p className="truncate text-sm font-medium text-brand-800">
            {LABEL[first.kind](first.listingTitle)}
            {rest > 0 && <span className="text-brand-500"> · +{rest} more</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href={first.kind === 'incoming' ? '/offers' : `/offers/${first.offerId}`} className="text-xs font-semibold text-brand-600 hover:underline">
            {first.kind === 'incoming' ? 'Review →' : 'View →'}
          </Link>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-lg leading-none text-brand-400 hover:text-brand-600">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
