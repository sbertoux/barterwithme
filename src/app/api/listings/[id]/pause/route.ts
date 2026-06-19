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

  const { paused } = await request.json() as { paused: boolean }
  if (typeof paused !== 'boolean') {
    return NextResponse.json({ error: 'paused must be a boolean' }, { status: 400 })
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('listings')
    .update({ is_paused: paused })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, is_paused: paused })
}
