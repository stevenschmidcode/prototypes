import { Check, Lock } from 'lucide-react'
import { Buddy, SPECIES_INFO } from '../buddy/Buddy'
import { Blob, ScreenTitle } from '../components/ui'
import { ACCESSORIES, CHAPTERS } from '../data/catalog'
import { chapterOf } from '../state/engine'
import { useClub } from '../state/store'
import type { Accessory, Chapter } from '../state/types'

const ORDER: Accessory[] = ['sunglasses', 'scarf', 'cup', 'chefHat', 'bag']

export function BuddyScreen() {
  const { state, dispatch } = useClub()
  const chapter = chapterOf(state)
  const next = chapter < 4 ? CHAPTERS[(chapter + 1) as Chapter] : null
  const toNext = next ? next.xp - state.buddyXp : 0

  return (
    <div className="pb-8">
      <ScreenTitle kicker={SPECIES_INFO[state.buddy.species].label} title={<span className="normal-case">{state.buddy.name}</span>} />

      <div className="relative mx-5 grid place-items-center rounded-[2rem] border-[2.5px] border-blue bg-white pt-4 pb-3">
        <Blob className="absolute top-4 h-56 w-64" />
        <Buddy species={state.buddy.species} chapter={chapter} equipped={state.equipped} size={190} title={state.buddy.name} />
        <p className="relative mt-1 text-center">
          <span className="chip">Chapter {chapter}</span>
          <span className="display mt-1 block text-2xl text-blue">{CHAPTERS[chapter].title}</span>
          <span className="text-sm text-ink/70">{CHAPTERS[chapter].line}</span>
        </p>
      </div>

      {/* Story chapters */}
      <h2 className="mt-7 px-5 text-xs font-bold tracking-[0.15em] text-blue uppercase">The story so far</h2>
      <p className="mt-1 px-5 text-sm text-ink/70">
        Your buddy grows with <strong>moments</strong>, not money. Visits, discoveries and side quests all count the same.
      </p>
      <ol className="mt-3 space-y-2 px-5">
        {([1, 2, 3, 4] as Chapter[]).map((c) => {
          const reached = chapter >= c
          return (
            <li key={c} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${reached ? 'border-blue bg-pink' : 'border-dashed border-blue/40 bg-transparent'}`}>
              <span className={`display grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-blue text-lg ${reached ? 'bg-blue text-white' : 'bg-white text-blue/50'}`}>{c}</span>
              <span className="flex-1">
                <span className={`block font-bold ${reached ? 'text-blue' : 'text-ink/50'}`}>{CHAPTERS[c].title}</span>
                <span className="block text-xs text-ink/60">{reached ? CHAPTERS[c].line : `After ${CHAPTERS[c].xp} moments`}</span>
              </span>
              {reached && <Check className="text-blue" size={20} strokeWidth={3} aria-label="reached" />}
            </li>
          )
        })}
      </ol>
      {next && (
        <p className="hand mt-3 px-5 text-xl text-blue">
          {toNext} more moment{toNext === 1 ? '' : 's'} until “{next.title}”.
        </p>
      )}

      {/* Wardrobe */}
      <h2 className="mt-7 px-5 text-xs font-bold tracking-[0.15em] text-blue uppercase">Wardrobe</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 px-5">
        {ORDER.map((a) => {
          const unlocked = state.unlocked.includes(a)
          const worn = state.equipped.includes(a)
          return (
            <button
              key={a}
              disabled={!unlocked}
              aria-pressed={unlocked ? worn : undefined}
              onClick={() => dispatch({ type: 'toggleAccessory', accessory: a })}
              className={`relative flex flex-col items-center rounded-[1.4rem] border-[2.5px] p-3 text-center transition ${
                unlocked ? (worn ? 'border-blue bg-pink text-blue shadow-[0_4px_0_#0025FF]' : 'border-blue bg-white text-blue') : 'border-dashed border-blue/35 bg-transparent text-ink/50'
              }`}
            >
              <span className={unlocked ? '' : 'opacity-30 grayscale'}>
                <Buddy species={state.buddy.species} equipped={[a]} size={64} animate={false} />
              </span>
              <span className="mt-1 text-sm font-bold">{ACCESSORIES[a].label}</span>
              <span className="text-[0.7rem] opacity-80">{unlocked ? (worn ? 'Wearing it' : 'Tap to wear') : ACCESSORIES[a].how}</span>
              {!unlocked && <Lock size={14} className="absolute top-3 right-3" aria-label="locked" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
