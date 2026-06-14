import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewMessage } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { offerId, content } = await request.json()
  if (!offerId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: offer } = await supabase
    .from('offers')
    .select('id, from_user_id, status, listing_id, listings(user_id, title)')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const listing = offer.listings as unknown as { user_id: string; title: string }
  const isLister = user.id === listing.user_id
  const isTrader = user.id === offer.from_user_id

  if (!isLister && !isTrader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (['declined', 'withdrawn'].includes(offer.status)) {
    return NextResponse.json({ error: 'This offer is closed' }, { status: 400 })
  }

  const toUserId = isLister ? offer.from_user_id : listing.user_id

  // Lister messaging on a pending offer moves it to 'countered'
  if (isLister && offer.status === 'pending') {
    await supabase
      .from('offers')
      .update({ status: 'countered' })
      .eq('id', offerId)
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ offer_id: offerId, from_user_id: user.id, to_user_id: toUserId, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget email
  const admin = createAdminClient()
  const [{ data: toAuth }, { data: fromProfile }] = await Promise.all([
    admin.auth.admin.getUserById(toUserId),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
  ])
  if (toAuth?.user?.email && fromProfile) {
    notifyNewMessage(toAuth.user.email, {
      fromUsername: fromProfile.username,
      offerId,
      listingTitle: listing.title,
    })
  }

  return NextResponse.json(message)
}
