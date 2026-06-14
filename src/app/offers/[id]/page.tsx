import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OfferThread } from './OfferThread'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Offer' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function OfferDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/offers/${id}`)

  const { data: offer } = await supabase
    .from('offers')
    .select(`
      id, offer_description, status, created_at,
      from_user_id,
      listing_id,
      listings ( id, title, user_id, listing_type, region, status ),
      profiles!from_user_id ( username )
    `)
    .eq('id', id)
    .single()

  if (!offer) notFound()

  const listing = offer.listings as unknown as {
    id: string; title: string; user_id: string; listing_type: string; region: string; status: string
  }
  const fromProfile = offer.profiles as unknown as { username: string }

  // Only the two parties can view this offer
  const isLister = user.id === listing.user_id
  const isTrader = user.id === offer.from_user_id
  if (!isLister && !isTrader) redirect('/offers')

  // Load messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, from_user_id, to_user_id, content, created_at')
    .eq('offer_id', id)
    .order('created_at', { ascending: true })

  // Load trade record if offer is accepted
  const { data: trade } = offer.status === 'accepted'
    ? await supabase
        .from('trades')
        .select('id, confirmed_by_lister, confirmed_by_trader, completed_at')
        .eq('offer_id', id)
        .maybeSingle()
    : { data: null }

  // Load lister profile for display
  const { data: listerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', listing.user_id)
    .single()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:pb-6">
      {/* Header */}
      <div className="mb-4">
        <a href="/offers" className="text-xs text-stone-400 hover:underline">← Offers</a>
        <h1 className="mt-2 text-lg font-bold text-stone-900">
          {isLister
            ? `Offer from @${fromProfile.username}`
            : `Your offer on "${listing.title}"`}
        </h1>
        <p className="mt-0.5 text-sm text-stone-500">
          <a href={`/listings/${listing.id}`} className="hover:underline text-brand-600">
            {listing.title}
          </a>
          {' · '}
          {listing.region}
        </p>
      </div>

      {/* Original offer */}
      <div className="card mb-4 bg-stone-50 border-stone-200">
        <p className="text-xs font-medium text-stone-400 mb-1">
          {isLister ? `@${fromProfile.username}'s offer` : 'Your offer'}
        </p>
        <p className="text-sm text-stone-700 leading-relaxed">{offer.offer_description}</p>
      </div>

      <OfferThread
        offerId={id}
        status={offer.status}
        currentUserId={user.id}
        listerId={listing.user_id}
        traderId={offer.from_user_id}
        listerUsername={listerProfile?.username ?? '?'}
        traderUsername={fromProfile.username}
        listingTitle={listing.title}
        initialMessages={(messages ?? []).map((m) => ({
          id: m.id,
          from_user_id: m.from_user_id,
          content: m.content,
          created_at: m.created_at,
        }))}
        trade={trade ? {
          id: trade.id,
          confirmed_by_lister: trade.confirmed_by_lister,
          confirmed_by_trader: trade.confirmed_by_trader,
          completed_at: trade.completed_at,
        } : null}
      />
    </div>
  )
}
