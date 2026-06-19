import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offer } = await supabase
    .from('offers')
    .select('id, from_user_id, listing_id')
    .eq('id', id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: listerId } = await supabase.rpc('get_listing_owner', { lid: offer.listing_id })
  const isLister = user.id === listerId
  const isTrader = user.id === offer.from_user_id
  if (!isLister && !isTrader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date().toISOString()

  await Promise.all([
    // Mark all messages addressed to this user in this thread as read
    supabase
      .from('messages')
      .update({ read_at: now })
      .eq('offer_id', id)
      .eq('to_user_id', user.id)
      .is('read_at', null),

    // Offer-maker: stamp last-seen so unseen-status badge clears
    ...(isTrader
      ? [supabase.from('offers').update({ from_user_last_seen_at: now }).eq('id', id)]
      : []),
  ])

  return NextResponse.json({ ok: true })
}
