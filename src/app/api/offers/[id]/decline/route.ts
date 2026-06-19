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

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, listing_id')
    .eq('id', id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: listerId } = await supabase.rpc('get_listing_owner', { lid: offer.listing_id })
  if (listerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!['pending', 'countered'].includes(offer.status)) {
    return NextResponse.json({ error: 'Offer cannot be declined in its current state' }, { status: 400 })
  }

  await supabase
    .from('offers')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
