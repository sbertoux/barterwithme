import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, listing_type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!profile) redirect('/profile/setup')

  const activeListings = listings?.filter((l) => l.status === 'active') ?? []
  const tradedListings = listings?.filter((l) => l.status === 'traded') ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:pb-8">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">@{profile.username}</h1>
            <p className="text-sm text-stone-500 mt-0.5">{profile.region}</p>
            {profile.bio && (
              <p className="mt-3 text-sm text-stone-600">{profile.bio}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Verified
            </span>
            {profile.trade_count > 0 && (
              <span className="text-xs text-stone-400">{profile.trade_count} trades</span>
            )}
            {profile.vouch_count > 0 && (
              <span className="text-xs text-stone-400">{profile.vouch_count} vouches</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/profile/edit" className="btn-secondary text-xs py-2 px-3">
            Edit profile
          </Link>
          <Link href="/listings/new" className="btn-primary text-xs py-2 px-3">
            + New listing
          </Link>
        </div>
      </div>

      {/* Active Listings */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">
          Active listings ({activeListings.length})
        </h2>
        {activeListings.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-stone-400 text-sm">No active listings.</p>
            <Link href="/listings/new" className="btn-primary mt-4 inline-block text-sm">
              Add your first listing →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="card flex items-center justify-between hover:border-brand-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-stone-800 text-sm">{listing.title}</p>
                  <p className="text-xs text-stone-400 capitalize mt-0.5">{listing.listing_type}</p>
                </div>
                <span className="text-xs text-green-600 font-medium">Active →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Traded */}
      {tradedListings.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-stone-700 mb-3">
            Completed trades ({tradedListings.length})
          </h2>
          <div className="space-y-2">
            {tradedListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="card flex items-center justify-between opacity-70"
              >
                <p className="text-sm text-stone-600">{listing.title}</p>
                <span className="text-xs text-stone-400">Traded</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sign out */}
      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className="w-full text-sm text-stone-400 hover:text-stone-600 py-2"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
