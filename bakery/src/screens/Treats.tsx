import { Check, Coffee } from 'lucide-react'
import { useState } from 'react'
import { Buddy } from '../buddy/Buddy'
import { DoughTrail } from '../components/DoughTrail'
import { DemoTag, ScreenTitle, Sheet, Stamp } from '../components/ui'
import { REWARD_THRESHOLD } from '../data/catalog'
import { availableRewards, chapterOf, formatChf, progressTowardsNext, redeemedRewards, remainingToNext } from '../state/engine'
import { useClub } from '../state/store'
import type { Reward } from '../state/types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function Treats() {
  const { state, dispatch } = useClub()
  const [redeeming, setRedeeming] = useState<Reward | null>(null)
  const [done, setDone] = useState(false)
  const available = availableRewards(state)
  const redeemed = redeemedRewards(state).sort((a, b) => (b.redeemedAt! > a.redeemedAt! ? 1 : -1))

  return (
    <div className="pb-8">
      <ScreenTitle kicker="my" title="Treats">
        <p className="mt-2 text-sm text-ink/75">
          The (made-up) rule: every <strong>CHF 150</strong> collected = one free coffee. Leftovers roll over.
        </p>
      </ScreenTitle>

      <section className="card mx-5 px-4 pt-3 pb-3" aria-label="Current progress">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold tracking-[0.15em] text-blue uppercase">Next treat</span>
          <span className="text-sm font-bold text-blue">
            {formatChf(progressTowardsNext(state))} / {formatChf(REWARD_THRESHOLD)}
          </span>
        </div>
        <DoughTrail progress={progressTowardsNext(state)} />
        <p className="text-center text-xs font-semibold text-ink/70">{formatChf(remainingToNext(state))} to go</p>
      </section>

      <h2 className="mt-6 px-5 text-xs font-bold tracking-[0.15em] text-blue uppercase">Ready to enjoy ({available.length})</h2>
      <div className="mt-2 space-y-3 px-5">
        {available.length === 0 && (
          <div className="flex items-center gap-3 rounded-[1.6rem] border-2 border-dashed border-blue/40 p-4">
            <Buddy species={state.buddy.species} chapter={chapterOf(state)} equipped={state.equipped} size={60} animate={false} />
            <p className="text-sm text-ink/75">No treats yet. Good things take thyme.</p>
          </div>
        )}
        {available.map((r) => (
          <article key={r.id} className="relative flex items-center gap-4 overflow-hidden rounded-[1.6rem] border-[2.5px] border-blue bg-pink p-4 shadow-[0_4px_0_#0025FF]">
            {/* ticket notches */}
            <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border-[2.5px] border-blue bg-cream" aria-hidden />
            <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border-[2.5px] border-blue bg-cream" aria-hidden />
            <Stamp size={58} fill="#fff">
              <Coffee size={24} strokeWidth={2.4} />
            </Stamp>
            <div className="min-w-0 flex-1">
              <p className="display text-xl text-blue">{r.title}</p>
              <p className="text-xs text-ink/70">Unlocked {fmtDate(r.earnedAt)}</p>
            </div>
            <button
              className="btn btn-blue !px-4 !py-2.5 text-sm"
              onClick={() => {
                setDone(false)
                setRedeeming(r)
              }}
            >
              Use
            </button>
          </article>
        ))}
      </div>

      <h2 className="mt-7 px-5 text-xs font-bold tracking-[0.15em] text-blue uppercase">Already enjoyed ({redeemed.length})</h2>
      <ul className="mt-2 space-y-2 px-5">
        {redeemed.length === 0 && <li className="text-sm text-ink/60">Nothing redeemed yet.</li>}
        {redeemed.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-2xl border-2 border-blue/30 bg-white px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-ink/70 line-through decoration-pink-hot decoration-2">
              <Coffee size={16} aria-hidden /> {r.title}
            </span>
            <span className="text-right text-xs text-ink/60">
              earned {fmtDate(r.earnedAt)}
              <br />
              used {fmtDate(r.redeemedAt!)}
            </span>
          </li>
        ))}
      </ul>

      <Sheet
        open={!!redeeming}
        onClose={() => setRedeeming(null)}
        tone="pink"
        labelledBy="redeem-h"
        title={
          <>
            <DemoTag>Demo redemption</DemoTag>
            <h2 className="display mt-2 text-[2.2rem] text-blue">{done ? 'Enjoy!' : 'Coffee time?'}</h2>
          </>
        }
      >
        {redeeming && !done && (
          <div className="text-center">
            <Buddy species={state.buddy.species} chapter={chapterOf(state)} equipped={[...state.equipped.filter((a) => a !== 'cup'), 'cup']} mood="happy" size={130} />
            <p className="mt-2 text-sm text-ink/80">
              In a real product, the team would confirm this at the counter. Here, you can just tap. No codes, no real coffee (sorry).
            </p>
            <button
              className="btn btn-blue mt-5 w-full"
              onClick={() => {
                dispatch({ type: 'redeem', rewardId: redeeming.id })
                setDone(true)
              }}
            >
              <Check size={18} strokeWidth={2.6} /> Redeem in demo
            </button>
          </div>
        )}
        {done && (
          <div className="text-center">
            <Buddy species={state.buddy.species} chapter={chapterOf(state)} equipped={state.equipped} mood="yum" size={130} bounceKey={1} />
            <p className="hand mt-1 text-3xl text-blue">Bean there, sipped that.</p>
            <button className="btn btn-white mt-5 w-full" onClick={() => setRedeeming(null)}>
              Back to my treats
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
