import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BarterWithMe Terms of Service — rules, prohibited conduct, and liability limitations.',
}

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:pb-12">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-stone-400 mb-8">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-stone-600 leading-relaxed">

        <Section title="1. Who We Are">
          <p>
            BarterWithMe (&ldquo;the Platform&rdquo;) is a community-owned, open-source barter marketplace
            that allows users to list goods and services and trade them directly with other users.
            The Platform is operated at cost and funded by voluntary community contributions.
            It has no investors, runs no advertisements, and sells no user data.
          </p>
        </Section>

        <Section title="2. Acceptance of Terms">
          <p>
            By creating an account, you confirm that you have read, understood, and agree to these
            Terms of Service and our Community Guidelines. Your acceptance is timestamped at account
            creation. If you do not agree, do not use the Platform.
          </p>
          <p>
            You must be at least 18 years old to use BarterWithMe. By registering you represent
            that you meet this requirement.
          </p>
        </Section>

        <Section title="3. Platform Rules">
          <ul className="list-disc list-inside space-y-1.5">
            <li>You must maintain at least one active listing to make offers on other listings.</li>
            <li>All trade negotiations must take place through the in-app messaging system.</li>
            <li>Listings must accurately describe what is being offered.</li>
            <li>You may only list items and services that you actually possess or can deliver.</li>
            <li>One account per person. Creating duplicate accounts may result in suspension.</li>
          </ul>
        </Section>

        <Section title="4. Prohibited Conduct">
          <p>The following are strictly prohibited and will result in immediate suspension:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>Listing, offering, or trading any illegal goods or controlled substances.</li>
            <li>Human trafficking, labor exploitation, or any form of modern slavery.</li>
            <li>Fraud, misrepresentation, or intentional deception of any kind.</li>
            <li>Harassment, threats, hate speech, or abusive conduct toward other users.</li>
            <li>Listing weapons, firearms, or items regulated under federal or state law.</li>
            <li>Any activity that violates applicable local, state, or federal law.</li>
            <li>Attempting to circumvent the in-app communication system to avoid accountability.</li>
            <li>Impersonating another person or creating a misleading profile.</li>
          </ul>
        </Section>

        <Section title="5. Off-Platform Activity">
          <p>
            Trades ultimately happen in the real world, between real people. Once you exchange
            contact information and arrange a trade outside the Platform, BarterWithMe has no
            visibility into, control over, or responsibility for what happens.
          </p>
          <p>
            <strong className="text-stone-700">You meet and trade at your own risk.</strong> We
            strongly recommend following our Safety Guidelines, meeting in public places, and
            trusting your instincts. BarterWithMe is not liable for any harm, loss, theft, injury,
            or dispute arising from in-person trade activity.
          </p>
        </Section>

        <Section title="6. Privacy and Data">
          <p>
            We collect only what is necessary to operate the Platform: your username, email address,
            and general region (derived from your zip code — your zip itself is never stored).
            We do not sell, share, or monetize your data. Your email is used only for account
            verification and trade notifications.
          </p>
          <p>
            The Platform is open source. You can review exactly what data we store and how by
            reading the source code on GitHub.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            Content you post (listing descriptions, offer text, trade stories) remains yours.
            By posting it, you grant BarterWithMe a limited, non-exclusive license to display
            it to other users for the purpose of facilitating trades. We do not claim ownership
            of your content and will not use it for any other purpose.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            BarterWithMe is provided &ldquo;as is&rdquo; without warranty of any kind. To the
            maximum extent permitted by law, BarterWithMe and its operators are not liable for:
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>The accuracy, quality, safety, or legality of any listing.</li>
            <li>The ability of any user to complete a trade.</li>
            <li>Any loss, damage, or harm arising from trades or in-person meetings.</li>
            <li>Service interruptions, data loss, or platform unavailability.</li>
          </ul>
          <p className="mt-2">
            Your use of this Platform is at your sole risk.
          </p>
        </Section>

        <Section title="9. Account Termination">
          <p>
            We reserve the right to suspend or terminate any account that violates these Terms,
            without prior notice. Violations of Section 4 (Prohibited Conduct) will result in
            immediate permanent suspension. Appeals may be submitted via the in-app report system.
          </p>
          <p>
            You may delete your account at any time. Deletion removes your profile and listings.
            Trade history records required for community accountability may be retained in
            anonymized form.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Material changes will be communicated
            via email or an in-app notice. Continued use after changes constitutes acceptance.
            The current version is always available at /terms.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Florida, without regard to
            conflict of law principles. Any disputes shall be resolved in the courts of
            Manatee County, Florida.
          </p>
        </Section>

        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-4 text-xs text-stone-500">
          <strong className="text-stone-600">Questions?</strong> Use the in-app reporting system
          or reach us through the project&apos;s GitHub repository.
        </div>

      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-stone-800 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
