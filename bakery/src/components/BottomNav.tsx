import { Gift, House, QrCode, Smile } from 'lucide-react'
import { availableRewards } from '../state/engine'
import { useClub, type Screen } from '../state/store'

// Four tabs, one level. Moments, Story and Map are reached from Home.
const ITEMS: { id: Screen; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'pass', label: 'Pass', Icon: QrCode },
  { id: 'treats', label: 'Treats', Icon: Gift },
  { id: 'buddy', label: 'Buddy', Icon: Smile },
]

export function BottomNav() {
  const { screen, go, state } = useClub()
  const treats = availableRewards(state).length
  const active = (id: Screen) => screen === id || (id === 'home' && (screen === 'moments' || screen === 'map' || screen === 'story'))

  return (
    <nav aria-label="Main" className="relative z-20 shrink-0 border-t-[2.5px] border-blue bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = active(id)
          return (
            <li key={id} className="flex justify-center">
              <button
                onClick={() => go(id, id === 'pass' ? { showQr: false } : undefined)}
                aria-current={on ? 'page' : undefined}
                className={`relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-[0.72rem] font-bold ${on ? 'text-blue' : 'text-ink/70'}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full border-2 transition-colors ${on ? 'border-blue bg-pink' : 'border-transparent'}`}>
                  <Icon size={20} strokeWidth={2.4} aria-hidden />
                </span>
                {label}
                {id === 'treats' && treats > 0 && (
                  <span className="absolute top-0 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1 text-[0.65rem] text-white">
                    {treats}
                    <span className="sr-only"> available</span>
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
