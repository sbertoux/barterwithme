import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSetupForm } from './ProfileSetupForm'

export const metadata: Metadata = { title: 'Complete your profile' }

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-md px-4 py-12 pb-24 sm:pb-12">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-3">👋</div>
        <h1 className="text-2xl font-bold text-stone-900">Almost there!</h1>
        <p className="mt-2 text-sm text-stone-500">
          Tell us a bit about yourself. You can update this anytime.
        </p>
      </div>
      <ProfileSetupForm
        userId={user.id}
        initialUsername={profile?.username ?? user.user_metadata?.username ?? ''}
        initialRegion={profile?.region ?? user.user_metadata?.region ?? ''}
        initialBio={profile?.bio ?? ''}
      />
    </div>
  )
}
