import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SwipeDeck } from './SwipeDeck'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Offers' }

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  countered: 'bg-sky-100 text-sky-800',
  accepted:  'bg-green-100 text-green-700',
  declined:  'bg-stone-100 text-stone-500',
  withdrawn: 'bg-stone-100 text-stone-500',
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function OffersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === 'outgoing' ? 'outgoing' : 'incoming'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/offers')

  // ── Step 1: listings owned by this user ────────────────────────────────────
  const { data: myListings, error: listingsErr } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)

  if (listingsErr) {
    console.error('[offers] listings error:', listingsErr.message, listingsErr.code)
  }
  console.log(`[offers] user=${user.id} owns ${myListings?.length ?? 'null(err)'} listing(s):`, myListings?.map((l) => l.id))

  const myListingIds = myListings?.map((l) => l.id) ?? []

  // ── Step 2: incoming + outgoing offers (no profiles join to avoid RLS drop) ─
  const [incomingRaw, outgoingResult] = await Promise.all([
    myListingIds.length > 0
      ? supabase
          .from('offers')
          .select('id, offer_description, status, created_at, listing_id, from_user_id, listings(title)')
          .in('listing_id', myListingIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { id: string; offer_description: string; status: string; created_at: string; listing_id: string; from_user_id: string; listings: unknown }[], error: null }),

    supabase
      .from('offers')
      .select('id, offer_description, status, created_at, listing_id, responded_at, from_user_last_seen_at, listings(title)')
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (incomingRaw.error) {
    console.error('[offers] incoming error:', incomingRaw.error.message, incomingRaw.error.code)
  } else {
    console.log(`[offers] incoming: ${incomingRaw.data?.length ?? 0} row(s)`, incomingRaw.data?.map((o) => o.id))
  }
  if (outgoingResult.error) {
    console.error('[offers] outgoing error:', outgoingResult.error.message)
  } else {
    console.log(`[offers] outgoing: ${outgoingResult.data?.length ?? 0} row(s)`)
  }

  // ── Step 3: batch-fetch profiles for incoming offer makers ─────────────────
  const fromUserIds = [...new Set((incomingRaw.data ?? []).map((o) => o.from_user_id))]
  const { data: offerProfiles } = fromUserIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', fromUserIds)
    : { data: [] as { id: string; username: string }[] }

  const profileMap: Record<string, string> = Object.fromEntries(
    (offerProfiles ?? []).map((p) => [p.id, p.username])
  )

  const incoming = (incomingRaw.data ?? []).map((o) => ({
    ...o,
    fromUsername: profileMap[o.from_user_id] ?? '?',
  }))
  const outgoing = outgoingResult.data ?? []

  // Determine which outgoing offers have unseen activity
  const outgoingIds = outgoing.map((o) => o.id)
  const { data: unreadOutgoingMsgs } = outgoingIds.length > 0
    ? await supabase
        .from('messages')
        .select('offer_id')
        .in('offer_id', outgoingIds)
        .eq('to_user_id', user.id)
        .is('read_at', null)
    : { data: [] as { offer_id: string }[] }

  const offersWithUnreadMsg = new Set((unreadOutgoingMsgs ?? []).map((m) => m.offer_id))

  type OutgoingActivity = 'status' | 'message' | null
  function outgoingActivity(o: typeof outgoing[number]): OutgoingActivity {
    if (offersWithUnreadMsg.has(o.id)) return 'message'
    if (
      ['accepted', 'declined'].includes(o.status) &&
      o.responded_at &&
      (!o.from_user_last_seen_at ||
        new Date(o.from_user_last_seen_at as string) < new Date(o.responded_at as string))
    ) return 'status'
    return null
  }

  const pendingIncoming = incoming.filter((o) => o.status === 'pending')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:pb-8">
      <h1 className="mb-5 text-2xl font-bold text-stone-900">Offers</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1">
        <Link
          href="/offers"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'incoming'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Incoming
          {incoming.length > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              pendingIncoming.length > 0
                ? 'bg-red-500 text-white'
                : 'bg-stone-200 text-stone-600'
            }`}>
              {pendingIncoming.length > 0 ? pendingIncoming.length : incoming.length}
            </span>
          )}
        </Link>
        <Link
          href="/offers?tab=outgoing"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'outgoing'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Outgoing
          {outgoing.length > 0 && (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
              {outgoing.length}
            </span>
          )}
        </Link>
      </div>

      {/* ── Incoming tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'incoming' && (
        <>
          {/* Swipe deck for pending offers */}
          {pendingIncoming.length > 0 && (
            <section className="mb-6">
              <p className="mb-3 text-sm font-semibold text-stone-700">
                {pendingIncoming.length} pending — swipe to review
              </p>
              <SwipeDeck
                offers={pendingIncoming.map((o) => ({
                  id: o.id,
                  offerDescription: o.offer_description,
                  fromUsername: o.fromUsername,
                  listingTitle: (o.listings as unknown as { title: string } | null)?.title ?? '',
                }))}
              />
            </section>
          )}

          {/* All incoming list */}
          {incoming.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="font-medium text-stone-600 text-sm">No offers yet</p>
              <p className="text-xs text-stone-400 mt-1">
                Offers from other traders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {incoming.map((offer) => {
                const listing = offer.listings as unknown as { title: string } | null
                return (
                  <OfferRow
                    key={offer.id}
                    id={offer.id}
                    title={listing?.title ?? '—'}
                    subtitle={`from @${offer.fromUsername}`}
                    preview={offer.offer_description}
                    status={offer.status}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Outgoing tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'outgoing' && (
        <>
          {outgoing.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-medium text-stone-600 text-sm">No outgoing offers yet</p>
              <p className="text-xs text-stone-400 mt-1 mb-4">
                Find a listing and make your first offer.
              </p>
              <Link href="/browse" className="btn-primary inline-block text-sm">
                Browse listings →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {outgoing.map((offer) => {
                const listing = offer.listings as unknown as { title: string } | null
                const activity = outgoingActivity(offer)
                return (
                  <OfferRow
                    key={offer.id}
                    id={offer.id}
                    title={listing?.title ?? '—'}
                    subtitle="your offer"
                    preview={offer.offer_description}
                    status={offer.status}
                    activity={activity}
                  />
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function OfferRow({
  id, title, subtitle, preview, status, activity,
}: {
  id: string; title: string; subtitle: string; preview: string; status: string
  activity?: 'status' | 'message' | null
}) {
  return (
    <Link
      href={`/offers/${id}`}
      className="card flex items-start justify-between gap-3 hover:border-brand-300 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-stone-800 text-sm">{title}</p>
          {activity === 'message' && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-brand-500" title="Unread message" />
          )}
          {activity === 'status' && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-red-500" title="Status changed" />
          )}
        </div>
        <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
        <p className="mt-1 line-clamp-1 text-xs text-stone-500">{preview}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.pending}`}>
        {status}
      </span>
    </Link>
  )
}
