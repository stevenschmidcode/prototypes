import { ArrowLeft, Check, ExternalLink, MapPin } from 'lucide-react'
import { useState } from 'react'
import { ScreenTitle } from '../components/ui'
import { STORES, STORES_SOURCE, mapsUrl } from '../data/stores'
import { useClub } from '../state/store'

const CITIES = ['Bern', 'Zürich', 'Basel', 'Luzern', 'Winterthur']
const CITY_LABEL: Record<string, { x: number; y: number }> = {
  Bern: { x: 60, y: 150 },
  Zürich: { x: 200, y: 84 },
  Basel: { x: 64, y: 30 },
  Luzern: { x: 166, y: 130 },
  Winterthur: { x: 218, y: 28 },
}

export function MapScreen() {
  const { state, dispatch, go } = useClub()
  const [city, setCity] = useState<string>('Bern')
  const found = state.discoveredStores

  return (
    <div className="pb-8">
      <div className="px-5 pt-5">
        <button onClick={() => go('moments')} className="flex items-center gap-1 text-sm font-bold text-blue">
          <ArrowLeft size={18} strokeWidth={2.5} /> Moments
        </button>
      </div>
      <ScreenTitle kicker="the" title="Bakery Map">
        <p className="mt-2 text-sm text-ink/75">
          {found.length} of {STORES.length} bakeries discovered. Tap a city, then discover a spot.
        </p>
      </ScreenTitle>

      {/* hand-drawn, not-to-scale map */}
      <div className="card relative mx-5 overflow-hidden bg-pink p-2">
        <svg viewBox="0 0 320 200" className="w-full" role="group" aria-label="Hand-drawn map of bakery cities">
          <path
            d="M40 52 C60 22 98 18 128 30 C150 16 190 20 214 28 C244 18 280 26 294 52 C306 80 286 98 282 120 C278 150 252 170 220 166 C196 182 160 186 134 176 C108 186 72 184 52 166 C26 150 14 120 22 96 C16 78 26 64 40 52 Z"
            fill="#FFFFFF"
            stroke="#0025FF"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path d="M112 132 C140 110 170 108 180 106 C196 90 204 70 208 62" fill="none" stroke="#0025FF" strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" opacity={0.6} />
          <path d="M102 44 C130 54 170 60 208 62 L232 46" fill="none" stroke="#0025FF" strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" opacity={0.6} />
          {STORES.map((s) => {
            const on = found.includes(s.id)
            return <circle key={s.id} cx={s.x} cy={s.y} r={on ? 5.5 : 4} fill={on ? '#0025FF' : '#FFC1E1'} stroke="#0025FF" strokeWidth={2} />
          })}
          {CITIES.map((c) => (
            <g key={c} role="button" tabIndex={0} aria-label={`Show ${c}`} onClick={() => setCity(c)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setCity(c)} className="cursor-pointer outline-none">
              <rect x={CITY_LABEL[c].x - 4} y={CITY_LABEL[c].y - 14} width={c.length * 8.4 + 8} height={20} rx={10} fill={city === c ? '#0025FF' : '#FFFFFF'} stroke="#0025FF" strokeWidth={2} />
              <text x={CITY_LABEL[c].x} y={CITY_LABEL[c].y} fontSize={13} fontWeight={800} fill={city === c ? '#FFFFFF' : '#0025FF'}>
                {c}
              </text>
            </g>
          ))}
        </svg>
        <p className="hand absolute right-4 bottom-1 text-base text-blue">not to scale. very much hand-drawn.</p>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="City">
        {CITIES.map((c) => (
          <button key={c} role="tab" aria-selected={city === c} onClick={() => setCity(c)} className={`chip shrink-0 !py-1.5 !text-xs ${city === c ? '!bg-blue !text-white' : ''}`}>
            {c}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-3 px-5">
        {STORES.filter((s) => s.city === city).map((s) => {
          const on = found.includes(s.id)
          return (
            <li key={s.id} className={`rounded-[1.4rem] border-[2.5px] border-blue p-4 ${on ? 'bg-blue text-white' : 'bg-white'}`}>
              <div className="flex items-start gap-3">
                <MapPin className={on ? 'text-pink' : 'text-blue'} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="display text-lg normal-case">{s.name}</p>
                  <p className={`text-sm ${on ? 'text-white/85' : 'text-ink/70'}`}>{s.address}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => dispatch({ type: 'discoverStore', storeId: s.id })}
                  disabled={on}
                  className={`btn flex-1 !py-2 text-sm ${on ? 'btn-pink !opacity-100' : 'btn-blue'}`}
                >
                  {on ? (
                    <>
                      <Check size={16} strokeWidth={3} /> Discovered
                    </>
                  ) : (
                    'Discover'
                  )}
                </button>
                <a href={mapsUrl(s)} target="_blank" rel="noopener noreferrer" className="btn btn-white !py-2 text-sm" aria-label={`Directions to ${s.name} (opens Google Maps)`}>
                  <ExternalLink size={16} /> Route
                </a>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 px-5 text-xs leading-relaxed text-ink/60">
        Addresses as published on {STORES_SOURCE} (Oct 2026). Opening hours aren’t shown here on purpose, so please check the official website. “Discover” is a demo interaction, no location tracking.
      </p>
    </div>
  )
}
