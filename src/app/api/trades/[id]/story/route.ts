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

  const { noteText } = await request.json()

  const { data: trade } = await supabase
    .from('trades')
    .select('id, completed_at, listing_id, offers(from_user_id, offer_description)')
    .eq('id', id)
    .single()

  if (!trade || !trade.completed_at) {
    return NextResponse.json({ error: 'Trade not completed' }, { status: 400 })
  }

  const [{ data: listerId }, { data: listingData }] = await Promise.all([
    supabase.rpc('get_listing_owner', { lid: trade.listing_id }),
    supabase.from('listings').select('title, region').eq('id', trade.listing_id).maybeSingle(),
  ])

  const offer = trade.offers as unknown as { from_user_id: string; offer_description: string }

  if (user.id !== listerId && user.id !== offer.from_user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tradeSummary = listingData?.title
    ? `${offer.offer_description} for "${listingData.title}"`
    : offer.offer_description

  const { data: story, error } = await supabase
    .from('trade_stories')
    .insert({
      trade_id: id,
      trade_summary: tradeSummary,
      story_text: noteText?.trim() || null,
      region: listingData?.region ?? '',
      is_public: true,
      user_id: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ storyId: story.id })
}
