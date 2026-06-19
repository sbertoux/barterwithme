import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function handler(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}

export { handler as GET, handler as POST }
