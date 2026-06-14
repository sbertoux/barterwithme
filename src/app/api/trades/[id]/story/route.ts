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

  const { storyText } = await request.json()
  if (!storyText?.trim()) return NextResponse.json({ error: 'Story text required' }, { status: 400 })

  const { data: trade } = await supabase
    .from('trades')
    .select('id, completed_at, listing_id, listings(user_id, region), offers(from_user_id)')
    .eq('id', id)
    .single()

  if (!trade || !trade.completed_at) {
    return NextResponse.json({ error: 'Trade not completed' }, { status: 400 })
  }

  const listing = trade.listings as unknown as { user_id: string; region: string }
  const offer = trade.offers as unknown as { from_user_id: string }

  if (user.id !== listing.user_id && user.id !== offer.from_user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: story, error } = await supabase
    .from('trade_stories')
    .insert({
      trade_id: id,
      story_text: storyText.trim(),
      region: listing.region,
      is_public: true,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ storyId: story.id })
}
