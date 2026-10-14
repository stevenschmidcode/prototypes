import { useEffect, useRef, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { AboutSheet, Celebrations, DemoPanel, PurchaseSheet } from './components/Overlays'
import { Landing } from './desktop/Landing'
import { BuddyScreen } from './screens/BuddyScreen'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { Moments } from './screens/Moments'
import { Onboarding } from './screens/Onboarding'
import { Pass } from './screens/Pass'
import { Story } from './screens/Story'
import { Treats } from './screens/Treats'
import { ClubProvider, useClub } from './state/store'

const SCREENS = { home: Home, pass: Pass, treats: Treats, moments: Moments, buddy: BuddyScreen, map: MapScreen, story: Story }

/** The phone app. Overlays are absolutely positioned so they stay inside the phone frame on desktop. */
function ClubApp() {
  const { state, screen, showQr } = useClub()
  const scroller = useRef<HTMLElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [screen, showQr])

  const Current = SCREENS[screen]
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-cream">
      {!state.onboarded ? (
        <Onboarding />
      ) : (
        <>
          <main ref={scroller} className="no-scrollbar relative flex-1 overflow-y-auto overscroll-contain">
            <Current />
          </main>
          <BottomNav />
          <PurchaseSheet />
          <DemoPanel />
          <AboutSheet />
          <Celebrations />
        </>
      )}
    </div>
  )
}

function useIsDesktop() {
  const q = '(min-width: 1024px) and (min-height: 640px)'
  const [match, setMatch] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return match
}

export default function App() {
  const desktop = useIsDesktop()
  return (
    <ClubProvider>
      {desktop ? (
        <Landing app={<ClubApp />} />
      ) : (
        <div className="mx-auto h-dvh max-w-[480px] overflow-hidden sm:border-x-[2.5px] sm:border-blue">
          <ClubApp />
        </div>
      )}
    </ClubProvider>
  )
}
