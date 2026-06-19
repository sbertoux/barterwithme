import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditListingForm } from './EditListingForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit Listing' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/listings/${id}/edit`)

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id, title, description, listing_type, category_id, open_to, photos, region, status')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // Only the owner can edit
  if (listing.user_id !== user.id) redirect(`/listings/${id}`)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Edit listing</h1>
          <p className="mt-1 text-sm text-stone-500">
            Changes go live immediately.
          </p>
        </div>
        <a
          href={`/listings/${id}`}
          className="btn-secondary py-2 px-3 text-xs"
        >
          ← Back
        </a>
      </div>

      <EditListingForm
        userId={user.id}
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          listing_type: listing.listing_type as 'item' | 'service_onetime' | 'service_recurring' | 'recurring_goods',
          category_id: listing.category_id,
          open_to: listing.open_to ?? '',
          photos: (listing.photos as string[]) ?? [],
          region: listing.region,
          status: listing.status,
        }}
      />
    </div>
  )
}
