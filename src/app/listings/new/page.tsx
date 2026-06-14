import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewListingForm } from './NewListingForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'List Something' }

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?next=/listings/new')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, region, account_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/profile/setup')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">List something</h1>
        <p className="mt-1 text-sm text-stone-500">
          Your listing shows up in <strong>{profile.region}</strong>.
        </p>
      </div>
      <NewListingForm userId={user.id} region={profile.region} />
    </div>
  )
}
