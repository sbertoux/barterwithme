import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Browse Listings' }

export default function BrowsePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:pb-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Browse listings</h1>
      <div className="card text-center py-16 text-stone-400">
        <p className="text-lg">Listings coming in Phase 2.</p>
        <p className="text-sm mt-2">The platform is being built — check back soon.</p>
      </div>
    </div>
  )
}
