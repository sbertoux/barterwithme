import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OfferThread } from './OfferThread'
import { FallbackConfirmButton } from './FallbackConfirmButton'

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
      lister_contact,
      trader_contact,
      profiles!from_user_id ( username )
    `)
    .eq('id', id)
    .single()

  if (!offer) notFound()

  // Fetch listing separately — the JOIN silently drops rows when listing status
  // is non-active and the viewer isn't the owner (RLS filters it out mid-join).
  // Migration 010 adds an RLS policy so traders can always read their offer's listing.
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, title, user_id, listing_type, region, status, is_paused')
    .eq('id', offer.listing_id)
    .maybeSingle()

  // Use SECURITY DEFINER function to identify the lister without depending on the
  // listing row being readable — same fix pattern as migration 004 for offers RLS.
  // This prevents the lister from being wrongly redirected when their own listing
  // is temporarily inaccessible (e.g. RLS edge cases on traded listings).
  const { data: listingOwnerId } = await supabase
    .rpc('get_listing_owner', { lid: offer.listing_id })

  const fromProfile = offer.profiles as unknown as { username: string }

  const isTrader = user.id === offer.from_user_id
  const isLister = user.id === listingOwnerId

  if (!isLister && !isTrader) redirect('/offers')

  if (!listing) {
    // Listing deleted or RLS still blocking despite migration 010.
    // Diagnostic: visible in dev server logs and rendered page.
    const listingErrMsg = listingError
      ? `${(listingError as { code?: string }).code ?? 'unknown'}: ${(listingError as { message?: string }).message ?? ''}`
      : 'no error — listing_id may not exist'

    // Load messages + full trade state so both parties can confirm from the fallback.
    const [{ data: fallbackMessages }, { data: fallbackTrade }] = await Promise.all([
      supabase
        .from('messages')
        .select('id, from_user_id, content, created_at')
        .eq('offer_id', id)
        .order('created_at', { ascending: true }),
      offer.status === 'accepted'
        ? supabase
            .from('trades')
            .select('id, confirmed_by_lister, confirmed_by_trader, completed_at')
            .eq('offer_id', id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const myFbConfirmed = fallbackTrade
      ? (isLister ? fallbackTrade.confirmed_by_lister : fallbackTrade.confirmed_by_trader)
      : null

    return (
      <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:pb-6">
        <div className="mb-4">
          <a href="/offers" className="text-xs text-stone-400 hover:underline">← Offers</a>
          <h1 className="mt-2 text-lg font-bold text-stone-900">
            {isLister ? `Offer from @${fromProfile.username}` : 'Your offer'}
          </h1>
        </div>

        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
          <p className="font-medium text-amber-800">Listing no longer accessible</p>
          <p className="mt-0.5 text-xs text-amber-600">
            The listing was removed or is temporarily unavailable, but your trade history is preserved below.
          </p>
          <p className="mt-1 text-[10px] text-amber-400 font-mono">{listingErrMsg}</p>
        </div>

        <div className="card mb-4 bg-stone-50 border-stone-200">
          <p className="text-xs font-medium text-stone-400 mb-1">
            {isLister ? `@${fromProfile.username}'s offer` : 'Your offer'}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed">{offer.offer_description}</p>
          <p className="mt-2 text-xs text-stone-400">
            Status: <span className="capitalize font-medium">{offer.status}</span>
            {fallbackTrade?.completed_at && ' · Trade completed'}
          </p>
        </div>

        {/* Confirmation card — shown in fallback when trade exists and not yet complete */}
        {fallbackTrade && !fallbackTrade.completed_at && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <p className="font-semibold text-stone-800 text-sm mb-1">Has the trade happened?</p>
            <p className="text-xs text-stone-500 mb-3">
              {myFbConfirmed
                ? 'You confirmed. Waiting for the other party.'
                : 'Confirm when both sides have completed the exchange.'}
            </p>
            {!myFbConfirmed && (
              <FallbackConfirmButton tradeId={fallbackTrade.id} />
            )}
          </div>
        )}
        {fallbackTrade?.completed_at && (
          <div className="card mb-4 border-green-200 bg-green-50 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-semibold text-green-800">Trade complete!</p>
          </div>
        )}

        {(fallbackMessages ?? []).length > 0 && (
          <div className="card border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Messages</p>
            <div className="space-y-2">
              {(fallbackMessages ?? []).map((msg) => {
                const mine = msg.from_user_id === user.id
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${mine ? 'opacity-60' : 'text-stone-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Load messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, from_user_id, to_user_id, content, created_at, read_at')
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
        listingId={listing.id}
        listingType={listing.listing_type}
        isListingPaused={listing.is_paused}
        traderId={offer.from_user_id}
        listerUsername={listerProfile?.username ?? '?'}
        traderUsername={fromProfile.username}
        listingTitle={listing.title}
        offerDescription={offer.offer_description}
        initialListerContact={offer.lister_contact ?? null}
        initialTraderContact={offer.trader_contact ?? null}
        initialMessages={(messages ?? []).map((m) => ({
          id: m.id,
          from_user_id: m.from_user_id,
          content: m.content,
          created_at: m.created_at,
          read_at: m.read_at,
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
