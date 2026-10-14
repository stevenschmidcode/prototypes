import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Maximize2, ShieldCheck, ShoppingBag } from 'lucide-react'
import { PassCard, qrPayload } from '../components/PassCard'
import { DemoTag, ScreenTitle } from '../components/ui'
import { formatChfExact } from '../state/engine'
import { useClub } from '../state/store'

export function Pass() {
  const { state, showQr, setShowQr, setPurchaseOpen } = useClub()
  const recent = [...state.transactions].reverse().slice(0, 4)

  if (showQr)
    return (
      <div className="flex min-h-full flex-col bg-blue px-5 pt-5 pb-8 text-white">
        <button onClick={() => setShowQr(false)} className="flex items-center gap-1 self-start text-sm font-bold" aria-label="Back to pass">
          <ArrowLeft size={18} strokeWidth={2.5} /> Pass
        </button>
        <h1 className="display mt-4 text-[3rem]">
          Scan &<br />
          <span className="text-pink">Collect</span>
        </h1>
        <div className="pop-in mx-auto mt-6 rounded-[2rem] border-[3px] border-pink bg-white p-5 shadow-[0_6px_0_#0B0B2B]">
          <QRCodeSVG value={qrPayload(state.memberNo)} size={210} fgColor="#0025FF" level="M" title="Demo member QR code" />
          <p className="mt-3 text-center font-mono text-sm tracking-wider text-blue">{state.memberNo}</p>
        </div>
        <p className="hand mt-4 text-center text-3xl text-pink">Show this at the counter.</p>

        <div className="mt-6 rounded-[1.6rem] border-2 border-dashed border-white/50 p-4">
          <div className="flex items-center justify-between">
            <DemoTag>Demo mode</DemoTag>
            <span className="text-xs text-white/70">no real till connected</span>
          </div>
          <p className="mt-2 text-sm text-white/85">Pretend you just paid at the counter. The demo plays the part of the bakery’s till.</p>
          <button className="btn btn-pink mt-3 w-full" onClick={() => setPurchaseOpen(true)}>
            <ShoppingBag size={18} strokeWidth={2.5} /> Simulate a purchase
          </button>
        </div>
        <p className="mt-4 flex gap-2 text-xs leading-relaxed text-white/75">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
          This code only identifies a (fictional) member. Scanning it never credits anything on its own. In a real product, only a trusted point-of-sale system would confirm a purchase.
        </p>
      </div>
    )

  return (
    <div className="pb-8">
      <ScreenTitle kicker="your" title="Bakery Pass" />
      <div className="px-5">
        <PassCard />
        <button className="btn btn-blue mt-5 w-full" onClick={() => setShowQr(true)}>
          <Maximize2 size={18} strokeWidth={2.5} /> Show QR big
        </button>
        <button className="btn btn-white mt-3 w-full" onClick={() => setPurchaseOpen(true)}>
          <ShoppingBag size={18} strokeWidth={2.5} /> Simulate a purchase <DemoTag />
        </button>

        <h2 className="mt-7 text-xs font-bold tracking-[0.15em] text-blue uppercase">Latest collects</h2>
        {recent.length === 0 ? (
          <p className="mt-2 rounded-2xl border-2 border-dashed border-blue/40 p-4 text-sm text-ink/70">Nothing yet. Your first croissant is out there somewhere.</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-dashed divide-blue/20 rounded-2xl border-[2.5px] border-blue bg-white px-4">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold">
                  {t.label} {t.kind === 'topup' && <DemoTag>control</DemoTag>}
                </span>
                <span className="font-bold text-blue">+{formatChfExact(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
