import { BookOpen, ChevronRight, FlaskConical, Gift, Info, MapPin, QrCode, RotateCcw, Smile, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Buddy, type Mood } from '../buddy/Buddy'
import { DoughTrail } from '../components/DoughTrail'
import { Blob, ConceptNote } from '../components/ui'
import { CHAPTERS, REWARD_THRESHOLD } from '../data/catalog'
import { STORES } from '../data/stores'
import {
  availableRewards,
  chapterOf,
  formatChf,
  progressTowardsNext,
  purchaseCount,
  remainingToNext,
} from '../state/engine'
import { useClub, type ReactionKind } from '../state/store'

const IDLE_QUIPS = ['You’re on a roll!', 'Life’s better with crumbs.', 'Another day, another croissant.', 'That’s how we dough it.', 'Good things take thyme.']
const POKE_QUIPS = ['Hehe, that tickles!', 'Careful, I’m flaky.', 'Got any crumbs?', 'Boop!', 'I knead a nap.']

function useRecent(ts: number, ms = 6000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!ts) return
    setNow(Date.now())
    const t = setTimeout(() => setNow(Date.now()), ms + 50)
    return () => clearTimeout(t)
  }, [ts, ms])
  return ts > 0 && now - ts < ms
}

const REACTIONS: Record<ReactionKind, { line: string; mood: Mood }> = {
  yum: { line: 'YUM! Good choice.', mood: 'yum' },
  firstYum: { line: 'You’re officially on a roll!', mood: 'excited' },
  reward: { line: 'YOU DID IT!', mood: 'excited' },
  accessory: { line: 'Looking pretty fresh!', mood: 'happy' },
}
const SECRET = 'Psst… you’re my favourite human.'

export function Home() {
  const { state, go, reaction, setDemoOpen, setAboutOpen } = useClub()
  // Taps on the buddy: count quick taps in a row, the fifth one gets a secret
  const [poke, setPoke] = useState({ at: 0, n: 0 })
  const poked = useRecent(poke.at, 2600)
  const reacting = useRecent(reaction?.shownAt ?? 0, 6000)

  const progress = progressTowardsNext(state)
  const remaining = remainingToNext(state)
  const treats = availableRewards(state).length
  const chapter = chapterOf(state)
  const purchases = purchaseCount(state)

  let mood: Mood = 'idle'
  let line: string
  if (poked) {
    mood = poke.n >= 5 ? 'excited' : 'happy'
    line = poke.n >= 5 ? SECRET : POKE_QUIPS[(poke.n - 1) % POKE_QUIPS.length]
  } else if (reacting && reaction) {
    ;({ line, mood } = REACTIONS[reaction.kind])
  } else if (treats > 0) {
    mood = 'excited'
    line = 'You earned something tasty!'
  } else if (progress > 0 && remaining <= 3000) {
    mood = 'happy'
    line = 'Almost coffee time!'
  } else if (state.transactions.length === 0) {
    line = 'Fresh out of the oven!'
  } else {
    line = IDLE_QUIPS[state.transactions.length % IDLE_QUIPS.length]
  }

  const hello = state.memberName ? `Hey, ${state.memberName}!` : 'Hey, you!'

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="display text-[1.35rem] text-blue">Bakery Club</p>
          <p className="hand -mt-0.5 text-xl text-ink/80">{hello}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAboutOpen(true)} aria-label="About this concept" className="grid h-10 w-10 place-items-center rounded-full border-2 border-blue bg-white text-blue">
            <Info size={18} strokeWidth={2.5} />
          </button>
          <button onClick={() => setDemoOpen(true)} aria-label="Open demo controls" className="grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-ink/40 text-ink/60">
            <FlaskConical size={18} strokeWidth={2.3} />
          </button>
        </div>
      </header>
      <ConceptNote className="mt-2 px-5" />

      {/* Buddy stage */}
      <section aria-label="Your buddy" className="relative mt-1 px-5">
        <div className="relative grid place-items-center pt-16">
          <Blob className="absolute top-16 h-52 w-64" />
          <div aria-live="polite" className="absolute top-1 left-1/2 z-10 w-max max-w-[min(18rem,100%)] -translate-x-1/2">
            <div key={line} className="pop-in relative rounded-[1.4rem] border-[2.5px] border-blue bg-white px-4 py-2 text-center leading-tight font-bold text-balance text-blue shadow-[0_3px_0_#0025FF]">
              {line}
              <span className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r-[2.5px] border-b-[2.5px] border-blue bg-white" aria-hidden />
            </div>
          </div>
          <button
            onClick={() => setPoke((p) => ({ at: Date.now(), n: Date.now() - p.at < 1600 && p.n < 5 ? p.n + 1 : 1 }))}
            aria-label={`Say hi to ${state.buddy.name}`}
            className="relative rounded-full"
          >
            <Buddy
              species={state.buddy.species}
              chapter={chapter}
              equipped={state.equipped}
              mood={mood}
              size={190}
              className="h-auto w-[clamp(9.5rem,48cqw,11.9rem)]"
              bounceKey={poked ? poke.at : reacting ? reaction?.shownAt : undefined}
              title={state.buddy.name}
            />
          </button>
        </div>
        <div className="relative z-10 mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="display text-xl text-blue normal-case">{state.buddy.name}</span>
          <button onClick={() => go('buddy')} className="chip whitespace-nowrap">
            Ch. {chapter} · {CHAPTERS[chapter].title}
          </button>
        </div>
      </section>

      {/* Journey */}
      <section aria-labelledby="journey-h" className="card mx-5 mt-5 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 id="journey-h" className="text-xs font-bold tracking-[0.15em] text-blue uppercase">
            Bakery Journey
          </h2>
          {treats > 0 && (
            <button onClick={() => go('treats')} className="chip !border-red !text-red">
              {treats} treat{treats > 1 ? 's' : ''} waiting
            </button>
          )}
        </div>
        <p className="display mt-1 text-[clamp(1.5rem,8.2cqw,2.4rem)] whitespace-nowrap text-blue">
          {formatChf(progress)} <span className="text-pink-hot" aria-hidden>/</span>
          <span className="sr-only">of</span> <span className="text-blue/60">{formatChf(REWARD_THRESHOLD)}</span>
        </p>
        <DoughTrail progress={progress} />
        <p className="text-center text-sm font-semibold text-ink/80">
          {purchases === 0 && progress === 0 ? (
            <>Every CHF 150 collected = one coffee on us.</>
          ) : (
            <>
              Only <strong className="text-blue">{formatChf(remaining)}</strong> until your next treat!
            </>
          )}
        </p>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="mt-5 grid grid-cols-2 gap-3 px-5">
        <QuickAction onClick={() => go('pass', { showQr: true })} tone="blue" Icon={QrCode} title="Scan & Collect" sub="Show your pass" />
        <QuickAction onClick={() => go('treats')} tone="pink" Icon={Gift} title="My Treats" sub={treats ? `${treats} ready` : 'Rewards wallet'} />
        <QuickAction onClick={() => go('moments')} tone="white" Icon={Sparkles} title="Bakery Moments" sub={`${state.completedChallenges.length}/5 done`} />
        <QuickAction onClick={() => go('buddy')} tone="white" Icon={Smile} title="My Buddy" sub="Dress-up & chapters" />
      </section>

      <section className="mt-3 space-y-3 px-5">
        <RowLink onClick={() => go('story')} Icon={BookOpen} title="My Bakery Story" sub={`${state.story.length} little moment${state.story.length === 1 ? '' : 's'} so far`} />
        <RowLink onClick={() => go('map')} Icon={MapPin} title="Bakery Map" sub={`${state.discoveredStores.length} of ${STORES.length} bakeries discovered`} />
      </section>

      <RestartDemo />
    </div>
  )
}

/** Discreet way back to the very beginning, e.g. before showing the demo to the next person. */
function RestartDemo() {
  const { reset } = useClub()
  const [ask, setAsk] = useState(false)
  return (
    <div className="mt-8 px-5 text-center">
      {ask ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm" role="group" aria-label="Restart demo">
          <span className="w-full font-semibold text-ink/75">Start over? This clears all demo data.</span>
          <button autoFocus className="btn btn-blue !px-4 !py-2 text-sm" onClick={reset}>
            Yes, restart
          </button>
          <button className="btn btn-white !px-4 !py-2 text-sm" onClick={() => setAsk(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setAsk(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-ink/65 underline-offset-4 hover:underline">
          <RotateCcw size={13} strokeWidth={2.5} aria-hidden /> Restart demo
        </button>
      )}
    </div>
  )
}

function QuickAction({
  onClick,
  tone,
  Icon,
  title,
  sub,
}: {
  onClick: () => void
  tone: 'blue' | 'pink' | 'white'
  Icon: typeof Gift
  title: string
  sub: string
}) {
  const cls = tone === 'blue' ? 'bg-blue text-white' : tone === 'pink' ? 'bg-pink text-blue' : 'bg-white text-blue'
  return (
    <button onClick={onClick} className={`flex min-h-[7.2rem] flex-col justify-between rounded-[1.6rem] border-[2.5px] border-blue p-4 text-left shadow-[0_4px_0_#0025FF] transition active:translate-y-[3px] active:shadow-[0_1px_0_#0025FF] ${cls}`}>
      <Icon size={26} strokeWidth={2.3} aria-hidden />
      <span>
        <span className="display block text-[1.25rem] leading-[0.95]">{title}</span>
        <span className="mt-1 block text-xs font-semibold opacity-75">{sub}</span>
      </span>
    </button>
  )
}

function RowLink({ onClick, Icon, title, sub }: { onClick: () => void; Icon: typeof Gift; title: string; sub: string }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[1.4rem] border-[2.5px] border-blue bg-cream px-4 py-3 text-left">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-blue">
        <Icon size={19} strokeWidth={2.4} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-blue">{title}</span>
        <span className="block text-xs text-ink/65">{sub}</span>
      </span>
      <ChevronRight size={20} className="text-blue" aria-hidden />
    </button>
  )
}
