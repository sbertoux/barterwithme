import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOfferReceived } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, offerDescription } = await request.json()
  if (!listingId || !offerDescription?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify listing exists, is active, and is not owned by the current user
  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id, title, status')
    .eq('id', listingId)
    .single()

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not found or not active' }, { status: 404 })
  }
  if (listing.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot offer on your own listing' }, { status: 400 })
  }

  // Require at least one active listing to participate
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (!count || count === 0) {
    return NextResponse.json(
      { error: 'You need at least one active listing to make offers.' },
      { status: 403 }
    )
  }

  // Check for duplicate offer
  const { data: existing } = await supabase
    .from('offers')
    .select('id, status')
    .eq('listing_id', listingId)
    .eq('from_user_id', user.id)
    .maybeSingle()

  if (existing && !['declined', 'withdrawn'].includes(existing.status)) {
    return NextResponse.json({ error: 'You already have an active offer on this listing.' }, { status: 409 })
  }

  // Insert offer (or re-insert if previous was declined/withdrawn — unique constraint requires delete first)
  if (existing) {
    await supabase.from('offers').delete().eq('id', existing.id)
  }

  const { data: offer, error: insertErr } = await supabase
    .from('offers')
    .insert({
      listing_id: listingId,
      from_user_id: user.id,
      offer_description: offerDescription.trim(),
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertErr || !offer) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Fire-and-forget email notification
  const admin = createAdminClient()
  const { data: ownerAuth } = await admin.auth.admin.getUserById(listing.user_id)
  const { data: fromProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (ownerAuth?.user?.email && fromProfile) {
    notifyOfferReceived(ownerAuth.user.email, {
      fromUsername: fromProfile.username,
      listingTitle: listing.title,
      offerDescription: offerDescription.trim(),
      offerId: offer.id,
    })
  }

  return NextResponse.json({ offerId: offer.id })
}
