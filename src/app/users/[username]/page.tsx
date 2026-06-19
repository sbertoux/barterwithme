import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}` }
}

const TYPE_LABEL: Record<string, string> = {
  item: 'Item',
  service_onetime: 'One-time service',
  service_recurring: 'Ongoing service',
  recurring_goods: 'Recurring goods',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, bio, region, trade_count, vouch_count, account_status, is_verified')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  if (profile.account_status === 'dormant') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-3xl mb-3">💤</p>
        <p className="font-semibold text-stone-700">This account is dormant</p>
        <p className="mt-2 text-sm text-stone-400">@{username} hasn't been active recently.</p>
      </div>
    )
  }

  if (profile.account_status === 'suspended') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-3xl mb-3">🚫</p>
        <p className="font-semibold text-stone-700">This account has been suspended</p>
        <p className="mt-2 text-sm text-stone-400">Pending admin review.</p>
      </div>
    )
  }

  const [{ data: vouches }, { data: listings }] = await Promise.all([
    supabase
      .from('vouches')
      .select('id, note, created_at')
      .eq('to_user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('listings')
      .select('id, title, listing_type, region')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .eq('is_paused', false)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const isTrusted = profile.vouch_count > 0
  const isNew = profile.trade_count === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:pb-8">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">@{profile.username}</h1>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 mt-0.5">{profile.region}</p>
            {profile.bio && (
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
            {isTrusted && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Trusted member
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                New member
              </span>
            )}
            <span className="text-xs text-stone-400">
              {profile.trade_count} {profile.trade_count === 1 ? 'trade' : 'trades'}
              {profile.vouch_count > 0 && ` · ${profile.vouch_count} ${profile.vouch_count === 1 ? 'vouch' : 'vouches'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Vouches */}
      {(vouches?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">
            Community vouches ({vouches!.length})
          </h2>
          <div className="space-y-2">
            {(vouches ?? []).map((v) => (
              <div key={v.id} className="card bg-stone-50">
                {v.note ? (
                  <p className="text-sm text-stone-700">"{v.note}"</p>
                ) : (
                  <p className="text-sm italic text-stone-400">Vouched — no note left.</p>
                )}
                <p className="mt-1 text-xs text-stone-400">Verified trade · {fmt(v.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active listings */}
      {(listings?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">Active listings</h2>
          <div className="space-y-2">
            {(listings ?? []).map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="card flex items-center justify-between hover:border-brand-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">{l.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{TYPE_LABEL[l.listing_type] ?? l.listing_type} · {l.region}</p>
                </div>
                <span className="shrink-0 text-xs text-brand-600">View →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(vouches?.length ?? 0) === 0 && (listings?.length ?? 0) === 0 && (
        <div className="card py-10 text-center">
          <p className="text-sm text-stone-400">No vouches or active listings yet.</p>
        </div>
      )}
    </div>
  )
}
