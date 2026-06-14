import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Offers' }

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/offers')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:pb-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Offers</h1>
      <p className="text-sm text-stone-500 mb-8">
        Incoming and outgoing trade offers will appear here.
      </p>
      <div className="card text-center py-16">
        <p className="text-4xl mb-3">💬</p>
        <p className="font-semibold text-stone-700">Coming in Phase 3</p>
        <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
          The full offer and messaging system is being built. Browse listings and check back soon.
        </p>
      </div>
    </div>
  )
}
