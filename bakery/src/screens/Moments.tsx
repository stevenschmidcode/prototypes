import { BookOpen, Check, ChevronDown, Coffee, Croissant, Map as MapIcon, Sparkles, Sunrise } from 'lucide-react'
import { useState } from 'react'
import { Buddy } from '../buddy/Buddy'
import { DemoTag, ScreenTitle, Stamp } from '../components/ui'
import { ACCESSORIES, CHALLENGES, COFFEE_SPECIALTIES, TRY_NEXT, type ChallengeDef } from '../data/catalog'
import { challengeProgress } from '../state/engine'
import { useClub } from '../state/store'

const ICONS = { croissant: Croissant, coffee: Coffee, sparkles: Sparkles, map: MapIcon, sunrise: Sunrise }

export function Moments() {
  const { state, go } = useClub()
  const [open, setOpen] = useState<string | null>(null)
  const done = state.completedChallenges.length

  return (
    <div className="pb-8">
      <ScreenTitle kicker="little" title={<>Bakery<br />Moments</>}>
        <p className="mt-2 text-sm text-ink/75">
          Small, optional side quests. No streaks, no pressure, no “last chance!”. Do them whenever. Or never.
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-blue">
          <span className="flex gap-1" aria-hidden>
            {CHALLENGES.map((c) => (
              <span key={c.id} className={`h-3 w-3 rounded-full border-2 border-blue ${state.completedChallenges.includes(c.id) ? 'bg-blue' : 'bg-white'}`} />
            ))}
          </span>
          {done}/5 moments
        </p>
      </ScreenTitle>

      <div className="space-y-3 px-5">
        {CHALLENGES.map((c) => (
          <ChallengeCard key={c.id} c={c} expanded={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} />
        ))}
      </div>

      <button onClick={() => go('story')} className="mx-5 mt-6 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-[1.6rem] border-[2.5px] border-blue bg-pink p-4 text-left">
        <BookOpen className="text-blue" aria-hidden />
        <span className="flex-1">
          <span className="display block text-xl text-blue">My Bakery Story</span>
          <span className="text-xs text-ink/70">Your little illustrated diary</span>
        </span>
      </button>
    </div>
  )
}

function ChallengeCard({ c, expanded, onToggle }: { c: ChallengeDef; expanded: boolean; onToggle: () => void }) {
  const { state, dispatch, setPurchaseOpen, go } = useClub()
  const isDone = state.completedChallenges.includes(c.id)
  const progress = Math.min(challengeProgress(state, c.id), c.target)
  const Icon = ICONS[c.icon as keyof typeof ICONS]
  const unlockLabel = c.unlock === 'badge' ? 'Sunrise badge' : ACCESSORIES[c.unlock].label

  return (
    <article className={`overflow-hidden rounded-[1.6rem] border-[2.5px] border-blue ${isDone ? 'bg-pink' : 'bg-white'}`}>
      <button onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-3 p-4 text-left">
        <Stamp size={54} fill={isDone ? '#fff' : '#FFC1E1'}>
          {isDone ? <Check size={24} strokeWidth={3} /> : <Icon size={22} strokeWidth={2.4} />}
        </Stamp>
        <span className="min-w-0 flex-1">
          <span className="display block text-[1.35rem] text-blue">{c.title}</span>
          <span className="mt-1 flex items-center gap-2">
            <span className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-blue bg-white">
              <span className="block h-full rounded-full bg-blue transition-all" style={{ width: `${(progress / c.target) * 100}%` }} />
            </span>
            <span className="text-xs font-bold text-blue">
              {progress}/{c.target}
            </span>
          </span>
        </span>
        <ChevronDown size={20} className={`text-blue transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {expanded && (
        <div className="fade-in border-t-2 border-dashed border-blue/40 px-4 pt-3 pb-4">
          <p className="text-sm text-ink/80">{c.blurb}</p>
          <p className="mt-2 text-xs font-bold text-blue">
            Unlocks: {unlockLabel} {isDone && '✓'}
          </p>

          {c.id === 'firstBite' && !isDone && (
            <button className="btn btn-blue mt-3 w-full text-sm" onClick={() => setPurchaseOpen(true)}>
              Simulate a purchase <DemoTag />
            </button>
          )}

          {c.id === 'coffeeExplorer' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {COFFEE_SPECIALTIES.map((cof) => {
                const flipped = state.tastedCoffees.includes(cof.id)
                return (
                  <button
                    key={cof.id}
                    onClick={() => dispatch({ type: 'tasteCoffee', coffeeId: cof.id })}
                    aria-pressed={flipped}
                    className={`min-h-[5.5rem] rounded-2xl border-2 border-blue p-3 text-left transition ${flipped ? 'bg-blue text-white' : 'bg-cream text-blue'}`}
                  >
                    <span className="block text-sm font-extrabold">{cof.label}</span>
                    <span className="mt-1 block text-[0.72rem] leading-snug opacity-85">{flipped ? cof.fact : 'Tap to discover'}</span>
                  </button>
                )
              })}
            </div>
          )}

          {c.id === 'somethingNew' && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRY_NEXT.map((p) => {
                  const picked = state.wishlist.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => dispatch({ type: 'pickNew', productId: p.id })}
                      aria-pressed={picked}
                      className={`rounded-full border-2 border-blue px-3 py-1.5 text-sm font-bold ${picked ? 'bg-blue text-white' : 'bg-white text-blue'}`}
                    >
                      <span aria-hidden>{p.emoji}</span> {p.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-ink/60">Just a note-to-self for a future visit. Nothing gets bought.</p>
            </>
          )}

          {c.id === 'bakeryTourist' && (
            <button className="btn btn-blue mt-3 w-full text-sm" onClick={() => go('map')}>
              <MapIcon size={16} /> Open the Bakery Map
            </button>
          )}

          {c.id === 'earlyBird' &&
            (isDone ? (
              <p className="mt-3 flex items-center gap-3 text-sm font-semibold text-blue">
                <Stamp size={48} fill="#fff">
                  <Sunrise size={20} />
                </Stamp>
                Sunrise badge collected. Look at you, morning person.
              </p>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <Buddy species={state.buddy.species} size={56} animate={false} />
                <button className="btn btn-pink flex-1 text-sm" onClick={() => dispatch({ type: 'earlyBird' })}>
                  <Sunrise size={16} /> Join a breakfast moment <DemoTag />
                </button>
              </div>
            ))}
        </div>
      )}
    </article>
  )
}
