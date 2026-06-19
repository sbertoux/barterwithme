import { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin' }

const REASON_LABELS: Record<string, string> = {
  not_as_described: 'Not as described',
  no_show: 'No-show / ghosted',
  inappropriate_behavior: 'Inappropriate behavior',
  suspected_fraud: 'Suspected fraud',
  other: 'Other',
  inappropriate_content: 'Inappropriate content',
  spam: 'Spam',
  misleading: 'Misleading',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Pending user flags
  const { data: userFlags } = await supabase
    .from('flags')
    .select('id, reason, details, severity, created_at, from_user_id, to_user_id, trade_id')
    .eq('reviewed', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })

  // Pending listing flags
  const { data: listingFlags } = await supabase
    .from('listing_flags')
    .select('id, reason, details, created_at, from_user_id, listing_id, listings(title)')
    .eq('reviewed', false)
    .order('created_at', { ascending: false })

  // Suspended accounts
  const { data: suspendedAccounts } = await supabase
    .from('profiles')
    .select('id, username, region, trade_count, created_at')
    .eq('account_status', 'suspended')
    .order('created_at', { ascending: false })

  // Batch-load usernames for flags
  const allUserIds = [
    ...new Set([
      ...(userFlags ?? []).flatMap(f => [f.from_user_id, f.to_user_id]),
      ...(listingFlags ?? []).map(f => f.from_user_id),
    ])
  ]
  const { data: profileRows } = allUserIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', allUserIds)
    : { data: [] }
  const pm = Object.fromEntries((profileRows ?? []).map(p => [p.id, p.username]))

  // ── Server actions ─────────────────────────────────────────────────────────

  async function reviewUserFlag(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const s = await createClient()
    await s.from('flags').update({ reviewed: true }).eq('id', id)
    revalidatePath('/admin')
  }

  async function reviewListingFlag(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const s = await createClient()
    await s.from('listing_flags').update({ reviewed: true }).eq('id', id)
    revalidatePath('/admin')
  }

  async function reactivateAccount(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const s = await createClient()
    await s.from('profiles').update({ account_status: 'active' }).eq('id', id)
    revalidatePath('/admin')
  }

  async function suspendAccount(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const s = await createClient()
    await s.from('profiles').update({ account_status: 'suspended' }).eq('id', id)
    revalidatePath('/admin')
  }

  return (
    <div className="space-y-10">

      {/* User flags */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-stone-800">
          User flags — pending ({userFlags?.length ?? 0})
        </h2>
        {!userFlags?.length ? (
          <p className="card py-6 text-center text-sm text-stone-400">No pending user flags.</p>
        ) : (
          <div className="space-y-3">
            {(userFlags ?? []).map((f) => (
              <div
                key={f.id}
                className={`card flex items-start justify-between gap-3 ${f.severity === 'severe' ? 'border-red-200 bg-red-50' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {f.severity === 'severe' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">Severe</span>
                    )}
                    <span className="text-sm font-medium text-stone-800">{REASON_LABELS[f.reason] ?? f.reason}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    @{pm[f.from_user_id] ?? '?'} flagged @{pm[f.to_user_id] ?? '?'}
                  </p>
                  {f.details && (
                    <p className="mt-1 text-xs italic text-stone-600">"{f.details}"</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-400">
                    <span>{fmt(f.created_at)}</span>
                    {f.trade_id && (
                      <span>Trade: {f.trade_id.slice(0, 8)}</span>
                    )}
                    <a href={`/users/${pm[f.to_user_id]}`} className="text-brand-600 hover:underline" target="_blank">
                      View profile →
                    </a>
                  </div>
                </div>
                <form action={reviewUserFlag} className="shrink-0">
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="btn-secondary py-1.5 px-3 text-xs">
                    Mark reviewed
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Listing flags */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-stone-800">
          Listing reports — pending ({listingFlags?.length ?? 0})
        </h2>
        {!listingFlags?.length ? (
          <p className="card py-6 text-center text-sm text-stone-400">No pending listing reports.</p>
        ) : (
          <div className="space-y-3">
            {(listingFlags ?? []).map((f) => {
              const listing = f.listings as unknown as { title: string } | null
              return (
                <div key={f.id} className="card flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{listing?.title ?? f.listing_id}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{REASON_LABELS[f.reason] ?? f.reason}</p>
                    {f.details && (
                      <p className="mt-1 text-xs italic text-stone-600">"{f.details}"</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-400">
                      <span>@{pm[f.from_user_id] ?? f.from_user_id.slice(0, 8)}</span>
                      <span>{fmt(f.created_at)}</span>
                      <a href={`/listings/${f.listing_id}`} className="text-brand-600 hover:underline" target="_blank">
                        View listing →
                      </a>
                    </div>
                  </div>
                  <form action={reviewListingFlag} className="shrink-0">
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="btn-secondary py-1.5 px-3 text-xs">
                      Mark reviewed
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Suspended accounts */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-stone-800">
          Suspended accounts ({suspendedAccounts?.length ?? 0})
        </h2>
        {!suspendedAccounts?.length ? (
          <p className="card py-6 text-center text-sm text-stone-400">No suspended accounts.</p>
        ) : (
          <div className="space-y-3">
            {(suspendedAccounts ?? []).map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-800">@{p.username}</p>
                  <p className="text-xs text-stone-400">
                    {p.region} · {p.trade_count} trades · joined {fmt(p.created_at)}
                  </p>
                </div>
                <form action={reactivateAccount} className="shrink-0">
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="btn-primary py-1.5 px-3 text-xs">
                    Reactivate
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick suspend (for manual action from profile URL) */}
      <section className="border-t border-stone-200 pt-8">
        <h2 className="mb-4 text-base font-semibold text-stone-800">Manual account action</h2>
        <form action={suspendAccount} className="flex gap-2 max-w-sm">
          <input
            type="text"
            name="id"
            placeholder="User UUID"
            className="input flex-1 text-sm font-mono"
          />
          <button type="submit" className="btn-secondary py-2 px-4 text-xs text-red-500 border-red-200">
            Suspend
          </button>
        </form>
      </section>
    </div>
  )
}
