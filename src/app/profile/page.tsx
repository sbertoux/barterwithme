import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ActivityAlert } from '@/components/ActivityAlert'

export const metadata: Metadata = { title: 'My Profile' }

const TYPE_LABEL: Record<string, string> = {
  item: 'Item',
  service_onetime: 'One-time service',
  service_recurring: 'Ongoing service',
  recurring_goods: 'Recurring goods',
}

const STATUS_BADGE: Record<string, string> = {
  active:  'bg-green-100 text-green-700',
  traded:  'bg-stone-100 text-stone-500',
  dormant: 'bg-yellow-100 text-yellow-700',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === 'history' ? 'history' : 'listings'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profile/setup')

  // ── Listings tab data ──────────────────────────────────────────────────────
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, listing_type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeListings = listings?.filter((l) => l.status === 'active') ?? []
  const tradedListings = listings?.filter((l) => l.status === 'traded') ?? []

  // ── History tab data (only fetched on that tab) ───────────────────────────
  let allListings: typeof listings = []
  let traderTrades: {
    id: string; completed_at: string | null; offer_id: string;
    offerDesc: string; listingTitle: string; listingId: string
  }[] = []
  let myStories: { id: string; story_text: string; region: string; created_at: string }[] = []

  if (activeTab === 'history') {
    // All listings, all statuses
    const { data: all } = await supabase
      .from('listings')
      .select('id, title, listing_type, status, created_at, traded_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    allListings = all ?? []

    // Offers I made that were accepted, joined to completed trades
    const { data: myOffers } = await supabase
      .from('offers')
      .select('id, offer_description, listing_id, listings(id, title)')
      .eq('from_user_id', user.id)
      .eq('status', 'accepted')

    const myOfferIds = (myOffers ?? []).map((o) => o.id)
    if (myOfferIds.length > 0) {
      const { data: trades } = await supabase
        .from('trades')
        .select('id, completed_at, offer_id')
        .in('offer_id', myOfferIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      const offerMap = Object.fromEntries(
        (myOffers ?? []).map((o) => {
          const l = o.listings as unknown as { id: string; title: string } | null
          return [o.id, { desc: o.offer_description, listingTitle: l?.title ?? '—', listingId: l?.id ?? '' }]
        })
      )

      traderTrades = (trades ?? []).map((t) => ({
        id: t.id,
        completed_at: t.completed_at,
        offer_id: t.offer_id,
        offerDesc: offerMap[t.offer_id]?.desc ?? '',
        listingTitle: offerMap[t.offer_id]?.listingTitle ?? '—',
        listingId: offerMap[t.offer_id]?.listingId ?? '',
      }))
    }

    // Stories I posted
    const { data: stories } = await supabase
      .from('trade_stories')
      .select('id, story_text, region, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    myStories = stories ?? []
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:pb-8">
      <ActivityAlert />

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">@{profile.username}</h1>
            <p className="text-sm text-stone-500 mt-0.5">{profile.region}</p>
            {profile.bio && (
              <p className="mt-3 text-sm text-stone-600">{profile.bio}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                ✓ Verified
              </span>
            )}
            {profile.vouch_count > 0 && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Trusted member
              </span>
            )}
            <span className="text-xs text-stone-400">
              {profile.trade_count} {profile.trade_count === 1 ? 'trade' : 'trades'}
              {profile.vouch_count > 0 && ` · ${profile.vouch_count} ${profile.vouch_count === 1 ? 'vouch' : 'vouches'}`}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Link href="/profile/edit" className="btn-secondary text-xs py-2 px-3">
            Edit profile
          </Link>
          <Link href="/listings/new" className="btn-primary text-xs py-2 px-3">
            + New listing
          </Link>
          <Link href={`/users/${profile.username}`} className="btn-secondary text-xs py-2 px-3 text-stone-400">
            Public view →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1">
        <Link
          href="/profile"
          className={`flex flex-1 items-center justify-center rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'listings'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Listings
        </Link>
        <Link
          href="/profile?tab=history"
          className={`flex flex-1 items-center justify-center rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          History
        </Link>
      </div>

      {/* ── Listings tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <>
          <section className="mb-4">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">
              Active listings ({activeListings.length})
            </h2>
            {activeListings.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-stone-400 text-sm">No active listings.</p>
                <Link href="/listings/new" className="btn-primary mt-4 inline-block text-sm">
                  Add your first listing →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="card flex items-center justify-between hover:border-brand-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{listing.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{TYPE_LABEL[listing.listing_type] ?? listing.listing_type}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {tradedListings.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-semibold text-stone-700 mb-3">
                Completed trades ({tradedListings.length})
              </h2>
              <div className="space-y-2">
                {tradedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="card flex items-center justify-between opacity-70"
                  >
                    <p className="text-sm text-stone-600">{listing.title}</p>
                    <span className="text-xs text-stone-400">Traded</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── History tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <p className="text-xs text-stone-400 -mt-2">
            Private — only visible to you.
          </p>

          {/* All listings */}
          <section>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">All my listings ({allListings?.length ?? 0})</h2>
            {!allListings?.length ? (
              <p className="text-sm text-stone-400 card py-6 text-center">No listings yet.</p>
            ) : (
              <div className="space-y-2">
                {(allListings ?? []).map((l) => {
                  const tl = l as typeof l & { traded_at?: string | null }
                  return (
                    <Link
                      key={l.id}
                      href={`/listings/${l.id}`}
                      className="card flex items-start justify-between gap-3 hover:border-brand-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">{l.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {TYPE_LABEL[l.listing_type] ?? l.listing_type}
                          {' · '}Created {fmt(l.created_at)}
                          {tl.traded_at ? ` · Traded ${fmt(tl.traded_at)}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[l.status] ?? ''}`}>
                        {l.status}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Trades completed as buyer */}
          <section>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">
              Trades completed as a buyer ({traderTrades.length})
            </h2>
            {traderTrades.length === 0 ? (
              <p className="text-sm text-stone-400 card py-6 text-center">No completed trades as a buyer yet.</p>
            ) : (
              <div className="space-y-2">
                {traderTrades.map((t) => (
                  <Link
                    key={t.id}
                    href={`/listings/${t.listingId}`}
                    className="card hover:border-brand-300 transition-colors"
                  >
                    <p className="text-sm font-medium text-stone-800">{t.listingTitle}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">Your offer: {t.offerDesc}</p>
                    {t.completed_at && (
                      <p className="mt-1 text-xs text-stone-400">Completed {fmt(t.completed_at)}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Stories posted */}
          <section>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">
              Trade stories shared ({myStories.length})
            </h2>
            {myStories.length === 0 ? (
              <p className="text-sm text-stone-400 card py-6 text-center">No stories shared yet.</p>
            ) : (
              <div className="space-y-2">
                {myStories.map((s) => (
                  <div key={s.id} className="card">
                    <p className="text-sm text-stone-700">"{s.story_text}"</p>
                    <p className="mt-1 text-xs text-stone-400">{s.region} · {fmt(s.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Sign out */}
      <form action="/auth/signout" method="POST" className="mt-6">
        <button
          type="submit"
          className="w-full text-sm text-stone-400 hover:text-stone-600 py-2"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
