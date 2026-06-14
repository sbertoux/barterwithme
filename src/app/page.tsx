import Link from 'next/link'

const CATEGORIES = [
  { name: 'Food & Garden', icon: '🌱', href: '/browse?category=food-garden' },
  { name: 'Skills & Labor', icon: '🔨', href: '/browse?category=skills-labor' },
  { name: 'Household & Tools', icon: '🏠', href: '/browse?category=household-tools' },
  { name: 'Animals & Livestock', icon: '🐄', href: '/browse?category=animals-livestock' },
  { name: 'Professional Services', icon: '💼', href: '/browse?category=professional-services' },
  { name: 'Handmade & Crafts', icon: '🧶', href: '/browse?category=handmade-crafts' },
  { name: 'Transportation', icon: '🚛', href: '/browse?category=transportation' },
  { name: 'Valuables & Collectibles', icon: '✨', href: '/browse?category=valuables-collectibles' },
  { name: 'Other', icon: '📦', href: '/browse?category=other' },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 sm:pb-8">
      {/* Hero */}
      <section className="py-12 text-center sm:py-16">
        <h1 className="text-4xl font-bold text-stone-900 sm:text-5xl">
          Trade what you have.<br />
          <span className="text-brand-500">Get what you need.</span>
        </h1>
        <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
          No money. No middlemen. Just people trading directly — the way neighbors always have.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary text-base py-3.5 px-7">
            List what you have →
          </Link>
          <Link href="/browse" className="btn-secondary text-base py-3.5 px-7">
            Browse listings
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-4">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="card flex items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-stone-700 group-hover:text-brand-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-stone-800 mb-6">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'List what you have', body: 'Post goods, skills, or recurring items you can offer. Be specific about what you\'re open to receiving.' },
            { step: '2', title: 'Make an offer', body: 'Find something you want. Describe what you\'ll trade for it. No photos required — just a clear offer.' },
            { step: '3', title: 'Connect and trade', body: 'If they accept, message to arrange the details. The trade happens wherever works for both of you.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {step}
              </div>
              <h3 className="font-semibold text-stone-800">{title}</h3>
              <p className="mt-1 text-sm text-stone-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mt-12 card bg-stone-900 border-stone-800 text-white">
        <p className="text-sm text-stone-400 uppercase tracking-wide font-medium">Privacy first</p>
        <h2 className="mt-1 text-xl font-bold">Your data stays yours.</h2>
        <p className="mt-2 text-stone-300 text-sm">
          We only store your region — never your exact location. No ads, no data sales, no corporate oversight.
          Phone and email verified for trust, then that's it.{' '}
          <Link href="/why" className="underline text-brand-300 hover:text-brand-200">
            Read why we built this →
          </Link>
        </p>
      </section>
    </div>
  )
}
