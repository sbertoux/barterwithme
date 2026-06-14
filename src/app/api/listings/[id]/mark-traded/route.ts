import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify ownership before updating
  const { data: listing } = await supabase
    .from('listings')
    .select('user_id, listing_type, status')
    .eq('id', id)
    .single()

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (listing.status !== 'active') {
    return NextResponse.redirect(new URL(`/listings/${id}`, request.url))
  }

  const now = new Date().toISOString()
  const graceEndsAt =
    listing.listing_type === 'item'
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : null

  await supabase
    .from('listings')
    .update({ status: 'traded', traded_at: now, grace_ends_at: graceEndsAt, updated_at: now })
    .eq('id', id)

  return NextResponse.redirect(new URL(`/listings/${id}`, request.url))
}
