import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOfferAccepted } from '@/lib/email'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, listing_id, from_user_id, status, listings(id, title, user_id, listing_type)')
    .eq('id', id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const listing = offer.listings as unknown as { id: string; title: string; user_id: string; listing_type: string }

  if (listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!['pending', 'countered'].includes(offer.status)) {
    return NextResponse.json({ error: 'Offer cannot be accepted in its current state' }, { status: 400 })
  }

  // Accept this offer
  await supabase
    .from('offers')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', id)

  // Create trade record
  const { data: trade } = await supabase
    .from('trades')
    .insert({ listing_id: offer.listing_id, offer_id: id })
    .select('id')
    .single()

  // Auto-decline all other pending/countered offers on this listing
  await supabase
    .from('offers')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('listing_id', offer.listing_id)
    .neq('id', id)
    .in('status', ['pending', 'countered'])

  // Notify the offer maker
  const admin = createAdminClient()
  const { data: traderAuth } = await admin.auth.admin.getUserById(offer.from_user_id)
  if (traderAuth?.user?.email) {
    notifyOfferAccepted(traderAuth.user.email, { listingTitle: listing.title, offerId: id })
  }

  return NextResponse.json({ offerId: id, tradeId: trade?.id })
}
