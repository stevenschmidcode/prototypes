import { Gift, House, QrCode, Smile, Sparkles } from 'lucide-react'
import { availableRewards } from '../state/engine'
import { useClub, type Screen } from '../state/store'

const ITEMS: { id: Screen; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'treats', label: 'Treats', Icon: Gift },
  { id: 'pass', label: 'Pass', Icon: QrCode },
  { id: 'moments', label: 'Moments', Icon: Sparkles },
  { id: 'buddy', label: 'Buddy', Icon: Smile },
]

export function BottomNav() {
  const { screen, go, state } = useClub()
  const treats = availableRewards(state).length
  const active = (id: Screen) => screen === id || (id === 'moments' && (screen === 'map' || screen === 'story'))

  return (
    <nav aria-label="Main" className="relative z-20 shrink-0 border-t-[2.5px] border-blue bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
      <ul className="flex items-end justify-around">
        {ITEMS.map(({ id, label, Icon }) => {
          const isPass = id === 'pass'
          const on = active(id)
          return (
            <li key={id}>
              <button
                onClick={() => go(id, isPass ? { showQr: false } : undefined)}
                aria-current={on ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-[0.68rem] font-bold ${on ? 'text-blue' : 'text-ink/55'}`}
              >
                {isPass ? (
                  <span className={`-mt-6 grid h-14 w-14 place-items-center rounded-full border-[2.5px] border-blue ${on ? 'bg-blue text-white' : 'bg-pink text-blue'} shadow-[0_3px_0_#0025FF]`}>
                    <Icon size={24} strokeWidth={2.4} />
                  </span>
                ) : (
                  <span className={`grid h-8 w-11 place-items-center rounded-full ${on ? 'bg-pink' : ''}`}>
                    <Icon size={20} strokeWidth={2.4} />
                  </span>
                )}
                {label}
                {id === 'treats' && treats > 0 && (
                  <span className="absolute top-0 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1 text-[0.65rem] text-white" aria-label={`${treats} available`}>
                    {treats}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
