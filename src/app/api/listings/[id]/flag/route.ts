import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flagLimiter } from '@/lib/ratelimit'

const VALID_REASONS = ['inappropriate_content', 'spam', 'misleading', 'other']

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

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (listing.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot flag own listing' }, { status: 400 })
  }

  const { error } = await supabase
    .from('listing_flags')
    .insert({
      from_user_id: user.id,
      listing_id: id,
      reason,
      details: details?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_flagged' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
