import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactInfo } = await request.json()
  if (!contactInfo?.trim()) {
    return NextResponse.json({ error: 'Contact info required' }, { status: 400 })
  }

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

  const column = isLister ? 'lister_contact' : 'trader_contact'
  const { error } = await supabase
    .from('offers')
    .update({ [column]: contactInfo.trim() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, column, contactInfo: contactInfo.trim() })
}
