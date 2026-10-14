import { Check, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

const CONSIDERATIONS: [string, string][] = [
  ['POS integration', 'Credit must come from the till, not the phone. Options: a member QR scanned by the POS, or a receipt code. It depends on what the existing POS vendor supports. That’s the first thing to check.'],
  ['Privacy & consent', 'Opt-in only, minimal data (pseudonymous member ID, totals), clear deletion. Designed with the Swiss FADP (nDSG) in mind. Personalisation only with explicit consent.'],
  ['Fraud prevention', 'Server-side, idempotent transaction IDs (one receipt = one credit), rate limits, and staff-confirmed redemptions. Screenshots of a QR code are worth nothing.'],
  ['Reward cost', 'A coffee per CHF 150 is a placeholder. The real rate needs margin data, expected breakage and redemption modelling, and a pilot to check it.'],
  ['Guests without a smartphone', 'Offer a printed card with the same member number, or simply let the team look it up. Nobody should get a worse croissant for not having an app.'],
  ['Simplicity at the counter', 'One scan, zero questions. No extra steps during the morning rush. If it slows the queue, it’s not ready.'],
]

const KPIS = ['Opt-in rate', 'Active members (30/90 days)', 'Return-visit rate', 'Reward redemption rate', 'Average basket value', 'Customer satisfaction (CSAT / qualitative)']

const NEXT = [
  'Shadow two counters for a morning: where would a scan fit without slowing the queue?',
  'Clickable test with 8–10 regulars: is the buddy charming or childish? Is the rule instantly clear?',
  'POS vendor check: what does the current system allow (member ID, webhooks, coupons)?',
  'Small pilot at one location with a printed fallback card, then decide based on data.',
]

/** The three questions a Product Owner would have to answer before anyone writes production code. */
const PO_QUESTIONS: { q: string; a: string; check: string }[] = [
  {
    q: 'Would customers actually use this?',
    a: 'Unknown, and that’s the point of a prototype. A buddy can feel charming to one regular and childish to the next.',
    check: 'Clickable test with regulars, then opt-in rate and 30/90-day active members in a pilot.',
  },
  {
    q: 'Can it create value without slowing down checkout?',
    a: 'Only if the counter sees one scan and nothing else. Every extra question costs time in the morning rush.',
    check: 'Shadow the counter, time a scan, and check what the existing POS can do.',
  },
  {
    q: 'Do the benefits justify the operational costs?',
    a: 'Rewards, POS work, privacy, support and a fallback card all cost money. The CHF 150 rule is a placeholder.',
    check: 'Margin and redemption modelling, then compare pilot return visits with a control location.',
  },
]

function Block({ n, title, children, compact }: { n: string; title: string; children: ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'mt-6' : ''}>
      <p className="hand text-2xl text-pink-hot">{n}</p>
      <h3 className={`display text-blue ${compact ? 'text-2xl' : 'text-[2rem]'}`}>{title}</h3>
      <div className="mt-3 text-[0.95rem] leading-relaxed text-ink/85">{children}</div>
    </section>
  )
}

export function BehindTheDough({ compact = false }: { compact?: boolean }) {
  const grid = compact ? 'space-y-2' : 'grid grid-cols-2 gap-x-10 gap-y-12'
  return (
    <div className={grid}>
      <Block n="01" title="The Idea" compact={compact}>
        <p className="text-lg font-semibold text-blue">A loyalty programme that feels like the bakery itself, not like online banking.</p>
        <p className="mt-2">
          Two simple tracks, on purpose. <strong className="text-blue">Money → Treats:</strong> every CHF 150 = one coffee, leftovers roll over.{' '}
          <strong className="text-blue">Moments → Buddy:</strong> visits, discoveries and side quests grow a little character, however much you spend. No streaks, no FOMO, no status tiers.
        </p>
      </Block>

      <Block n="02" title="The Opportunity" compact={compact}>
        <p className="font-semibold text-blue">How could a bakery brand strengthen loyalty without a complicated points system?</p>
        <p className="mt-2">Classic stamp cards get lost; points apps feel like work. A playful, transparent programme <em>could</em>:</p>
        <ul className="mt-2 space-y-1">
          {['support returning visits', 'strengthen brand affinity', 'enable a more personal customer experience', 'create an additional digital touchpoint'].map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-pink-hot" aria-hidden>
                ✦
              </span>
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/70 italic">These are hypotheses to be tested, not proven effects.</p>
      </Block>

      <Block n="03" title="The Experiment" compact={compact}>
        <p>This prototype: a clickable app with simulated purchases, so the experience can be tested before anything is integrated.</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.15em] text-blue uppercase">In scope</p>
            {['Digital pass', 'Reward tracker', 'Bakery Buddy', 'Demo purchases', 'Small challenges'].map((x) => (
              <p key={x} className="flex items-center gap-2">
                <Check size={15} className="shrink-0 text-blue" strokeWidth={3} aria-hidden /> {x}
              </p>
            ))}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.15em] text-ink/70 uppercase">Out of scope</p>
            {['POS integration', 'Real vouchers', 'Payments', 'Customer accounts', 'CRM integration', 'Push notifications'].map((x) => (
              <p key={x} className="flex items-center gap-2 text-ink/70">
                <Minus size={15} className="shrink-0" strokeWidth={3} aria-hidden /> {x}
              </p>
            ))}
          </div>
        </div>
      </Block>

      <Block n="04" title="What Would Come Next" compact={compact}>
        <ol className="space-y-2">
          {NEXT.map((v, i) => (
            <li key={v} className="flex gap-3">
              <span className="display grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue text-sm text-white">{i + 1}</span>
              <span>{v}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 mb-2 text-xs font-bold tracking-[0.15em] text-blue uppercase">What a pilot would measure</p>
        <ul className="flex flex-wrap gap-2">
          {KPIS.map((k) => (
            <li key={k} className="rounded-full border-2 border-blue bg-pink px-3 py-1 text-sm font-bold text-blue">
              {k}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/70 italic">No numbers here on purpose. Baselines and targets would come from real data, not from a prototype.</p>
      </Block>

      <div className={compact ? '' : 'col-span-2'}>
        <Block n="05" title="The Product Owner perspective" compact={compact}>
          <p className="max-w-2xl">Before building anything real, three questions need honest answers. The prototype doesn’t answer them; it makes them testable.</p>
          <div className={`mt-4 ${compact ? 'space-y-3' : 'grid grid-cols-3 gap-4'}`}>
            {PO_QUESTIONS.map(({ q, a, check }, i) => (
              <article key={q} className={`rounded-[1.6rem] border-[2.5px] border-blue p-5 ${i === 1 ? 'bg-blue text-white' : 'bg-pink'}`}>
                <p className={`display text-[1.5rem] leading-[0.95] ${i === 1 ? 'text-white' : 'text-blue'}`}>{q}</p>
                <p className={`mt-3 text-sm leading-relaxed ${i === 1 ? 'text-white/90' : 'text-ink/85'}`}>{a}</p>
                <p className={`mt-3 text-sm leading-relaxed font-semibold ${i === 1 ? 'text-pink' : 'text-blue'}`}>How to find out: {check}</p>
              </article>
            ))}
          </div>
        </Block>
      </div>

      <div className={compact ? '' : 'col-span-2'}>
        <Block n="06" title="Things to check before building" compact={compact}>
          <div className={compact ? 'space-y-3' : 'grid grid-cols-3 gap-4'}>
            {CONSIDERATIONS.map(([t, d]) => (
              <div key={t} className="rounded-[1.4rem] border-[2.5px] border-blue bg-white p-4">
                <p className="font-extrabold text-blue">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">{d}</p>
              </div>
            ))}
          </div>
        </Block>
      </div>
    </div>
  )
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-bold text-blue">Concept by Steven Schmid</p>
      <p className="text-xs text-ink/75">Digital Products · UX · Innovation</p>
      <p className="mt-1 flex gap-3 text-xs font-bold text-blue underline underline-offset-4">
        <a href="https://stevenschmid.ch" target="_blank" rel="noopener noreferrer">
          stevenschmid.ch
        </a>
        <a href="https://officebaden.ch" target="_blank" rel="noopener noreferrer">
          officebaden.ch
        </a>
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ink/75">
        <strong>Independent concept · Not affiliated with Bakery Bakery.</strong> This is an independent portfolio concept. Rewards, purchases and customer data are simulated.
      </p>
    </div>
  )
}
