import { ArrowLeft, Coffee, FlaskConical, Gift, Heart, MapPin, Shirt, Sparkles, Star, Sunrise, Wand2 } from 'lucide-react'
import { ScreenTitle } from '../components/ui'
import { useClub } from '../state/store'
import type { StoryKind } from '../state/types'

const ICON: Record<StoryKind, typeof Coffee> = {
  joined: Heart,
  purchase: Coffee,
  topup: FlaskConical,
  reward: Gift,
  redeemed: Gift,
  accessory: Shirt,
  chapter: Star,
  store: MapPin,
  challenge: Sparkles,
  wishlist: Wand2,
  earlyBird: Sunrise,
  demo: FlaskConical,
}

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(Date.now() - 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export function Story() {
  const { state, go } = useClub()
  const groups: { day: string; items: typeof state.story }[] = []
  for (const ev of state.story) {
    const day = dayLabel(ev.at)
    const g = groups[groups.length - 1]
    if (g && g.day === day) g.items.push(ev)
    else groups.push({ day, items: [ev] })
  }

  return (
    <div className="min-h-full bg-[radial-gradient(#0025ff22_1px,transparent_1px)] [background-size:18px_18px] pb-8">
      <div className="px-5 pt-5">
        <button onClick={() => go('moments')} className="flex items-center gap-1 text-sm font-bold text-blue">
          <ArrowLeft size={18} strokeWidth={2.5} /> Moments
        </button>
      </div>
      <ScreenTitle kicker="dear diary," title={<>My Bakery<br />Story</>}>
        <p className="mt-2 text-sm text-ink/75">Written only from things you actually did in this demo. No made-up memories.</p>
      </ScreenTitle>

      <div className="px-5">
        {groups.map((g) => (
          <section key={g.day} className="mt-4">
            <h2 className="hand inline-block -rotate-2 rounded-lg bg-pink px-3 text-2xl text-blue">{g.day}</h2>
            <ol className="relative mt-3 ml-4 border-l-[2.5px] border-dashed border-blue/50 pl-6">
              {g.items.map((ev, i) => {
                const Icon = ICON[ev.kind]
                const big = ev.kind === 'chapter' || ev.kind === 'reward' || ev.kind === 'joined'
                return (
                  <li key={ev.id} className="relative mb-4">
                    <span className={`absolute -left-[2.45rem] grid h-8 w-8 place-items-center rounded-full border-[2.5px] border-blue ${big ? 'bg-blue text-white' : 'bg-white text-blue'}`}>
                      <Icon size={15} strokeWidth={2.5} aria-hidden />
                    </span>
                    <div
                      className={`rounded-2xl border-2 border-blue bg-white px-4 py-2.5 shadow-[3px_3px_0_#FFC1E1] ${i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]'} ${ev.kind === 'topup' || ev.kind === 'demo' ? 'border-dashed opacity-80' : ''}`}
                    >
                      <p className={`hand leading-tight text-ink ${big ? 'text-[1.6rem]' : 'text-[1.35rem]'}`}>{ev.text}</p>
                      <p className="text-[0.68rem] font-bold tracking-wider text-blue/70 uppercase">{time(ev.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
        <p className="hand mt-2 text-center text-xl text-blue/70">…to be continued.</p>
      </div>
    </div>
  )
}
