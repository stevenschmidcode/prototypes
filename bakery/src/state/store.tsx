import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apply, clearSaved, initialState, load, save } from './engine'
import type { Action, ClubState, Effect } from './types'

export type Screen = 'home' | 'pass' | 'treats' | 'moments' | 'buddy' | 'map' | 'story'

interface Store {
  state: ClubState
  dispatch: (a: Action) => void
  /** Celebration queue; the overlay layer consumes these one by one. */
  effects: Effect[]
  shiftEffect: () => void
  /** Timestamp of the last successful purchase, so the buddy can react. */
  lastYumAt: number
  screen: Screen
  go: (s: Screen, opts?: { showQr?: boolean }) => void
  showQr: boolean
  setShowQr: (v: boolean) => void
  purchaseOpen: boolean
  setPurchaseOpen: (v: boolean) => void
  demoOpen: boolean
  setDemoOpen: (v: boolean) => void
  aboutOpen: boolean
  setAboutOpen: (v: boolean) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClubState>(load)
  const [effects, setEffects] = useState<Effect[]>([])
  const [lastYumAt, setLastYumAt] = useState(0)
  const [screen, setScreen] = useState<Screen>('home')
  const [showQr, setShowQr] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
    save(state)
  }, [state])

  const dispatch = useCallback((a: Action) => {
    const { state: next, effects: fx } = apply(stateRef.current, a)
    if (next === stateRef.current) return
    stateRef.current = next
    setState(next)
    if (fx.some((e) => e.type === 'yum')) setLastYumAt(Date.now())
    if (fx.length) setEffects((q) => [...q, ...fx])
  }, [])

  const go = useCallback((s: Screen, opts?: { showQr?: boolean }) => {
    setScreen(s)
    setShowQr(!!opts?.showQr)
  }, [])

  const reset = useCallback(() => {
    clearSaved()
    const fresh = initialState()
    stateRef.current = fresh
    setState(fresh)
    setEffects([])
    setScreen('home')
    setShowQr(false)
    setPurchaseOpen(false)
    setDemoOpen(false)
  }, [])

  const value = useMemo<Store>(
    () => ({
      state,
      dispatch,
      effects,
      shiftEffect: () => setEffects((q) => q.slice(1)),
      lastYumAt,
      screen,
      go,
      showQr,
      setShowQr,
      purchaseOpen,
      setPurchaseOpen,
      demoOpen,
      setDemoOpen,
      aboutOpen,
      setAboutOpen,
      reset,
    }),
    [state, dispatch, effects, lastYumAt, screen, go, showQr, purchaseOpen, demoOpen, aboutOpen, reset],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useClub() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useClub must be used inside <ClubProvider>')
  return ctx
}
