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

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/offers')

  // My listing IDs (for incoming query)
  const { data: myListings } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)

  const myListingIds = myListings?.map((l) => l.id) ?? []

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    myListingIds.length > 0
      ? supabase
          .from('offers')
          .select('id, offer_description, status, created_at, listing_id, listings(title), profiles!from_user_id(username)')
          .in('listing_id', myListingIds)
          .order('created_at', { ascending: false })
      : { data: [] },

    supabase
      .from('offers')
      .select('id, offer_description, status, created_at, listing_id, listings(title)')
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const pendingIncoming = (incoming ?? []).filter((o) => o.status === 'pending')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:pb-8">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Offers</h1>

      {/* Swipe deck for pending incoming offers */}
      {pendingIncoming.length > 0 && (
        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold text-stone-700">
            {pendingIncoming.length} pending — swipe to review
          </p>
          <SwipeDeck
            offers={pendingIncoming.map((o) => ({
              id: o.id,
              offerDescription: o.offer_description,
              fromUsername: (o.profiles as unknown as { username: string } | null)?.username ?? '?',
              listingTitle: (o.listings as unknown as { title: string } | null)?.title ?? '',
            }))}
          />
        </section>
      )}

      {/* Incoming */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-stone-600 uppercase tracking-wide">
          Incoming ({incoming?.length ?? 0})
        </h2>
        {(incoming ?? []).length === 0 ? (
          <p className="text-sm text-stone-400">No offers on your listings yet.</p>
        ) : (
          <div className="space-y-2">
            {(incoming ?? []).map((offer) => {
              const listing = offer.listings as unknown as { title: string } | null
              const from = offer.profiles as unknown as { username: string } | null
              return (
                <OfferRow
                  key={offer.id}
                  id={offer.id}
                  title={listing?.title ?? '—'}
                  subtitle={`from @${from?.username ?? '?'}`}
                  preview={offer.offer_description}
                  status={offer.status}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Outgoing */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-stone-600 uppercase tracking-wide">
          Outgoing ({outgoing?.length ?? 0})
        </h2>
        {(outgoing ?? []).length === 0 ? (
          <p className="text-sm text-stone-400">
            You haven't made any offers yet.{' '}
            <Link href="/browse" className="text-brand-600 underline">Browse listings →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {(outgoing ?? []).map((offer) => {
              const listing = offer.listings as unknown as { title: string } | null
              return (
                <OfferRow
                  key={offer.id}
                  id={offer.id}
                  title={listing?.title ?? '—'}
                  subtitle="your offer"
                  preview={offer.offer_description}
                  status={offer.status}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function OfferRow({
  id, title, subtitle, preview, status,
}: {
  id: string; title: string; subtitle: string; preview: string; status: string
}) {
  return (
    <Link
      href={`/offers/${id}`}
      className="card flex items-start justify-between gap-3 hover:border-brand-300 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-stone-800 text-sm">{title}</p>
        <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
        <p className="mt-1 line-clamp-1 text-xs text-stone-500">{preview}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.pending}`}>
        {status}
      </span>
    </Link>
  )
}
