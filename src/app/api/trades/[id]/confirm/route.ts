import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trade } = await supabase
    .from('trades')
    .select('id, confirmed_by_lister, confirmed_by_trader, completed_at, offer_id, listing_id, listings(user_id), offers(from_user_id)')
    .eq('id', id)
    .single()

  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (trade.completed_at) return NextResponse.json({ error: 'Already completed' }, { status: 400 })

  const listing = trade.listings as unknown as { user_id: string }
  const offer = trade.offers as unknown as { from_user_id: string }

  const isLister = user.id === listing.user_id
  const isTrader = user.id === offer.from_user_id
  if (!isLister && !isTrader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const update = isLister
    ? { confirmed_by_lister: true }
    : { confirmed_by_trader: true }

  // DB trigger (on_trade_confirmed) fires on update — handles completion, listing status, trade counts
  const { data: updated, error } = await supabase
    .from('trades')
    .update(update)
    .eq('id', id)
    .select('id, confirmed_by_lister, confirmed_by_trader, completed_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(updated)
}
