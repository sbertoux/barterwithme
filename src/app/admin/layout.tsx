import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:pb-8">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
          <p className="text-sm text-stone-500 mt-0.5">Flag review, account actions, reported content.</p>
        </div>
        <a href="/" className="text-xs text-stone-400 hover:underline">← Back to site</a>
      </div>
      {children}
    </div>
  )
}
