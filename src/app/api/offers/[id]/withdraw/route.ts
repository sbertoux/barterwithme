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
    .select('id, from_user_id, status')
    .eq('id', id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (offer.from_user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!['pending', 'countered'].includes(offer.status)) {
    return NextResponse.json({ error: 'Offer cannot be withdrawn in its current state' }, { status: 400 })
  }

  await supabase
    .from('offers')
    .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
