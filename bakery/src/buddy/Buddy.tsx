import { useId, type ReactNode } from 'react'
import type { Accessory, Chapter, Species } from '../state/types'

export const BLUE = '#0025FF'
export const PINK = '#FFC1E1'
export const CREAM = '#F8F6F1'
export const WHITE = '#FFFFFF'
export const INK = '#0B0B2B'

export type Mood = 'idle' | 'happy' | 'excited' | 'yum'
type Pose = 'idle' | 'wave' | 'cheer'

interface Pt {
  x: number
  y: number
}

/** Shared skeleton: every species exposes the same anchor points, so poses and accessories work for all. */
interface Anatomy {
  eyes: [number, number]
  eyeY: number
  mouthY: number
  cheekDx: number
  top: Pt
  scarf: { y: number; w: number }
  shoulders: [Pt, Pt]
  legs: [number, number]
  legTop: number
  feature: string
  hand: string
  Body: () => ReactNode
}

const STROKE = 4.5

const ANATOMY: Record<Species, Anatomy> = {
  croissant: {
    eyes: [87, 113],
    eyeY: 102,
    mouthY: 117,
    cheekDx: 25,
    top: { x: 100, y: 66 },
    scarf: { y: 136, w: 96 },
    shoulders: [
      { x: 34, y: 122 },
      { x: 166, y: 122 },
    ],
    legs: [82, 118],
    legTop: 140,
    feature: BLUE,
    hand: WHITE,
    Body: () => (
      <g stroke={BLUE} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M26 140 C17 96 58 64 100 64 C142 64 183 96 174 140 C164 153 148 147 140 137 C122 147 78 147 60 137 C52 147 36 153 26 140 Z"
          fill={PINK}
        />
        <path d="M61 75 C52 98 54 121 60 137" fill="none" />
        <path d="M139 75 C148 98 146 121 140 137" fill="none" />
        <path d="M39 100 C34 113 34 125 39 136" fill="none" />
        <path d="M161 100 C166 113 166 125 161 136" fill="none" />
      </g>
    ),
  },
  bean: {
    eyes: [87, 113],
    eyeY: 126,
    mouthY: 143,
    cheekDx: 27,
    top: { x: 100, y: 55 },
    scarf: { y: 162, w: 78 },
    shoulders: [
      { x: 53, y: 128 },
      { x: 147, y: 128 },
    ],
    legs: [86, 114],
    legTop: 172,
    feature: WHITE,
    hand: PINK,
    Body: () => (
      <g stroke={BLUE} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx={100} cy={116} rx={50} ry={62} fill={BLUE} />
        <path d="M100 60 C84 74 116 90 99 106" fill="none" stroke={PINK} strokeWidth={4} />
      </g>
    ),
  },
  bread: {
    eyes: [86, 114],
    eyeY: 138,
    mouthY: 155,
    cheekDx: 30,
    top: { x: 100, y: 63 },
    scarf: { y: 171, w: 126 },
    shoulders: [
      { x: 42, y: 148 },
      { x: 158, y: 148 },
    ],
    legs: [78, 122],
    legTop: 182,
    feature: BLUE,
    hand: WHITE,
    Body: () => (
      <g stroke={BLUE} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M40 176 L40 112 C40 78 66 62 100 62 C134 62 160 78 160 112 L160 176 Q160 183 153 183 L47 183 Q40 183 40 176 Z"
          fill={WHITE}
        />
        <path
          d="M40 112 C40 78 66 62 100 62 C134 62 160 78 160 112 C152 104 142 118 131 109 C121 119 110 104 100 113 C90 104 80 119 69 109 C58 118 48 104 40 112 Z"
          fill={PINK}
        />
        <path d="M74 80 L83 94 M96 73 L105 89 M119 78 L127 92" fill="none" />
      </g>
    ),
  },
}

export interface BuddyProps {
  species: Species
  mood?: Mood
  chapter?: Chapter
  equipped?: Accessory[]
  size?: number
  animate?: boolean
  /** Changing this key restarts the little "yay" jump. */
  bounceKey?: number
  title?: string
  className?: string
}

export function Buddy({
  species,
  mood = 'idle',
  chapter = 1,
  equipped = [],
  size = 180,
  animate = true,
  bounceKey,
  title,
  className = '',
}: BuddyProps) {
  const uid = useId().replace(/:/g, '')
  const a = ANATOMY[species]
  const has = (x: Accessory) => equipped.includes(x)

  const pose: Pose = mood === 'excited' || chapter === 4 ? 'cheer' : chapter === 3 || mood === 'happy' ? 'wave' : 'idle'
  const expression: Mood = mood !== 'idle' ? mood : chapter === 4 ? 'excited' : chapter === 3 ? 'happy' : 'idle'
  const showCheeks = chapter >= 2 || expression !== 'idle'

  const [sl, sr] = a.shoulders
  // Hands. The bag keeps the left hand down; the cup keeps the right hand at chest height unless cheering.
  const leftUp = pose === 'cheer' && !has('bag')
  const rightUp = pose === 'cheer' || pose === 'wave'
  const lh: Pt = leftUp ? { x: sl.x - 22, y: sl.y - 34 } : { x: sl.x - 16, y: sl.y + 32 }
  const rh: Pt = rightUp ? { x: sr.x + 24, y: sr.y - 34 } : has('cup') ? { x: sr.x + 14, y: sr.y + 18 } : { x: sr.x + 16, y: sr.y + 32 }

  return (
    <svg
      viewBox="0 0 200 222"
      width={size}
      height={size * 1.11}
      role="img"
      aria-label={title ?? `${species} buddy`}
      className={`relative ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id={`wob-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={species.length * 7} />
          <feDisplacementMap in="SourceGraphic" scale={2.6} />
        </filter>
      </defs>

      <ellipse cx={100} cy={212} rx={50} ry={6} fill={BLUE} opacity={0.12} />

      <g className={animate ? (chapter === 4 ? 'buddy-dance' : 'buddy-bob') : ''}>
        <g key={bounceKey} className={animate && bounceKey ? 'buddy-jump' : ''}>
          {chapter === 4 && <Sparkles animate={animate} />}
          <g filter={`url(#wob-${uid})`}>
            {/* legs */}
            <g stroke={BLUE} strokeWidth={STROKE} strokeLinecap="round" fill={BLUE}>
              <path d={`M${a.legs[0]} ${a.legTop} L${a.legs[0] - 3} 204`} fill="none" />
              <path d={`M${a.legs[1]} ${a.legTop} L${a.legs[1] + 3} 204`} fill="none" />
              <ellipse cx={a.legs[0] - 9} cy={206} rx={11} ry={5.5} />
              <ellipse cx={a.legs[1] + 9} cy={206} rx={11} ry={5.5} />
            </g>

            {/* left arm (behind body) */}
            <Arm from={sl} to={lh} hand={a.hand} side={-1} />

            <a.Body />

            {/* cheeks */}
            {showCheeks && (
              <g fill={species === 'bean' ? PINK : '#FF8FC8'} opacity={species === 'bean' ? 0.9 : 0.75}>
                <ellipse cx={100 - a.cheekDx} cy={a.eyeY + 10} rx={6.5} ry={4} />
                <ellipse cx={100 + a.cheekDx} cy={a.eyeY + 10} rx={6.5} ry={4} />
              </g>
            )}

            {/* face */}
            {!has('sunglasses') && <Eyes a={a} expression={expression} species={species} animate={animate} />}
            <Mouth x={100} y={a.mouthY} color={a.feature} expression={expression} />

            {has('scarf') && <Scarf y={a.scarf.y} w={a.scarf.w} />}

            {has('sunglasses') ? (
              <Shades cx={100} cy={a.eyeY} dx={(a.eyes[1] - a.eyes[0]) / 2} />
            ) : (
              species === 'croissant' && (
                // Croissant Kid's signature: shades pushed up on the forehead
                <g transform="translate(100 80) rotate(-7) scale(0.62) translate(-100 -80)">
                  <Shades cx={100} cy={80} dx={13} />
                </g>
              )
            )}

            {has('chefHat') && <ChefHat x={a.top.x} y={a.top.y} />}

            {/* right arm (in front) */}
            <g
              className={animate && pose === 'wave' && !has('cup') ? 'buddy-wave' : ''}
              style={{ transformOrigin: `${sr.x}px ${sr.y}px`, transformBox: 'view-box' }}
            >
              {has('cup') && <Cup x={rh.x} y={rh.y - 4} animate={animate} />}
              <Arm from={sr} to={rh} hand={a.hand} side={1} />
            </g>

            {has('bag') && <Bag x={lh.x} y={lh.y} />}
          </g>
        </g>
      </g>
    </svg>
  )
}

function Arm({ from, to, hand, side }: { from: Pt; to: Pt; hand: string; side: 1 | -1 }) {
  const cx = (from.x + to.x) / 2 + side * 8
  const cy = (from.y + to.y) / 2 + 6
  return (
    <g stroke={BLUE} strokeWidth={STROKE} strokeLinecap="round">
      <path d={`M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`} fill="none" />
      <circle cx={to.x} cy={to.y} r={6.5} fill={hand} strokeWidth={3.5} />
    </g>
  )
}

function Eyes({ a, expression, species, animate }: { a: Anatomy; expression: Mood; species: Species; animate: boolean }) {
  const c = a.feature
  if (expression === 'excited' || expression === 'yum' || expression === 'happy') {
    return (
      <g stroke={c} strokeWidth={4} strokeLinecap="round" fill="none">
        {a.eyes.map((x) => (
          <path key={x} d={`M${x - 6} ${a.eyeY + 2} Q${x} ${a.eyeY - 7} ${x + 6} ${a.eyeY + 2}`} />
        ))}
      </g>
    )
  }
  return (
    <g className={animate ? 'buddy-blink' : ''} style={{ transformOrigin: `100px ${a.eyeY}px`, transformBox: 'view-box' }}>
      {a.eyes.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={a.eyeY} rx={4.8} ry={5.8} fill={c} />
          <circle cx={x + 1.6} cy={a.eyeY - 2} r={1.6} fill={species === 'bean' ? BLUE : WHITE} />
          {species === 'bread' && (
            // relaxed, slightly sleepy lids
            <path d={`M${x - 7} ${a.eyeY - 3} Q${x} ${a.eyeY - 6} ${x + 7} ${a.eyeY - 3}`} stroke={c} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          )}
        </g>
      ))}
    </g>
  )
}

function Mouth({ x, y, color, expression }: { x: number; y: number; color: string; expression: Mood }) {
  switch (expression) {
    case 'excited':
      return (
        <g>
          <path d={`M${x - 10} ${y - 3} Q${x} ${y + 15} ${x + 10} ${y - 3} Z`} fill={INK} stroke={color} strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx={x} cy={y + 5} rx={4.5} ry={2.8} fill="#FF8FC8" />
        </g>
      )
    case 'yum':
      return (
        <g strokeLinecap="round">
          <path d={`M${x - 10} ${y - 1} Q${x} ${y + 10} ${x + 10} ${y - 1}`} stroke={color} strokeWidth={4} fill="none" />
          <path d={`M${x + 3} ${y + 3} q4 9 9 2`} fill="#FF8FC8" stroke={color} strokeWidth={2.5} />
        </g>
      )
    case 'happy':
      return <path d={`M${x - 11} ${y - 2} Q${x} ${y + 12} ${x + 11} ${y - 2}`} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
    default:
      return <path d={`M${x - 7} ${y} Q${x} ${y + 6} ${x + 7} ${y}`} stroke={color} strokeWidth={4} strokeLinecap="round" fill="none" />
  }
}

function Shades({ cx, cy, dx }: { cx: number; cy: number; dx: number }) {
  return (
    <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
      <rect x={cx - dx - 12} y={cy - 7} width={24} height={14} rx={6} fill={INK} />
      <rect x={cx + dx - 12} y={cy - 7} width={24} height={14} rx={6} fill={INK} />
      <path d={`M${cx - dx + 12} ${cy - 2} Q${cx} ${cy - 6} ${cx + dx - 12} ${cy - 2}`} fill="none" />
      <path d={`M${cx - dx - 6} ${cy - 3} l5 -2 M${cx + dx - 6} ${cy - 3} l5 -2`} stroke={PINK} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

function ChefHat({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`rotate(-8 ${x} ${y})`} stroke={BLUE} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round">
      <path
        d={`M${x - 24} ${y - 4} C${x - 42} ${y - 10} ${x - 36} ${y - 38} ${x - 16} ${y - 32} C${x - 12} ${y - 52} ${x + 12} ${y - 52} ${x + 16} ${y - 32} C${x + 36} ${y - 38} ${x + 42} ${y - 10} ${x + 24} ${y - 4} Z`}
        fill={WHITE}
      />
      <rect x={x - 24} y={y - 8} width={48} height={13} rx={4} fill={WHITE} />
      <path d={`M${x - 8} ${y - 20} q2 -8 6 -10 M${x + 8} ${y - 18} q2 -6 4 -8`} fill="none" strokeWidth={2.5} />
    </g>
  )
}

function Scarf({ y, w }: { y: number; w: number }) {
  const x0 = 100 - w / 2
  return (
    <g stroke={BLUE} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${100 + w / 5} ${y + 2} l6 30 l13 -3 l-5 -28 Z`} fill={PINK} />
      <path d={`M${100 + w / 5 + 6} ${y + 32} l1 6 M${100 + w / 5 + 12} ${y + 31} l1 6 M${100 + w / 5 + 18} ${y + 30} l1 6`} fill="none" strokeWidth={2.5} />
      <rect x={x0} y={y - 7} width={w} height={15} rx={7.5} fill={PINK} />
      {Array.from({ length: Math.floor(w / 14) }, (_, i) => (
        <path key={i} d={`M${x0 + 10 + i * 14} ${y - 5} l-3 11`} fill="none" strokeWidth={2.5} />
      ))}
    </g>
  )
}

function Cup({ x, y, animate }: { x: number; y: number; animate: boolean }) {
  return (
    <g stroke={BLUE} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round">
      <g className={animate ? 'buddy-steam' : ''} fill="none" strokeWidth={2.5}>
        <path d={`M${x - 3} ${y - 20} q-4 -5 0 -10 q4 -5 0 -10`} />
        <path d={`M${x + 4} ${y - 20} q-4 -5 0 -10`} />
      </g>
      <path d={`M${x - 10} ${y - 13} L${x + 10} ${y - 13} L${x + 7} ${y + 13} Q${x + 6.5} ${y + 16} ${x + 3} ${y + 16} L${x - 3} ${y + 16} Q${x - 6.5} ${y + 16} ${x - 7} ${y + 13} Z`} fill={WHITE} />
      <path d={`M${x - 9} ${y - 3} L${x + 9} ${y - 3} L${x + 8} ${y + 6} L${x - 8} ${y + 6} Z`} fill={PINK} strokeWidth={2.5} />
      <rect x={x - 12} y={y - 17} width={24} height={5} rx={2.5} fill={WHITE} />
    </g>
  )
}

function Bag({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={BLUE} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${x - 8} ${y + 8} Q${x} ${y - 8} ${x + 8} ${y + 8}`} fill="none" />
      <path d={`M${x - 14} ${y + 7} L${x + 14} ${y + 7} L${x + 12} ${y + 31} L${x - 12} ${y + 31} Z`} fill={PINK} />
      <path
        d={`M${x} ${y + 25} c-7 -4 -7 -10 -3 -11 c2 0 3 2 3 3 c0 -1 1 -3 3 -3 c4 1 4 7 -3 11 Z`}
        fill={BLUE}
        strokeWidth={1.5}
      />
    </g>
  )
}

function Sparkles({ animate }: { animate: boolean }) {
  const star = (x: number, y: number, r: number, fill: string, delay: number) => (
    <path
      key={`${x}-${y}`}
      className={animate ? 'buddy-twinkle' : ''}
      style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
      d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`}
      fill={fill}
      stroke={BLUE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  )
  return (
    <g>
      {star(22, 58, 10, PINK, 0)}
      {star(182, 44, 12, WHITE, 0.4)}
      {star(186, 160, 8, PINK, 0.8)}
      {star(14, 172, 7, WHITE, 1.2)}
      <g fill={BLUE} opacity={0.8}>
        <circle cx={40} cy={30} r={3} />
        <circle cx={160} cy={20} r={2.5} />
        <circle cx={194} cy={104} r={3} />
        <circle cx={6} cy={118} r={2.5} />
      </g>
    </g>
  )
}

export const SPECIES_INFO: Record<Species, { label: string; tagline: string; names: string[] }> = {
  croissant: {
    label: 'Croissant Kid',
    tagline: 'A little cheeky. Flaky in the best way.',
    names: ['Sir Crumbs', 'Captain Croissant', 'Flaky McFlakeface', 'Croissanto'],
  },
  bean: {
    label: 'Coffee Bean',
    tagline: 'Wide awake. Possibly too awake.',
    names: ['Beanjamin', 'Espresso Patronum', 'Bean Diesel', 'Mocha Montana'],
  },
  bread: {
    label: 'Bread Buddy',
    tagline: 'Chill. Rises to every occasion.',
    names: ['Loafy', 'Bready Mercury', 'Doughvid Bowie', 'Sourdough Sam'],
  },
}
