import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/ListingCard'
import { BrowseFilters } from './BrowseFilters'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Browse Listings' }

// Matches slugs seeded in categories migration
const SLUG_TO_ID: Record<string, number> = {
  'food-garden': 1,
  'skills-labor': 2,
  'household-tools': 3,
  'animals-livestock': 4,
  'professional-services': 5,
  'handmade-crafts': 6,
  'transportation': 7,
  'valuables-collectibles': 8,
  'other': 9,
}

const CATEGORY_NAMES: Record<string, string> = {
  'food-garden': 'Food & Garden',
  'skills-labor': 'Skills & Labor',
  'household-tools': 'Household & Tools',
  'animals-livestock': 'Animals & Livestock',
  'professional-services': 'Professional Services',
  'handmade-crafts': 'Handmade & Crafts',
  'transportation': 'Transportation & Hauling',
  'valuables-collectibles': 'Valuables & Collectibles',
  'other': 'Other',
}

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; region?: string; show_mine?: string }>
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const { q, category, region, show_mine } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const showMine = show_mine === '1'

  // Listings query — build up filters
  let query = supabase
    .from('listings')
    .select(`
      id, title, description, listing_type, category_id, photos, open_to, region,
      categories ( name, slug ),
      profiles ( username )
    `)
    .eq('status', 'active')
    .eq('is_paused', false)
    .order('created_at', { ascending: false })
    .limit(60)

  if (category && SLUG_TO_ID[category]) {
    query = query.eq('category_id', SLUG_TO_ID[category])
  }

  if (q?.trim()) {
    // Escape ilike wildcards so user input is treated as literal text
    const safe = q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)
    query = query.or(
      `title.ilike.%${safe}%,description.ilike.%${safe}%,open_to.ilike.%${safe}%`
    )
  }

  if (region) {
    query = query.eq('region', region)
  }

  // Exclude the logged-in user's own listings unless they opted in
  if (user && !showMine) {
    query = query.neq('user_id', user.id)
  }

  // Run listings + distinct regions in parallel
  const [{ data: listings }, { data: regionRows }] = await Promise.all([
    query,
    supabase
      .from('listings')
      .select('region')
      .eq('status', 'active')
      .eq('is_paused', false),
  ])

  const distinctRegions = [
    ...new Set((regionRows ?? []).map((r) => r.region)),
  ].sort()

  // Build result header label
  const filterParts: string[] = []
  if (category && CATEGORY_NAMES[category]) filterParts.push(`in ${CATEGORY_NAMES[category]}`)
  if (q?.trim()) filterParts.push(`matching "${q.trim()}"`)
  if (region) filterParts.push(`near ${region}`)
  const count = listings?.length ?? 0
  const resultLabel = `${count} listing${count === 1 ? '' : 's'}${filterParts.length ? ' ' + filterParts.join(', ') : ''}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-28 sm:pb-8">
      {/* Filters — Suspense required by useSearchParams */}
      <Suspense fallback={<FilterShell />}>
        <BrowseFilters
          initialQ={q ?? ''}
          initialCategory={category ?? ''}
          initialRegion={region ?? ''}
          regions={distinctRegions}
        />
      </Suspense>

      {/* Result count */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-400">{resultLabel}</p>
        <div className="flex shrink-0 items-center gap-3">
          {user && (
            <a
              href={buildToggleUrl({ q, category, region, showMine })}
              className="text-xs text-stone-400 hover:text-stone-600 hover:underline"
            >
              {showMine ? 'Hide my listings' : 'Show mine too'}
            </a>
          )}
          {(q || category || region) && (
            <a href="/browse" className="text-xs text-stone-400 underline hover:text-stone-600">
              Clear filters
            </a>
          )}
        </div>
      </div>

      {/* Grid */}
      {count > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(listings ?? []).map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              description={listing.description}
              listingType={listing.listing_type}
              category={listing.categories as unknown as { name: string; slug: string } | null}
              photos={(listing.photos as string[]) ?? []}
              openTo={listing.open_to}
              region={listing.region}
              username={
                (listing.profiles as unknown as { username: string } | null)?.username ?? 'unknown'
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState hasFilters={!!(q || category || region)} />
      )}
    </div>
  )
}

function buildToggleUrl({
  q, category, region, showMine,
}: { q?: string; category?: string; region?: string; showMine: boolean }) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (category) p.set('category', category)
  if (region) p.set('region', region)
  if (!showMine) p.set('show_mine', '1')   // toggling ON
  const qs = p.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="card py-16 text-center">
      <p className="mb-3 text-4xl">🌱</p>
      <p className="font-semibold text-stone-700">
        {hasFilters ? 'No listings match those filters' : 'No listings yet'}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-stone-400">
        {hasFilters
          ? 'Try a different keyword or category.'
          : 'Be the first to list something in your community.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {hasFilters && (
          <a href="/browse" className="btn-secondary text-sm">
            Clear filters
          </a>
        )}
        <a href="/listings/new" className="btn-primary text-sm">
          List something →
        </a>
      </div>
    </div>
  )
}

// Skeleton shown while BrowseFilters hydrates
function FilterShell() {
  return (
    <div className="mb-5 space-y-3 animate-pulse">
      <div className="h-12 rounded-xl bg-stone-100" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 shrink-0 rounded-full bg-stone-100" />
        ))}
      </div>
    </div>
  )
}
