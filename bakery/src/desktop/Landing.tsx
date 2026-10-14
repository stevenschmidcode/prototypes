import { Heart, Store, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Buddy } from '../buddy/Buddy'
import { Squiggle } from '../components/ui'
import { BehindTheDough, Disclaimer } from './BehindTheDough'

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative rounded-[3.2rem] border-[10px] border-ink bg-ink shadow-[18px_22px_0_#0025FF]"
      style={{ height: 'min(820px, calc(100vh - 8rem))', aspectRatio: '9 / 19.2' }}
    >
      <div className="absolute top-2 left-1/2 z-30 h-6 w-28 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
      <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-cream">{children}</div>
    </div>
  )
}

const BENEFITS = [
  { Icon: Heart, title: 'For Customers', text: 'Rewards, personality and delightful interactions.', tone: 'bg-pink' },
  { Icon: Users, title: 'For Bakery Teams', text: 'Simple loyalty mechanics and potential insights into customer engagement.', tone: 'bg-white' },
  { Icon: Store, title: 'For the Brand', text: 'A playful digital touchpoint that extends the in-store experience.', tone: 'bg-blue text-white' },
]

export function Landing({ app }: { app: ReactNode }) {
  return (
    <div className="min-h-full bg-cream text-ink">
      {/* Top bar */}
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-10 pt-6">
        <p className="display text-2xl text-blue">
          Bakery Club <span className="hand ml-1 align-middle text-xl font-semibold text-ink/60 normal-case">· a concept study</span>
        </p>
        <nav className="flex items-center gap-6 text-sm font-bold text-blue">
          <a href="#behind-the-dough" className="underline-offset-4 hover:underline">
            Behind the Dough
          </a>
          <a href="https://stevenschmid.ch" target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-blue px-4 py-1.5 hover:bg-blue hover:text-white">
            Steven Schmid ↗
          </a>
        </nav>
      </header>

      {/* Hero: concept left, live app right */}
      <main className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto] items-start gap-14 px-10 pt-8 pb-20">
        <section className="relative pt-6">
          <p className="chip">Independent concept · Digital Products · CX · Innovation</p>
          <h1 className="display mt-6 text-[clamp(4.5rem,8.4vw,8.6rem)] text-blue">
            A little
            <br />
            joy in
            <br />
            <span className="relative inline-block">
              every bite.
              <Squiggle className="absolute -bottom-3 left-0 h-5 w-full" color="#FF8FC8" />
            </span>
          </h1>
          <p className="mt-10 max-w-xl text-xl leading-snug font-semibold text-ink">
            An independent loyalty and customer experience concept for Bakery Bakery.
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-ink/75">
            A visit shouldn’t just end at the till. With <strong className="text-blue">Bakery Club</strong> every visit becomes a small chapter of a personal bakery story: a digital pass, a
            transparent treat tracker, gentle side quests, and a little <strong className="text-blue">Bakery Buddy</strong> that grows with you, whether you spend a lot or not.
          </p>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
            {BENEFITS.map(({ Icon, title, text, tone }, i) => (
              <div key={title} className={`rounded-[1.8rem] border-[2.5px] border-blue p-5 shadow-[0_5px_0_#0025FF] ${tone} ${i === 1 ? 'translate-y-4' : ''}`}>
                <Icon size={26} strokeWidth={2.3} className={tone.includes('blue') ? 'text-pink' : 'text-blue'} />
                <p className="display mt-4 text-[1.35rem] leading-[0.95]">{title}</p>
                <p className={`mt-2 text-sm leading-snug ${tone.includes('blue') ? 'text-white/85' : 'text-ink/75'}`}>{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-4">
            <div className="flex -space-x-6">
              <Buddy species="croissant" size={74} animate={false} />
              <Buddy species="bean" size={74} animate={false} />
              <Buddy species="bread" size={74} animate={false} />
            </div>
            <p className="max-w-xs text-sm text-ink/70">
              Three buddies, four chapters, five accessories, one very simple rule: <strong className="text-blue">every CHF 150 = a coffee</strong>{' '}
              <span className="text-ink/50">(made-up concept rule)</span>.
            </p>
          </div>

          {/* hand-drawn pointer to the phone */}
          <div className="pointer-events-none absolute top-[42%] -right-10 hidden text-right xl:block" aria-hidden>
            <p className="hand rotate-[-6deg] text-3xl text-blue">go on, it’s
              <br />
              interactive!</p>
            <svg viewBox="0 0 120 60" className="ml-auto h-14 w-28">
              <path d="M6 10 C40 4 80 18 104 44" fill="none" stroke="#0025FF" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M90 44 L106 46 L104 30" fill="none" stroke="#0025FF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        <aside className="sticky top-6" aria-label="Interactive prototype">
          <PhoneFrame>{app}</PhoneFrame>
          <p className="mt-6 text-center text-xs text-ink/60">
            Try: onboarding → Pass → <em>Simulate a purchase</em>. Flask icon = demo controls.
          </p>
        </aside>
      </main>

      {/* Marquee band */}
      <div className="overflow-hidden border-y-[2.5px] border-blue bg-pink py-4" aria-hidden>
        <div className="marquee display inline-block text-5xl whitespace-nowrap text-blue">
          {'Good things are baking ✦ Life’s better with crumbs ✦ That’s how we dough it ✦ '.repeat(4)}
        </div>
      </div>

      {/* Product thinking */}
      <section id="behind-the-dough" className="mx-auto max-w-[1320px] px-10 py-24">
        <div className="mb-14 flex items-end justify-between gap-10">
          <h2 className="display text-[7rem] text-blue">
            Behind
            <br />
            the dough
          </h2>
          <p className="max-w-md pb-3 text-lg text-ink/75">
            The product thinking behind the croissants: hypotheses, scope, trade-offs and how I’d validate this with real customers and real counter teams.
          </p>
        </div>
        <BehindTheDough />
      </section>

      <footer className="border-t-[2.5px] border-blue bg-white">
        <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-10 px-10 py-12">
          <Disclaimer className="max-w-md" />
          <p className="display text-right text-6xl text-blue">
            Let’s bake
            <br />
            something good.
          </p>
        </div>
      </footer>
    </div>
  )
}
