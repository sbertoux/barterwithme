import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyTradeConfirmed } from '@/lib/email'

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
    .select('id, confirmed_by_lister, confirmed_by_trader, completed_at, offer_id, listing_id, offers(from_user_id)')
    .eq('id', id)
    .single()

  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (trade.completed_at) return NextResponse.json({ error: 'Already completed' }, { status: 400 })

  const { data: listerId } = await supabase.rpc('get_listing_owner', { lid: trade.listing_id })
  const offer = trade.offers as unknown as { from_user_id: string }

  const isLister = user.id === listerId
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

  // Notify the other party — fire-and-forget
  const otherUserId = isLister ? offer.from_user_id : listerId
  if (otherUserId) {
    const admin = createAdminClient()
    const [{ data: otherAuth }, { data: myProfile }] = await Promise.all([
      admin.auth.admin.getUserById(otherUserId),
      supabase.from('profiles').select('username').eq('id', user.id).single(),
    ])
    const offerId = trade.offer_id
    if (otherAuth?.user?.email && myProfile) {
      notifyTradeConfirmed(otherAuth.user.email, {
        fromUsername: myProfile.username,
        offerId,
        isComplete: !!updated?.completed_at,
      })
    }
  }

  return NextResponse.json(updated)
}
