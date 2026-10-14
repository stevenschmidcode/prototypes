import { Check, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

const CONSIDERATIONS: [string, string][] = [
  ['POS integration', 'Credit must come from the till, not the phone. Options: a member QR scanned by the POS, or a receipt code. It depends on what the existing POS vendor supports. That’s the first thing to check.'],
  ['Privacy & consent', 'Opt-in only, minimal data (pseudonymous member ID, totals), clear deletion. Swiss FADP/nDSG compliant. Personalisation only with explicit consent.'],
  ['Fraud prevention', 'Server-side, idempotent transaction IDs (one receipt = one credit), rate limits, and staff-confirmed redemptions. Screenshots of a QR code are worth nothing.'],
  ['Reward cost', 'A coffee per CHF 150 is a placeholder. The real rate needs margin data, expected breakage and redemption modelling, and a pilot to check it.'],
  ['Guests without a smartphone', 'Offer a printed card with the same member number, or simply let the team look it up. Nobody should get a worse croissant for not having an app.'],
  ['Simplicity at the counter', 'One scan, zero questions. No extra steps during the morning rush. If it slows the queue, it’s not ready.'],
]

const KPIS = ['Opt-in rate', 'Active members (30/90 days)', 'Return-visit rate', 'Reward redemption rate', 'Average basket value', 'Customer satisfaction (CSAT / qualitative)']

const VALIDATE = [
  'Shadow two counters for a morning: where would a scan fit without slowing the queue?',
  'Clickable test with 8–10 regulars: is the buddy charming or childish? Is the rule instantly clear?',
  'POS vendor check: what does the current system allow (member ID, webhooks, coupons)?',
  'Small pilot at one location with a printed fallback card, then decide based on data.',
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
      <Block n="01" title="Problem hypothesis" compact={compact}>
        <p className="text-lg font-semibold text-blue">
          How can a bakery brand strengthen customer loyalty without burdening customers with a complicated points system?
        </p>
        <p className="mt-2">
          Classic stamp cards get lost; points apps feel like banking. A brand this playful deserves a loyalty touchpoint that feels like the shop itself.
        </p>
      </Block>

      <Block n="02" title="Product hypothesis" compact={compact}>
        <p>A simple digital loyalty programme with playful elements <em>could</em>:</p>
        <ul className="mt-2 space-y-1">
          {['support returning visits', 'strengthen brand affinity', 'enable a more personal customer experience', 'create an additional digital touchpoint'].map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-pink-hot">✦</span>
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/60 italic">These are hypotheses to be tested, not proven effects.</p>
      </Block>

      <Block n="03" title="MVP scope" compact={compact}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.15em] text-blue uppercase">In scope</p>
            {['Digital pass', 'Reward tracker', 'Bakery Buddy', 'Demo purchases', 'Small challenges'].map((x) => (
              <p key={x} className="flex items-center gap-2">
                <Check size={15} className="text-blue" strokeWidth={3} /> {x}
              </p>
            ))}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.15em] text-ink/50 uppercase">Out of scope</p>
            {['POS integration', 'Real vouchers', 'Payments', 'Customer accounts', 'CRM integration', 'Push notifications'].map((x) => (
              <p key={x} className="flex items-center gap-2 text-ink/60">
                <Minus size={15} strokeWidth={3} /> {x}
              </p>
            ))}
          </div>
        </div>
      </Block>

      <Block n="04" title="Two tracks, on purpose" compact={compact}>
        <p>
          <strong className="text-blue">Money → Treats.</strong> Transparent and predictable: every CHF 150 = one coffee, surplus rolls over.
        </p>
        <p className="mt-2">
          <strong className="text-blue">Moments → Buddy.</strong> Visits, discoveries and side quests grow the character, and they all count the same however much you spend. No streaks, no FOMO, no status tiers.
        </p>
      </Block>

      <div className={compact ? '' : 'col-span-2'}>
        <Block n="05" title="Business considerations" compact={compact}>
          <div className={compact ? 'space-y-3' : 'grid grid-cols-3 gap-4'}>
            {CONSIDERATIONS.map(([t, d]) => (
              <div key={t} className="rounded-[1.4rem] border-[2.5px] border-blue bg-white p-4">
                <p className="font-extrabold text-blue">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{d}</p>
              </div>
            ))}
          </div>
        </Block>
      </div>

      <Block n="06" title="Measuring success" compact={compact}>
        <ul className="flex flex-wrap gap-2">
          {KPIS.map((k) => (
            <li key={k} className="rounded-full border-2 border-blue bg-pink px-3 py-1 text-sm font-bold text-blue">
              {k}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/60 italic">No numbers here on purpose. Baselines and targets would come from real data, not from a prototype.</p>
      </Block>

      <Block n="07" title="How I’d test it next" compact={compact}>
        <ol className="space-y-2">
          {VALIDATE.map((v, i) => (
            <li key={v} className="flex gap-3">
              <span className="display grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue text-sm text-white">{i + 1}</span>
              <span>{v}</span>
            </li>
          ))}
        </ol>
      </Block>
    </div>
  )
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-bold text-blue">Concept by Steven Schmid</p>
      <p className="text-xs text-ink/70">Digital Products · UX · Innovation</p>
      <p className="mt-1 flex gap-3 text-xs font-bold text-blue underline underline-offset-4">
        <a href="https://stevenschmid.ch" target="_blank" rel="noopener noreferrer">
          stevenschmid.ch
        </a>
        <a href="https://officebaden.ch" target="_blank" rel="noopener noreferrer">
          officebaden.ch
        </a>
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ink/60">
        Independent concept study. Not affiliated with or commissioned by Bakery Bakery. Rewards and customer data are fictional.
      </p>
    </div>
  )
}
