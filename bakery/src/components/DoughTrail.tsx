import { useLayoutEffect, useRef, useState } from 'react'
import { REWARD_THRESHOLD } from '../data/catalog'

const PATH = 'M18 92 C 60 92, 52 30, 98 34 S 134 96, 178 82 S 226 22, 262 30 S 300 70, 302 70'

/**
 * Organic progress indicator: a winding "dough trail" from the bakery door to your next coffee.
 * The filled part of the path shows collected value; a little croissant marks where you are.
 */
export function DoughTrail({ progress, threshold = REWARD_THRESHOLD }: { progress: number; threshold?: number }) {
  const ref = useRef<SVGPathElement>(null)
  const pct = Math.max(0, Math.min(1, progress / threshold))
  const [pos, setPos] = useState({ x: 18, y: 92 })
  const [len, setLen] = useState(0)

  useLayoutEffect(() => {
    const p = ref.current
    if (!p || typeof p.getTotalLength !== 'function') return
    const total = p.getTotalLength()
    setLen(total)
    const pt = p.getPointAtLength(total * pct)
    setPos({ x: pt.x, y: pt.y })
  }, [pct])

  const milestones = [0.2, 0.4, 0.6, 0.8]

  return (
    <svg
      viewBox="0 0 320 120"
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={threshold / 100}
      aria-valuenow={Math.round(progress) / 100}
      aria-label="Progress to your next treat"
    >
      {/* track */}
      <path d={PATH} fill="none" stroke="#FFC1E1" strokeWidth={18} strokeLinecap="round" />
      <path d={PATH} fill="none" stroke="#0025FF" strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" opacity={0.5} />
      {/* progress */}
      <path
        ref={ref}
        d={PATH}
        fill="none"
        stroke="#0025FF"
        strokeWidth={18}
        strokeLinecap="round"
        strokeDasharray={len ? `${len * pct} ${len}` : undefined}
        style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.3,.7,.3,1)' }}
        opacity={pct === 0 ? 0 : 1}
      />
      {/* crumbs = milestones every CHF 30 */}
      {len > 0 &&
        milestones.map((m) => {
          const pt = ref.current!.getPointAtLength(len * m)
          const done = pct >= m
          return <circle key={m} cx={pt.x} cy={pt.y} r={4} fill={done ? '#FFC1E1' : '#FFFFFF'} stroke="#0025FF" strokeWidth={2} />
        })}
      {/* goal: coffee cup */}
      <g transform="translate(286 44)">
        <path d="M0 6 L28 6 L24 34 Q23 38 19 38 L9 38 Q5 38 4 34 Z" fill="#FFFFFF" stroke="#0025FF" strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M28 12 q9 1 7 10 q-2 7 -9 6" fill="none" stroke="#0025FF" strokeWidth={2.5} />
        <path d="M9 0 q-3 -4 0 -8 M17 0 q-3 -4 0 -8" fill="none" stroke="#0025FF" strokeWidth={2} strokeLinecap="round" />
        <rect x={5} y={16} width={18} height={9} rx={2} fill="#FFC1E1" stroke="#0025FF" strokeWidth={2} />
      </g>
      {/* you-are-here croissant */}
      <g transform={`translate(${pos.x} ${pos.y})`} style={{ transition: 'transform 0.9s cubic-bezier(.3,.7,.3,1)' }}>
        <g transform="translate(-17 -26)">
          <path
            d="M2 22 C0 8 10 2 17 2 C24 2 34 8 32 22 C29 26 26 24 24 21 C20 24 14 24 10 21 C8 24 5 26 2 22 Z"
            fill="#FFC1E1"
            stroke="#0025FF"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <path d="M10 5 C8 11 9 17 10 21 M24 5 C26 11 25 17 24 21" fill="none" stroke="#0025FF" strokeWidth={2} />
          <circle cx={14.5} cy={12} r={1.6} fill="#0025FF" />
          <circle cx={19.5} cy={12} r={1.6} fill="#0025FF" />
        </g>
      </g>
    </svg>
  )
}
