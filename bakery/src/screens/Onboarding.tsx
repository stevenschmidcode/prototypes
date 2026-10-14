import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { Buddy, SPECIES_INFO } from '../buddy/Buddy'
import { Blob, ConceptNote, Squiggle } from '../components/ui'
import { makeMemberNo } from '../state/engine'
import { useClub } from '../state/store'
import type { Species } from '../state/types'

const SPECIES: Species[] = ['croissant', 'bean', 'bread']

export function Onboarding() {
  const { dispatch } = useClub()
  const [step, setStep] = useState(0)
  const [species, setSpecies] = useState<Species>('croissant')
  const [buddyName, setBuddyName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [nameIdx, setNameIdx] = useState(0)

  const finish = () =>
    dispatch({ type: 'onboard', species, buddyName: buddyName || SPECIES_INFO[species].names[0], memberName, memberNo: makeMemberNo() })

  const dots = (
    <div className="flex justify-center gap-1.5" aria-label={`Step ${step + 1} of 4`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-2 rounded-full border-2 border-blue transition-all ${i === step ? 'w-6 bg-blue' : 'w-2 bg-white'}`} />
      ))}
    </div>
  )

  const back = step > 0 && step < 3 && (
    <button onClick={() => setStep(step - 1)} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border-2 border-blue text-blue">
      <ArrowLeft size={18} strokeWidth={2.5} />
    </button>
  )

  // ---------- 1: HEY YOU ----------
  if (step === 0)
    return (
      <div className="relative flex h-full min-h-min flex-col overflow-hidden bg-blue pt-[env(safe-area-inset-top)] text-white">
        <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] overflow-hidden whitespace-nowrap opacity-20" aria-hidden>
          <div className="marquee display inline-block text-[clamp(2.75rem,14cqw,3.75rem)] text-pink">
            croissant · coffee · crumbs · cinnamon · croissant · coffee · crumbs · cinnamon ·&nbsp;
          </div>
        </div>
        <div className="relative px-6 pt-[clamp(4.25rem,12cqh,6rem)]">
          <h1 className="display pop-in text-[clamp(4.25rem,27cqw,6.4rem)] leading-[0.8] text-white">
            Hey
            <br />
            <span className="text-pink">you!</span>
          </h1>
          <p className="mt-[clamp(0.75rem,2.5cqh,1.25rem)] max-w-[16rem] text-[clamp(1.05rem,5cqw,1.25rem)] leading-snug font-semibold">Good things are baking. Ready to join?</p>
        </div>
        {/* The buddy takes whatever height is left, never more */}
        <div className="relative flex min-h-[9.5rem] flex-1 items-center justify-end py-3 pr-[clamp(1rem,6cqw,1.5rem)]">
          <div className="relative grid w-[clamp(7.5rem,min(40cqw,24cqh),11.25rem)] place-items-center">
            <Blob className="absolute -inset-[18%] h-[136%] w-[136%]" fill="#FFC1E1" />
            <Buddy species="croissant" mood="happy" size={180} bounceKey={1} className="h-auto w-full" title="A croissant waving hello" />
            <p className="hand absolute top-[8%] right-[calc(100%+0.5rem)] rotate-[-8deg] text-[clamp(1.25rem,6cqw,1.5rem)] whitespace-nowrap text-white">psst… hi!</p>
          </div>
        </div>
        <div className="relative z-10 px-6 pt-2 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <button className="btn btn-pink w-full text-lg" onClick={() => setStep(1)}>
            Let’s bake! <ArrowRight size={20} strokeWidth={2.6} />
          </button>
          <ConceptNote tone="dark" className="mt-2" />
        </div>
      </div>
    )

  // ---------- 2: Choose buddy ----------
  if (step === 1)
    return (
      <div className="flex h-full min-h-min flex-col bg-cream pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-5 pt-5">
          {back}
          {dots}
          <span className="w-10" />
        </div>
        <div className="px-6 pt-[clamp(0.5rem,2cqh,1rem)]">
          <p className="hand text-2xl text-blue">step two</p>
          <h1 className="display text-[clamp(2.4rem,12cqw,3rem)] text-blue">
            Choose your
            <br />
            buddy
          </h1>
        </div>
        <div className="relative mx-6 mt-2 grid h-[clamp(9rem,30cqh,15.5rem)] place-items-center">
          <Blob className="absolute inset-0 m-auto h-full w-auto" />
          <Buddy key={species} species={species} mood="happy" size={180} bounceKey={1} className="h-[80%] w-auto" title={SPECIES_INFO[species].label} />
        </div>
        <p className="px-6 text-center">
          <span className="display text-2xl text-blue">{SPECIES_INFO[species].label}</span>
          <br />
          <span className="text-sm text-ink/70">{SPECIES_INFO[species].tagline}</span>
        </p>
        <div role="radiogroup" aria-label="Buddy" className="mt-4 grid grid-cols-3 gap-3 px-6">
          {SPECIES.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={species === s}
              onClick={() => {
                setSpecies(s)
                setNameIdx(0)
              }}
              className={`grid place-items-center rounded-3xl border-[2.5px] border-blue py-2 transition ${species === s ? 'bg-pink shadow-[0_4px_0_#0025FF]' : 'bg-white'}`}
            >
              <Buddy species={s} size={58} animate={false} title={SPECIES_INFO[s].label} />
              <span className="mt-1 text-[0.7rem] font-bold text-blue">{SPECIES_INFO[s].label}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto px-6 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <button className="btn btn-blue w-full text-lg" onClick={() => setStep(2)}>
            That’s the one <ArrowRight size={20} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    )

  // ---------- 3: Name ----------
  if (step === 2) {
    const ideas = SPECIES_INFO[species].names
    return (
      <div className="flex h-full min-h-min flex-col bg-pink pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-5 pt-5">
          {back}
          {dots}
          <span className="w-10" />
        </div>
        <div className="px-6 pt-[clamp(0.5rem,2cqh,1rem)]">
          <p className="hand text-2xl text-blue">step three</p>
          <h1 className="display text-[clamp(2.4rem,12cqw,3rem)] text-blue">
            Name your
            <br />
            buddy
          </h1>
        </div>
        <div className="mt-2 flex justify-center">
          <Buddy species={species} mood={buddyName ? 'excited' : 'idle'} size={130} className="h-auto w-[clamp(6rem,18cqh,8.125rem)]" title={buddyName || 'Your buddy'} />
        </div>
        <form
          className="px-6"
          onSubmit={(e) => {
            e.preventDefault()
            setStep(3)
          }}
        >
          <label htmlFor="buddy-name" className="text-sm font-bold text-blue">
            Buddy name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="buddy-name"
              value={buddyName}
              maxLength={24}
              onChange={(e) => setBuddyName(e.target.value)}
              placeholder={ideas[0]}
              className="min-w-0 flex-1 rounded-2xl border-[2.5px] border-blue bg-white px-4 py-3 text-lg font-bold text-blue placeholder:text-blue/35 outline-none focus:shadow-[0_4px_0_#0025FF]"
            />
            <button
              type="button"
              aria-label="Suggest a name"
              onClick={() => {
                setBuddyName(ideas[nameIdx % ideas.length])
                setNameIdx(nameIdx + 1)
              }}
              className="grid w-14 place-items-center rounded-2xl border-[2.5px] border-blue bg-white text-blue"
            >
              <Shuffle size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ideas.map((n) => (
              <button type="button" key={n} onClick={() => setBuddyName(n)} className={`chip ${buddyName === n ? '!bg-blue !text-white' : ''}`}>
                {n}
              </button>
            ))}
          </div>

          <label htmlFor="member-name" className="mt-5 block text-sm font-bold text-blue">
            And you are…? <span className="font-normal text-ink/60">(optional, stays on this device)</span>
          </label>
          <input
            id="member-name"
            value={memberName}
            maxLength={24}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="Your first name"
            autoComplete="off"
            className="mt-1 w-full rounded-2xl border-[2.5px] border-blue bg-white px-4 py-3 font-semibold text-blue placeholder:text-blue/35 outline-none focus:shadow-[0_4px_0_#0025FF]"
          />
          <div className="pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <button type="submit" className="btn btn-blue w-full text-lg">
              Nice to meet you <ArrowRight size={20} strokeWidth={2.6} />
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ---------- 4: Welcome ----------
  const name = buddyName || SPECIES_INFO[species].names[0]
  return (
    <div className="relative flex h-full min-h-min flex-col overflow-hidden bg-cream pt-[env(safe-area-inset-top)]">
      <div className="px-5 pt-5">{dots}</div>
      <div className="relative mt-4 grid min-h-[10rem] flex-1 place-items-center">
        <svg viewBox="0 0 300 300" className="spin-slow absolute h-[clamp(13rem,40cqh,20rem)] w-[clamp(13rem,40cqh,20rem)]" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M150 150 L128 0 L172 0 Z" fill="#FFC1E1" transform={`rotate(${i * 30} 150 150)`} />
          ))}
          <circle cx={150} cy={150} r={88} fill="#F8F6F1" />
        </svg>
        <Buddy species={species} mood="excited" size={200} bounceKey={2} className="h-auto w-[clamp(8rem,26cqh,12.5rem)]" title={name} />
      </div>
      <div className="relative px-6 text-center">
        <p className="hand text-2xl text-blue">{name} says:</p>
        <h1 className="display mt-1 text-[clamp(2.1rem,11cqw,2.7rem)] text-balance text-blue">
          You’re officially part of the dough!
        </h1>
        <Squiggle className="mx-auto mt-2 h-3 w-40" color="#FF8FC8" />
      </div>
      <div className="px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <button className="btn btn-blue w-full text-lg" onClick={finish}>
          Enter Bakery Club <ArrowRight size={20} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
