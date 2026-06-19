import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'How to be a good member of the BarterWithMe community — what\'s allowed, what\'s not, and our zero-tolerance policies.',
}

export default function GuidelinesPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:pb-12">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Community Guidelines</h1>
      <p className="text-sm text-stone-400 mb-2">Last updated: June 2026</p>
      <p className="text-stone-500 mb-8 leading-relaxed">
        BarterWithMe works because people treat each other with honesty and respect.
        These guidelines exist to protect that — and to be plain about what will and won&apos;t be tolerated.
      </p>

      <div className="space-y-8 text-sm text-stone-600 leading-relaxed">

        <Section title="✅ What good members do" accent="green">
          <ul className="space-y-2">
            {[
              'List things they actually have or can genuinely offer.',
              'Describe their listings accurately — no misleading details.',
              'Respond to offers in a reasonable time, even if it\'s a decline.',
              'Honor commitments once both parties have agreed.',
              'Use in-app messaging for all communication until they\'re ready to share contact info.',
              'Report suspicious or inappropriate listings using the flag button.',
              'Vouch honestly — only vouch for trades that actually happened.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-green-500 shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="🚫 What's not allowed" accent="red">
          <ul className="space-y-2">
            {[
              'Illegal goods or controlled substances of any kind.',
              'Weapons, firearms, or regulated items.',
              'Misleading listings — describing something as available when it\'s not.',
              'Making offers you have no intention of following through on.',
              'Harassment, threats, or abusive language toward any member.',
              'Hate speech, discrimination, or targeted attacks.',
              'Impersonating another person or organization.',
              'Creating duplicate accounts to game the vouching or trust system.',
              'Any activity designed to exploit vulnerable people.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <p className="font-bold text-red-800 mb-2">⚠️ Zero tolerance: Human trafficking and exploitation</p>
          <p className="text-sm text-red-700 leading-relaxed">
            The use of this platform to facilitate human trafficking, labor exploitation,
            debt bondage, or any form of modern slavery is strictly prohibited and will
            result in immediate permanent suspension and referral to law enforcement.
          </p>
          <p className="mt-3 text-sm text-red-700">
            If you see something suspicious, report it immediately:
          </p>
          <div className="mt-2 rounded-lg bg-red-100 px-4 py-3">
            <p className="font-semibold text-red-900">National Human Trafficking Hotline</p>
            <p className="text-red-800 text-base font-bold mt-0.5">1-888-373-7888</p>
            <p className="text-xs text-red-700 mt-0.5">
              Available 24/7 · Text &ldquo;HELP&rdquo; or &ldquo;INFO&rdquo; to 233733 · <a href="https://humantraffickinghotline.org" className="underline" target="_blank" rel="noopener noreferrer">humantraffickinghotline.org</a>
            </p>
          </div>
        </div>

        <Section title="🔎 How we handle violations" accent="stone">
          <p>
            Reports are reviewed by community admins. Depending on severity:
          </p>
          <ul className="mt-2 space-y-1.5 list-disc list-inside">
            <li>Minor violations (misleading listing, slow response) — warning or listing removal.</li>
            <li>Moderate violations (harassment, fraud attempt) — temporary suspension.</li>
            <li>Serious violations (exploitation, trafficking, repeat fraud) — immediate permanent ban and law enforcement referral.</li>
          </ul>
          <p className="mt-3">
            We aim to be fair, not punitive. If you believe you were suspended in error, you can
            appeal through the in-app reporting system.
          </p>
        </Section>

        <Section title="🤝 On the spirit of barter" accent="brand">
          <p>
            Barter isn&apos;t just a transaction — it&apos;s a relationship. The best trades happen when
            both people feel good about what they gave and what they received. You don&apos;t have
            to be perfectly equal in every exchange. Sometimes helping someone out is worth more
            than getting something back.
          </p>
          <p>
            Be honest. Be fair. Be a neighbor.
          </p>
        </Section>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/safety" className="btn-secondary text-sm text-center">
            Safety tips →
          </Link>
          <Link href="/terms" className="btn-secondary text-sm text-center">
            Terms of Service →
          </Link>
        </div>

      </div>
    </article>
  )
}

function Section({
  title, children, accent,
}: {
  title: string; children: React.ReactNode; accent: 'green' | 'red' | 'stone' | 'brand'
}) {
  const border = {
    green: 'border-green-200',
    red: 'border-red-200',
    stone: 'border-stone-200',
    brand: 'border-brand-200',
  }[accent]

  return (
    <section className={`rounded-xl border ${border} px-5 py-4`}>
      <h2 className="text-base font-bold text-stone-800 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
