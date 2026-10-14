import { FlaskConical, X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

export function DemoTag({ children = 'Demo' }: { children?: ReactNode }) {
  return (
    <span className="demo-tag">
      <FlaskConical size={11} strokeWidth={2.5} aria-hidden />
      {children}
    </span>
  )
}

/** Hand-drawn underline squiggle */
export function Squiggle({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M2 7 C 12 1, 20 11, 30 6 S 48 1, 58 6 S 78 11, 88 6 S 108 1, 118 6" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
    </svg>
  )
}

/** Wobbly organic blob used as backdrop behind the buddy */
export function Blob({ className = '', fill = '#FFC1E1' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path
        d="M47 26 C78 4 132 6 160 30 C190 55 198 104 180 140 C162 178 112 198 70 186 C30 174 4 136 8 96 C11 64 22 43 47 26 Z"
        fill={fill}
      />
    </svg>
  )
}

/** Scalloped "stamp" shape for badges */
export function Stamp({ size = 56, fill = '#FFC1E1', children, className = '' }: { size?: number; fill?: string; children?: ReactNode; className?: string }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    const r = i % 2 ? 44 : 50
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`
  }).join(' ')
  return (
    <span className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <polygon points={pts} fill={fill} stroke="#0025FF" strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <span className="relative text-blue">{children}</span>
    </span>
  )
}

/** Bottom sheet inside the phone. Traps nothing fancy, but closes on Escape and backdrop click. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  tone = 'cream',
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  tone?: 'cream' | 'pink' | 'blue'
  labelledBy?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const bg = tone === 'pink' ? 'bg-pink' : tone === 'blue' ? 'bg-blue text-white' : 'bg-cream'
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button aria-label="Close" className="fade-in absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`slide-up relative max-h-[88%] overflow-y-auto no-scrollbar rounded-t-[2rem] border-t-[2.5px] border-blue ${bg} px-5 pb-8 pt-4 outline-none`}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-current opacity-25" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div id={labelledBy} className="min-w-0">
            {title}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-current">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ScreenTitle({ kicker, title, children }: { kicker?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="px-5 pt-5 pb-3">
      {kicker && <p className="hand text-xl text-blue">{kicker}</p>}
      <h1 className="display text-[2.6rem] text-blue">{title}</h1>
      {children}
    </header>
  )
}
