import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { Buddy, SPECIES_INFO } from '../buddy/Buddy'
import { Blob, Squiggle } from '../components/ui'
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
      <div className="relative flex h-full min-h-min flex-col overflow-hidden bg-blue text-white">
        <div className="pointer-events-none absolute inset-x-0 top-6 overflow-hidden whitespace-nowrap opacity-20" aria-hidden>
          <div className="marquee display inline-block text-6xl text-pink">
            croissant · coffee · crumbs · cinnamon · croissant · coffee · crumbs · cinnamon ·&nbsp;
          </div>
        </div>
        <div className="relative px-6 pt-24">
          <h1 className="display pop-in text-[6.4rem] leading-[0.8] text-white">
            Hey
            <br />
            <span className="text-pink">you!</span>
          </h1>
          <p className="mt-5 max-w-[16rem] text-xl font-semibold leading-snug">Good things are baking. Ready to join?</p>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-end pr-6">
          <div className="relative grid place-items-center">
            <Blob className="absolute h-60 w-60" fill="#FFC1E1" />
            <Buddy species="croissant" mood="happy" size={180} title="A croissant waving hello" />
            <p className="hand absolute top-6 -left-28 rotate-[-8deg] text-2xl text-white">psst… hi!</p>
          </div>
        </div>
        <div className="relative z-10 px-6 pt-2 pb-8">
          <button className="btn btn-pink w-full text-lg" onClick={() => setStep(1)}>
            Let’s bake! <ArrowRight size={20} strokeWidth={2.6} />
          </button>
          <p className="mt-3 text-center text-xs text-white/70">No login. No real data. Just a demo with crumbs.</p>
        </div>
      </div>
    )

  // ---------- 2: Choose buddy ----------
  if (step === 1)
    return (
      <div className="flex h-full min-h-min flex-col bg-cream">
        <div className="flex items-center justify-between px-5 pt-5">
          {back}
          {dots}
          <span className="w-10" />
        </div>
        <div className="px-6 pt-4">
          <p className="hand text-2xl text-blue">step two</p>
          <h1 className="display text-[3rem] text-blue">
            Choose your
            <br />
            buddy
          </h1>
        </div>
        <div className="relative mx-6 mt-2 grid h-[15.5rem] place-items-center">
          <Blob className="absolute inset-0 m-auto h-60 w-60" />
          <Buddy key={species} species={species} mood="happy" size={180} bounceKey={1} title={SPECIES_INFO[species].label} />
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
        <div className="mt-auto px-6 pb-8 pt-4">
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
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-pink">
        <div className="flex items-center justify-between px-5 pt-5">
          {back}
          {dots}
          <span className="w-10" />
        </div>
        <div className="px-6 pt-4">
          <p className="hand text-2xl text-blue">step three</p>
          <h1 className="display text-[3rem] text-blue">
            Name your
            <br />
            buddy
          </h1>
        </div>
        <div className="mt-2 flex justify-center">
          <Buddy species={species} mood={buddyName ? 'excited' : 'idle'} size={130} title={buddyName || 'Your buddy'} />
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
          <div className="pt-6 pb-8">
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
    <div className="relative flex h-full min-h-min flex-col overflow-hidden bg-cream">
      <div className="px-5 pt-5">{dots}</div>
      <div className="relative mt-4 grid min-h-0 flex-1 place-items-center">
        <svg viewBox="0 0 300 300" className="spin-slow absolute h-[20rem] w-[20rem]" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M150 150 L128 0 L172 0 Z" fill="#FFC1E1" transform={`rotate(${i * 30} 150 150)`} />
          ))}
          <circle cx={150} cy={150} r={88} fill="#F8F6F1" />
        </svg>
        <Buddy species={species} mood="excited" size={200} bounceKey={2} title={name} />
      </div>
      <div className="relative px-6 text-center">
        <p className="hand text-2xl text-blue">{name} says:</p>
        <h1 className="display mt-1 text-[2.7rem] text-blue">
          You’re officially part of the dough!
        </h1>
        <Squiggle className="mx-auto mt-2 h-3 w-40" color="#FF8FC8" />
      </div>
      <div className="px-6 pt-6 pb-8">
        <button className="btn btn-blue w-full text-lg" onClick={finish}>
          Enter Bakery Club <ArrowRight size={20} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
