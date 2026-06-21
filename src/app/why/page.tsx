import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why BarterWithMe Exists',
  description: 'A privacy-first barter platform built for people who believe in trading directly — without money, surveillance, or corporate oversight.',
}

export default function WhyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:pb-12 prose prose-stone prose-sm sm:prose-base">
      <h1 className="text-3xl font-bold text-stone-900 not-prose mb-2">Why BarterWithMe Exists</h1>
      <hr className="not-prose border-stone-200 mb-8" />

      <p className="text-lg text-stone-600 italic not-prose mb-8">
        A kid mows a neighbor's lawn. She brings out homemade cookies. Neither of them worries whether it was a fair trade. They just took care of each other — the way neighbors do.
      </p>
      <p className="text-stone-500 italic not-prose mb-12">That's the kind of community BarterWithMe is built for.</p>

      <Section title="The way we exchange value is changing — and most people didn't get a vote.">
        <p>
          Not every trade is about equal value. Sometimes a teenager learns the dignity of honest work. Sometimes an elderly woman gets to feel useful instead of helpless. Sometimes cookies are worth more than money because they come with a human connection that money can't buy.
        </p>
        <p>
          BarterWithMe exists because we believe that kind of exchange matters — and because the system people used to rely on for it is changing in ways that deserve attention.
        </p>
        <p>
          For most of human history, trade was simple. You had something someone else needed. They had something you needed. You worked it out. No middleman, no fees, no permission required.
        </p>
        <p>
          Then came currency. Then banks. Then credit cards and payment processors and digital wallets. Each step added convenience — and added a layer between you and the person you were trading with.
        </p>
        <p>Now something bigger is coming.</p>
      </Section>

      <Section title="Programmable Money">
        <p>
          Governments around the world are building Central Bank Digital Currencies — CBDCs. Over 130 countries are in active development or testing right now. The pitch is convenience and efficiency. The reality is something different.
        </p>
        <p>
          Programmable money means the currency itself can have rules built in. Rules about what you can buy. Where you can spend it. When it expires. Whether you're allowed to use it at all.
        </p>
        <p>
          That's not a conspiracy theory. That's the stated design goal — documented by the institutions building these systems.
        </p>
        <p className="font-semibold text-stone-800">When your money can be turned off, your economic freedom goes with it.</p>
      </Section>

      <Section title="It's Already Happening">
        <p>You don't have to wait for CBDCs to see financial control in action.</p>
        <p>
          Banks already close accounts with no explanation. Payment processors already refuse service to legal businesses they disagree with. Credit card companies already flag and report certain purchases to authorities. People have lost access to their life savings over politics, religion, profession, or simply being on the wrong list.
        </p>
        <p>Debanking is real. Financial surveillance is real. The infrastructure for programmable economic control is being built right now.</p>
      </Section>

      <Section title="Tokenization of Everything">
        <p>
          Beyond currency, the tokenization of assets is accelerating. Real estate, commodities, businesses, even personal data are being converted into digital tokens on controlled ledgers. The promise is liquidity and efficiency. The risk is that everything of value becomes trackable, controllable, and potentially gateable by whoever runs the system.
        </p>
        <p className="font-semibold text-stone-800">When everything is a token on someone else's ledger, nothing truly belongs to you.</p>
      </Section>

      <Section title="This Isn't New — It's Ancient">
        <p>
          Barter isn't a fringe idea or a doomsday prepper fantasy. It's how human communities traded for thousands of years before any of this existed. The Silk Road was built on it. Farming communities survived on it. Neighbors have always helped neighbors — and received help in return.
        </p>
        <p>BarterWithMe isn't a radical idea. It's a return to something that worked for a very long time, built for the world we live in now.</p>
      </Section>

      <Section title="What We Believe">
        <p>We believe people should have options.</p>
        <p>
          Options outside a financial system that is becoming increasingly centralized, surveilled, and controlled. Options that work when the system doesn't. Options that connect neighbors, reward skills, and build community resilience.
        </p>
        <p>
          We're not anti-technology. We built this with technology. We're not telling you to bury gold in your backyard or stop using banks.
        </p>
        <p>
          We're saying that having alternatives — real, functioning alternatives — matters. And that a community of people who can trade directly with each other, without permission from anyone, is worth building.
        </p>
      </Section>

      <Section title="Why It's Free and Open Source">
        <p>
          BarterWithMe doesn't make money from you. We don't sell your data. We don't run ads. We don't have investors to answer to.
        </p>
        <p>
          The platform is funded by voluntary donations from people who believe in what it is.{' '}
          <a href="https://github.com/sbertoux/barterwithme" target="_blank" rel="noopener noreferrer" className="underline text-stone-700 hover:text-brand-600">The code is open source</a>{' '}
          — anyone can read it, verify it, run their own instance. If this platform ever gets pressured or shut down, the community can pick it up and keep going.
        </p>
        <p className="font-semibold text-stone-800">No single point of failure. No single throat to choke.</p>
        <p>That's intentional.</p>
      </Section>

      <Section title="A Note on Who This Is For">
        <p>Everyone is welcome here.</p>
        <ul className="list-none space-y-2 not-prose text-sm text-stone-600">
          {[
            "If you're a farmer with surplus eggs looking to trade for honey — this is for you.",
            "If you're a mechanic who'd rather fix someone's car than deal in cash — this is for you.",
            "If you're worried about where the financial system is heading and want a community that functions outside it — this is for you.",
            "If you just want to trade your old furniture for something useful — this is for you too.",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-brand-500 mt-0.5">→</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          You don't have to agree with everything on this page to use BarterWithMe. You just have to have something to offer and someone to offer it to.
        </p>
        <p className="italic font-medium text-stone-700">That's always been enough.</p>
      </Section>

      <div className="not-prose mt-12 text-center">
        <Link href="/signup" className="btn-primary text-base py-3.5 px-8">
          Create your first listing →
        </Link>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-stone-900 mb-4">{title}</h2>
      <div className="space-y-4 text-stone-600 leading-relaxed">{children}</div>
    </section>
  )
}
