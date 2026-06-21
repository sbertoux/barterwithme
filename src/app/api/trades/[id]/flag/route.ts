import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flagLimiter } from '@/lib/ratelimit'

const VALID_REASONS = ['not_as_described', 'no_show', 'inappropriate_behavior', 'suspected_fraud', 'other']
const SEVERE_REASONS = ['suspected_fraud', 'inappropriate_behavior']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success } = await flagLimiter.limit(user.id)
  if (!success) return NextResponse.json({ error: 'Too many reports. Try again tomorrow.' }, { status: 429 })

  const { reason, details } = await request.json()

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const { data: trade } = await supabase
    .from('trades')
    .select('id, completed_at, listing_id, offer_id, offers(from_user_id)')
    .eq('id', id)
    .single()

  if (!trade || !trade.completed_at) {
    return NextResponse.json({ error: 'Trade not completed' }, { status: 400 })
  }

  const { data: listerId } = await supabase.rpc('get_listing_owner', { lid: trade.listing_id })
  const offer = trade.offers as unknown as { from_user_id: string }
  const isLister = user.id === listerId
  const isTrader = user.id === offer.from_user_id

  if (!isLister && !isTrader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const toUserId = isLister ? offer.from_user_id : listerId
  const severity = SEVERE_REASONS.includes(reason) ? 'severe' : 'standard'

  const { error } = await supabase
    .from('flags')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      trade_id: id,
      reason,
      details: details?.trim() || null,
      severity,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_flagged' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
