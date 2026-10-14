import { QRCodeSVG } from 'qrcode.react'
import { Buddy } from '../buddy/Buddy'
import { chapterOf } from '../state/engine'
import { useClub } from '../state/store'

/** The QR only identifies a demo member. It never credits anything by itself. */
export const qrPayload = (memberNo: string) => `BAKERYCLUB-DEMO|${memberNo}|NO-CREDIT-WITHOUT-POS`

export function PassCard({ compact = false }: { compact?: boolean }) {
  const { state } = useClub()
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border-[2.5px] border-blue bg-blue p-5 text-white shadow-[0_6px_0_#0B0B2B]">
      {/* decorative rings */}
      <svg viewBox="0 0 200 200" className="spin-slow pointer-events-none absolute -top-16 -right-16 h-56 w-56 opacity-25" aria-hidden>
        <defs>
          <path id="ring" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
        </defs>
        <text fontSize="17" fontWeight="800" fill="#FFC1E1" letterSpacing="3">
          <textPath href="#ring">GOOD THINGS ARE BAKING · GOOD THINGS ARE BAKING ·</textPath>
        </text>
      </svg>

      <div className="relative flex items-start justify-between">
        <div>
          <p className="display text-[1.7rem] leading-none">
            Bakery
            <br />
            Club
          </p>
          <p className="hand mt-1 text-lg text-pink">member pass</p>
        </div>
        <div className="-mt-3 -mr-2 rounded-full bg-pink/95 p-1">
          <Buddy species={state.buddy.species} chapter={chapterOf(state)} equipped={state.equipped} size={compact ? 64 : 78} animate={false} title={state.buddy.name} />
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-pink">Member</p>
          <p className="truncate text-lg font-bold">{state.memberName || 'Guest Baker'}</p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-pink">No. (fictional)</p>
          <p className="font-mono text-sm tracking-wider">{state.memberNo}</p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-pink">Buddy</p>
          <p className="truncate text-sm font-semibold">{state.buddy.name}</p>
        </div>
        {!compact && (
          <div className="shrink-0 rounded-2xl bg-white p-2">
            <QRCodeSVG value={qrPayload(state.memberNo)} size={92} fgColor="#0025FF" level="M" title="Demo member QR code" />
          </div>
        )}
      </div>
    </div>
  )
}
