import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { MakeOfferForm } from '@/components/MakeOfferForm'
import { ReportListingButton } from '@/components/ReportListingButton'

export const dynamic = 'force-dynamic'

const LISTING_TYPE_LABELS: Record<string, string> = {
  item: 'One-time item',
  service_onetime: 'One-time service',
  service_recurring: 'Ongoing service',
  recurring_goods: 'Recurring goods',
}

const CATEGORY_ICONS: Record<number, string> = {
  1: '🌱', 2: '🔨', 3: '🏠', 4: '🐄',
  5: '💼', 6: '🧶', 7: '🚛', 8: '✨', 9: '📦',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Listing not found' }
  return { title: data.title, description: data.description.slice(0, 160) }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      categories (name),
      profiles (username, region, trade_count, vouch_count)
    `)
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.user_id

  // Check if the current user already has an offer on this listing
  const existingOffer = (user && !isOwner)
    ? (await supabase
        .from('offers')
        .select('id, status')
        .eq('listing_id', id)
        .eq('from_user_id', user.id)
        .maybeSingle()
      ).data
    : null

  const profile = listing.profiles as { username: string; region: string; trade_count: number; vouch_count: number } | null
  const category = listing.categories as { name: string } | null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:pb-8">
      {/* Status banner */}
      {listing.status !== 'active' && (
        <div className="mb-4 rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-500 text-center capitalize">
          This listing is {listing.status}
        </div>
      )}

      {/* Photos */}
      {listing.photos && listing.photos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(listing.photos as string[]).map((url, i) => (
            <div key={url} className={`relative ${i === 0 ? 'col-span-2 row-span-2' : ''} aspect-square`}>
              <Image
                src={url}
                alt={`${listing.title} photo ${i + 1}`}
                fill
                className="rounded-xl object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {category && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                  {CATEGORY_ICONS[listing.category_id] ?? '📦'} {category.name}
                </span>
              )}
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900">{listing.title}</h1>
            <p className="mt-0.5 text-sm text-stone-400">{listing.region}</p>
          </div>
          {isOwner && (
            <Link
              href={`/listings/${listing.id}/edit`}
              className="btn-secondary text-xs py-1.5 px-3 shrink-0"
            >
              Edit
            </Link>
          )}
        </div>

        <p className="mt-4 text-stone-700 leading-relaxed whitespace-pre-line text-sm">
          {listing.description}
        </p>

        {listing.open_to && (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
            <p className="text-xs font-semibold text-brand-700 mb-1">Open to receiving</p>
            <p className="text-sm text-brand-900">{listing.open_to}</p>
          </div>
        )}
      </div>

      {/* Lister */}
      {profile && (
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Listed by</p>
            <Link href={`/users/${profile.username}`} className="font-semibold text-stone-800 hover:text-brand-600 hover:underline">
              @{profile.username}
            </Link>
            <p className="text-xs text-stone-500 mt-0.5">{profile.region}</p>
          </div>
          <div className="text-right text-xs text-stone-400 space-y-0.5">
            {profile.trade_count > 0 && <p>{profile.trade_count} trades</p>}
            {profile.vouch_count > 0 && <p>{profile.vouch_count} vouches</p>}
          </div>
        </div>
      )}

      {/* CTA */}
      {!isOwner && listing.status === 'active' && (
        <>
          <MakeOfferForm
            listingId={listing.id}
            listingTitle={listing.title}
            isLoggedIn={!!user}
            existingOffer={existingOffer}
          />
          {user && <ReportListingButton listingId={listing.id} />}
        </>
      )}

      {isOwner && (
        <div className="card border-stone-200">
          <p className="text-sm font-medium text-stone-700 mb-3">Manage this listing</p>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/listings/${listing.id}/edit`} className="btn-secondary text-sm">
              Edit listing
            </Link>
            {listing.status === 'active' && ['item', 'service_onetime'].includes(listing.listing_type) && (
              <MarkTradedButton listingId={listing.id} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MarkTradedButton({ listingId }: { listingId: string }) {
  return (
    <form action={`/api/listings/${listingId}/mark-traded`} method="POST">
      <button type="submit" className="btn-secondary text-sm text-stone-500">
        Mark as traded
      </button>
    </form>
  )
}
