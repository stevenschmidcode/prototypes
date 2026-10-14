import { Coffee, FlaskConical, Gift, Plus, RotateCcw, ShoppingBag, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Buddy } from '../buddy/Buddy'
import { ACCESSORIES, CHALLENGES, CHAPTERS, DEMO_PRODUCTS, REWARD_THRESHOLD } from '../data/catalog'
import {
  availableRewards,
  chapterOf,
  formatChf,
  formatChfExact,
  makeTxId,
  progressTowardsNext,
  redeemedRewards,
  totalCollected,
} from '../state/engine'
import { useClub } from '../state/store'
import { Blob, DemoTag, Sheet } from './ui'
import { BehindTheDough, Disclaimer } from '../desktop/BehindTheDough'

export function PurchaseSheet() {
  const { purchaseOpen, setPurchaseOpen, dispatch } = useClub()
  return (
    <Sheet
      open={purchaseOpen}
      onClose={() => setPurchaseOpen(false)}
      labelledBy="buy-h"
      title={
        <>
          <DemoTag>Demo purchase</DemoTag>
          <h2 className="display mt-2 text-[2.1rem] text-blue">What’s on the tray?</h2>
        </>
      }
    >
      <p className="-mt-2 mb-4 text-sm text-ink/70">Tap an item to simulate a confirmed purchase at the till. Prices are made up for this demo.</p>
      <div className="grid grid-cols-2 gap-3">
        {DEMO_PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              dispatch({ type: 'purchase', txId: makeTxId(), productId: p.id })
              setPurchaseOpen(false)
            }}
            className="flex flex-col items-start rounded-[1.4rem] border-[2.5px] border-blue bg-white p-4 text-left shadow-[0_4px_0_#0025FF] transition active:translate-y-[3px] active:shadow-[0_1px_0_#0025FF]"
          >
            <span className="text-3xl" aria-hidden>
              {p.emoji}
            </span>
            <span className="mt-2 font-extrabold text-blue">{p.label}</span>
            <span className="text-sm font-semibold text-ink/70">{formatChfExact(p.price)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

/** Plays the effect queue: quick toasts for small wins, a full card for treats and new chapters. */
export function Celebrations() {
  const { effects, shiftEffect, state, go } = useClub()
  const fx = effects[0]

  useEffect(() => {
    if (!fx || fx.type === 'reward' || fx.type === 'chapter') return
    const t = setTimeout(shiftEffect, fx.type === 'yum' ? 1900 : 1600)
    return () => clearTimeout(t)
  }, [fx, shiftEffect])

  if (!fx) return null
  const chapter = chapterOf(state)
  const buddy = (mood: 'yum' | 'excited' | 'happy', size: number, extra: typeof state.equipped = []) => (
    <Buddy species={state.buddy.species} chapter={chapter} equipped={[...new Set([...state.equipped, ...extra])]} mood={mood} size={size} bounceKey={1} />
  )

  if (fx.type === 'yum') {
    const quip = DEMO_PRODUCTS.find((p) => p.label === fx.label)?.quip
    return (
      <div className="fade-in pointer-events-none absolute inset-0 z-50 grid place-items-center bg-ink/35 px-8" role="status" aria-live="polite">
        <div className="pop-in relative w-full rounded-[2rem] border-[3px] border-blue bg-cream px-5 pt-4 pb-5 text-center shadow-[0_8px_0_#0025FF]">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="float-up absolute h-3 w-3 rounded-full border-2 border-blue bg-pink"
              style={{ left: `${8 + i * 12}%`, top: `${18 + (i % 3) * 10}%`, animationDelay: `${i * 0.07}s` }}
            />
          ))}
          <div className="relative grid place-items-center">
            <Blob className="absolute h-36 w-40" />
            {buddy('yum', 120)}
          </div>
          <p className="display -mt-2 -rotate-3 text-[4.2rem] text-blue">Yum!</p>
          <p className="mx-auto mt-2 w-fit rounded-full border-[2.5px] border-blue bg-white px-4 py-1.5 font-extrabold text-blue">+ {formatChfExact(fx.amount)} collected</p>
          {quip && <p className="hand mt-2 text-2xl text-blue">{quip}</p>}
        </div>
      </div>
    )
  }

  if (fx.type === 'challenge' || fx.type === 'accessory' || fx.type === 'note') {
    const text =
      fx.type === 'challenge'
        ? `Bakery Moment complete: ${CHALLENGES.find((c) => c.id === fx.id)?.title}!`
        : fx.type === 'accessory'
          ? `New in the wardrobe: ${ACCESSORIES[fx.accessory].label}`
          : fx.text
    return (
      <div className="absolute inset-x-0 bottom-24 z-50 flex justify-center px-4" role="status" aria-live="polite">
        <button onClick={shiftEffect} title="Tap to dismiss" className="pop-in flex items-center gap-3 rounded-[1.4rem] border-[2.5px] border-blue bg-white py-2 pr-4 pl-2 text-left shadow-[0_4px_0_#0025FF]">
          {fx.type === 'accessory' ? (
            <Buddy species={state.buddy.species} equipped={[fx.accessory]} size={44} animate={false} />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pink text-blue">
              <Sparkles size={20} />
            </span>
          )}
          <span className="text-sm font-bold text-blue">{text}</span>
        </button>
      </div>
    )
  }

  // Full-screen moments
  const isReward = fx.type === 'reward'
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-blue px-6 text-center text-white fade-in" role="dialog" aria-modal="true" aria-labelledby="celebrate-h">
      <svg viewBox="0 0 300 300" className="spin-slow absolute top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-[60%] opacity-30" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <path key={i} d="M150 150 L144 0 L156 0 Z" fill={i % 2 ? '#FFC1E1' : 'transparent'} transform={`rotate(${i * 20} 150 150)`} />
        ))}
      </svg>
      <div className="relative">
        {isReward ? (
          <>
            <h2 id="celebrate-h" className="display pop-in text-[3.6rem] text-pink">
              You earned
              <br />a treat!
            </h2>
            <div className="relative mt-2 grid place-items-center"><Blob className="absolute h-52 w-56" />{buddy('excited', 180, ['cup'])}</div>
            <p className="hand text-3xl">Coffee’s on us. Well, in this demo.</p>
            <p className="mt-1 text-sm text-white/75">Every {formatChf(REWARD_THRESHOLD)} = one free coffee (concept assumption).</p>
          </>
        ) : (
          <>
            <p className="hand text-3xl text-pink">a new chapter begins…</p>
            <h2 id="celebrate-h" className="display pop-in mt-1 text-[3.4rem]">
              {CHAPTERS[fx.chapter].title}
            </h2>
            <div className="relative mt-2 grid place-items-center"><Blob className="absolute h-52 w-56" />{buddy('excited', 180)}</div>
            <p className="text-lg font-semibold">{CHAPTERS[fx.chapter].line}</p>
          </>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            autoFocus
            className="btn btn-pink w-full text-lg"
            onClick={() => {
              shiftEffect()
              go(isReward ? 'treats' : 'buddy')
            }}
          >
            {isReward ? (
              <>
                <Gift size={20} /> View my treat
              </>
            ) : (
              'Meet the new me'
            )}
          </button>
          <button className="text-sm font-bold text-white/80 underline underline-offset-4" onClick={shiftEffect}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export function DemoPanel() {
  const { demoOpen, setDemoOpen, setPurchaseOpen, dispatch, reset, state } = useClub()
  const [confirm, setConfirm] = useState(false)
  const close = () => {
    setDemoOpen(false)
    setConfirm(false)
  }
  const run = (fn: () => void) => () => {
    fn()
    close()
  }
  const chapter = chapterOf(state)

  return (
    <Sheet
      open={demoOpen}
      onClose={close}
      labelledBy="demo-h"
      title={
        <>
          <DemoTag>Demo controls</DemoTag>
          <h2 className="display mt-2 text-[2rem] text-blue">Backstage</h2>
        </>
      }
    >
      <p className="-mt-2 mb-4 text-sm text-ink/70">Shortcuts for testing. Every change shows up in the Bakery Story, so nothing happens invisibly.</p>

      <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Collected', formatChf(totalCollected(state))],
          ['Towards next', formatChf(progressTowardsNext(state))],
          ['Treats', `${availableRewards(state).length} / ${redeemedRewards(state).length} used`],
          ['Moments', String(state.buddyXp)],
          ['Chapter', String(chapter)],
          ['Member', state.memberNo],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border-2 border-blue/30 bg-white px-2 py-2">
            <dt className="text-[0.6rem] font-bold tracking-wider text-blue/70 uppercase">{k}</dt>
            <dd className="truncate text-sm font-extrabold text-blue">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-2">
        <DemoBtn Icon={ShoppingBag} label="Simulate a purchase" onClick={run(() => setPurchaseOpen(true))} />
        <DemoBtn Icon={Plus} label="Add CHF 50" onClick={run(() => dispatch({ type: 'topup', txId: makeTxId(), amount: 5000 }))} />
        <DemoBtn Icon={Coffee} label="Unlock a reward now" onClick={run(() => dispatch({ type: 'unlockRewardNow', txId: makeTxId() }))} />
        <DemoBtn Icon={Wand2} label={chapter < 4 ? `Evolve buddy → Chapter ${chapter + 1}` : 'Buddy is already a legend'} disabled={chapter === 4} onClick={run(() => dispatch({ type: 'boostBuddy' }))} />
        {confirm ? (
          <div className="flex gap-2">
            <button className="btn flex-1 !border-red bg-red text-white !shadow-[0_4px_0_#0B0B2B]" onClick={reset}>
              Yes, reset everything
            </button>
            <button className="btn btn-white" onClick={() => setConfirm(false)}>
              Keep
            </button>
          </div>
        ) : (
          <DemoBtn Icon={RotateCcw} label="Reset demo" onClick={() => setConfirm(true)} danger />
        )}
      </div>
    </Sheet>
  )
}

function DemoBtn({ Icon, label, onClick, disabled, danger }: { Icon: typeof Plus; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold disabled:opacity-40 ${danger ? 'border-red/60 text-red' : 'border-blue bg-white text-blue'}`}
    >
      <Icon size={18} strokeWidth={2.5} aria-hidden /> {label}
    </button>
  )
}

export function AboutSheet() {
  const { aboutOpen, setAboutOpen } = useClub()
  return (
    <Sheet
      open={aboutOpen}
      onClose={() => setAboutOpen(false)}
      labelledBy="about-h"
      title={
        <>
          <span className="chip">
            <FlaskConical size={12} /> concept study
          </span>
          <h2 className="display mt-2 text-[2.1rem] text-blue">Behind the Dough</h2>
        </>
      }
    >
      <BehindTheDough compact />
      <Disclaimer className="mt-6" />
    </Sheet>
  )
}
