import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Trade Stories',
  description: 'Real trades from the BarterWithMe community — no names, just the story.',
}

export default async function StoriesPage() {
  const supabase = await createClient()

  const { data: stories } = await supabase
    .from('trade_stories')
    .select('id, story_text, region, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-24 sm:pb-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-stone-900">Trade Stories</h1>
        <p className="mt-2 text-stone-500 max-w-md mx-auto">
          Real trades from the community. No names — just what was exchanged and where.
          Every story started with someone having something to offer.
        </p>
      </div>

      {!stories || stories.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-semibold text-stone-700">No stories yet</p>
          <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
            Stories appear here after trades are confirmed. Make a trade and share yours.
          </p>
          <Link href="/browse" className="btn-primary mt-6 inline-block text-sm">
            Browse listings →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div key={story.id} className="card flex items-start gap-4">
              <span className="mt-0.5 shrink-0 text-2xl">🤝</span>
              <div>
                <p className="font-medium text-stone-800 leading-snug">{story.story_text}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {story.region} · {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-stone-900 p-6 text-center">
        <p className="font-semibold text-white mb-1">Your turn</p>
        <p className="text-stone-400 text-sm mb-4">Add your listing and find your first trade.</p>
        <Link href="/listings/new" className="btn-primary inline-block">
          List something →
        </Link>
      </div>
    </div>
  )
}
