import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support BarterWithMe',
  description: 'BarterWithMe is community-funded. Help keep the platform running.',
}

export default function DonatePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:pb-12">
      <div className="mb-10 text-center">
        <p className="text-4xl mb-3">🤝</p>
        <h1 className="text-3xl font-bold text-stone-900">Support the project</h1>
        <p className="mt-3 text-stone-500 max-w-md mx-auto">
          BarterWithMe is free to use, runs no ads, and sells no data.
          It&apos;s kept alive entirely by voluntary community contributions.
        </p>
      </div>

      {/* Cost breakdown */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">What it costs to run</h2>
        <div className="space-y-3">
          {[
            { item: 'Database (Supabase)', cost: '~$25/mo', note: 'Stores all listings, offers, and messages' },
            { item: 'Hosting (Vercel)', cost: '~$20/mo', note: 'Serves the website globally' },
            { item: 'Email (Resend)', cost: '~$10/mo', note: 'Offer and trade notifications' },
            { item: 'Domain', cost: '~$15/yr', note: 'barterwithme.org' },
          ].map(({ item, cost, note }) => (
            <div key={item} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800">{item}</p>
                <p className="text-xs text-stone-400">{note}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-stone-600">{cost}</span>
            </div>
          ))}
          <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-700">Total</p>
            <span className="text-sm font-bold text-stone-900">~$70/mo</span>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <div className="card mb-6 bg-stone-50 border-stone-200">
        <p className="text-sm text-stone-700 leading-relaxed">
          This platform is run at cost. No one is making a profit. If enough community members
          contribute even a small amount, it stays free for everyone — forever. If you&apos;ve
          made a trade here, or just believe in what this is trying to do, consider contributing.
        </p>
      </div>

      {/* Contribution options */}
      <div className="space-y-3 mb-8">
        <a
          href="https://ko-fi.com/barterwithme"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full text-center block py-3.5"
        >
          Contribute on Ko-fi →
        </a>
        <a
          href="https://opencollective.com/barterwithme"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full text-center block py-3"
        >
          Open Collective (recurring donations)
        </a>
      </div>

      <div className="rounded-xl bg-stone-900 p-6 text-center">
        <p className="text-white font-semibold mb-1">Open source forever</p>
        <p className="text-stone-400 text-sm mb-4">
          Even if this instance shuts down, the code stays public.
          Anyone can run their own BarterWithMe community.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://github.com/sbertoux/barterwithme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-300 text-sm underline hover:text-brand-200"
          >
            View the source code →
          </a>
          <span className="hidden sm:inline text-stone-600">·</span>
          <Link href="/why" className="text-stone-400 text-sm underline hover:text-stone-300">
            Read why we built this →
          </Link>
        </div>
      </div>
    </div>
  )
}
