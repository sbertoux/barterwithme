import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is 5 MB.` },
      { status: 400 }
    )
  }

  // Extension derived from validated MIME type, never from the original filename
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${EXT[file.type]}`
  const bytes = await file.arrayBuffer()

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('listing-photos')
    .upload(path, bytes, { contentType: file.type, cacheControl: '3600' })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('listing-photos').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
