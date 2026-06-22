import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from './EditProfileForm'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, region')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profile/setup')

  return (
    <div className="mx-auto max-w-lg px-4 py-10 pb-24 sm:pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Edit profile</h1>
        <p className="mt-1 text-sm text-stone-500">Changes appear on your public profile immediately.</p>
      </div>
      <EditProfileForm
        userId={user.id}
        initial={{
          username: profile.username ?? '',
          bio: profile.bio ?? '',
          region: profile.region ?? '',
        }}
      />
    </div>
  )
}
