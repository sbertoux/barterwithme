import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Safety Tips',
  description: 'How to trade safely on BarterWithMe — meeting tips, red flags, and what to do if something feels wrong.',
}

export default function SafetyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:pb-12">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Trading Safely</h1>
      <p className="text-stone-500 mb-8 leading-relaxed">
        Most trades on BarterWithMe happen between honest people and go smoothly.
        These tips help you stay safe during the small number that don&apos;t.
      </p>

      <div className="space-y-6 text-sm text-stone-600 leading-relaxed">

        <Card icon="📍" title="Meet in a public place">
          <p>
            For in-person trades, meet somewhere public and well-lit — a coffee shop, library,
            grocery store parking lot, or police department lobby. Many police departments
            have designated &ldquo;safe exchange zones&rdquo; for exactly this purpose.
          </p>
          <p className="mt-2">
            Don&apos;t invite strangers to your home or meet at an isolated location for an initial trade.
          </p>
        </Card>

        <Card icon="👥" title="Bring someone with you">
          <p>
            Especially for your first trade with someone, consider bringing a friend.
            If that&apos;s not possible, tell someone where you&apos;re going and when you expect to be back.
          </p>
        </Card>

        <Card icon="💬" title="Don't rush to share contact info">
          <p>
            Use the in-app messaging system to get comfortable with the other person before
            sharing your phone number, address, or email. There&apos;s no need to move off-platform
            until you&apos;re ready.
          </p>
        </Card>

        <Card icon="🔍" title="Check their profile first">
          <p>
            Look at a user&apos;s trade count, vouch count, and how long they&apos;ve been a member.
            A brand new account with no vouches isn&apos;t necessarily suspicious — everyone starts
            somewhere — but it&apos;s worth being more cautious and meeting publicly.
          </p>
        </Card>

        <Card icon="🚩" title="Red flags to watch for">
          <ul className="space-y-1.5 mt-1">
            {[
              'Pressure to move off-platform or exchange contact info immediately.',
              'Offers that seem too good to be true.',
              'Vague or evasive answers about what they\'re offering.',
              'Requests for personal financial information.',
              'Someone claiming to be in an emergency and needing a quick trade.',
              'Listings that seem designed to attract vulnerable people.',
            ].map((flag) => (
              <li key={flag} className="flex gap-2">
                <span className="text-red-400 shrink-0">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card icon="🛡️" title="Trust your instincts">
          <p>
            If something feels wrong, it probably is. You never have to complete a trade
            you&apos;re uncomfortable with. Decline, withdraw your offer, and if needed,
            report the listing using the flag button.
          </p>
        </Card>

        <Card icon="📢" title="How to report something suspicious">
          <p>
            Every listing has a &ldquo;Report listing&rdquo; button at the bottom of its page.
            Use it if you see something that violates our guidelines or feels unsafe.
            Reports are reviewed by admins promptly.
          </p>
          <p className="mt-2">
            For serious concerns — especially anything involving exploitation or trafficking —
            contact the National Human Trafficking Hotline directly:
          </p>
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="font-semibold text-red-800">National Human Trafficking Hotline</p>
            <p className="text-red-700 text-base font-bold mt-0.5">1-888-373-7888</p>
            <p className="text-xs text-red-600 mt-0.5">
              Available 24/7 · Text &ldquo;HELP&rdquo; to 233733 ·{' '}
              <a href="https://humantraffickinghotline.org" className="underline" target="_blank" rel="noopener noreferrer">
                humantraffickinghotline.org
              </a>
            </p>
          </div>
        </Card>

        <div className="rounded-xl bg-stone-900 p-6 text-center">
          <p className="text-white font-semibold mb-2">Most trades go great</p>
          <p className="text-stone-400 text-sm mb-4">
            This community is built on mutual respect. The overwhelming majority of members
            are here in good faith. These tips are for the rare exception — not the rule.
          </p>
          <Link href="/browse" className="btn-primary inline-block text-sm">
            Browse listings →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/community-guidelines" className="btn-secondary text-sm text-center">
            Community Guidelines →
          </Link>
          <Link href="/terms" className="btn-secondary text-sm text-center">
            Terms of Service →
          </Link>
        </div>

      </div>
    </article>
  )
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card flex gap-4">
      <span className="shrink-0 text-2xl mt-0.5">{icon}</span>
      <div>
        <h2 className="text-sm font-bold text-stone-800 mb-2">{title}</h2>
        {children}
      </div>
    </div>
  )
}
