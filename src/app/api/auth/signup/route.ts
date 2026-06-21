import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signupLimiter } from '@/lib/ratelimit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success } = await signupLimiter.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please wait before trying again.' },
      { status: 429 }
    )
  }

  const { email, password, username, region, termsAcceptedAt } = await request.json()
  if (!email || !password || !username || !region) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barterwithme.org'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { username, region, terms_accepted_at: termsAcceptedAt },
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  return NextResponse.json({ ok: true })
}
