import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apply, clearSaved, initialState, load, save } from './engine'
import type { Action, ClubState, Effect } from './types'

export type Screen = 'home' | 'pass' | 'treats' | 'moments' | 'buddy' | 'map' | 'story'

/** What the buddy just reacted to. The biggest moment of an action wins. */
export type ReactionKind = 'yum' | 'firstYum' | 'reward' | 'accessory'
export interface Reaction {
  kind: ReactionKind
  /** When it became visible. 0 = still waiting for the celebration overlays to finish. */
  shownAt: number
}

interface Store {
  state: ClubState
  dispatch: (a: Action) => void
  /** Celebration queue; the overlay layer consumes these one by one. */
  effects: Effect[]
  shiftEffect: () => void
  /** Timestamp of the last successful purchase, so the buddy can react. */
  lastYumAt: number
  reaction: Reaction | null
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

function reactionFor(a: Action, next: ClubState, fx: Effect[]): Reaction['kind'] | null {
  if (fx.some((e) => e.type === 'reward')) return 'reward'
  if (a.type === 'purchase' && next.transactions.filter((t) => t.kind === 'purchase').length === 1) return 'firstYum'
  if ((a.type === 'toggleAccessory' && next.equipped.includes(a.accessory)) || fx.some((e) => e.type === 'accessory')) return 'accessory'
  if (fx.some((e) => e.type === 'yum')) return 'yum'
  return null
}

export function ClubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClubState>(load)
  const [effects, setEffects] = useState<Effect[]>([])
  const [lastYumAt, setLastYumAt] = useState(0)
  const [reaction, setReaction] = useState<Reaction | null>(null)
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
    const kind = reactionFor(a, next, fx)
    const covers = fx.some((e) => e.type === 'yum' || e.type === 'reward' || e.type === 'chapter')
    if (kind) setReaction({ kind, shownAt: covers ? 0 : Date.now() })
  }, [])

  // The reaction only starts its clock once the overlays covering the buddy are gone, so nobody
  // misses it. Small toasts at the bottom don't cover the buddy.
  const covered = effects.some((e) => e.type === 'yum' || e.type === 'reward' || e.type === 'chapter')
  useEffect(() => {
    if (!covered && reaction && !reaction.shownAt) setReaction({ ...reaction, shownAt: Date.now() })
  }, [covered, reaction])

  const go = useCallback((s: Screen, opts?: { showQr?: boolean }) => {
    setScreen(s)
    setShowQr(!!opts?.showQr)
  }, [])

  const shiftEffect = useCallback(() => setEffects((q) => q.slice(1)), [])

  const reset = useCallback(() => {
    clearSaved()
    const fresh = initialState()
    stateRef.current = fresh
    setState(fresh)
    setEffects([])
    setReaction(null)
    setLastYumAt(0)
    setScreen('home')
    setShowQr(false)
    setPurchaseOpen(false)
    setDemoOpen(false)
    setAboutOpen(false)
  }, [])

  const value = useMemo<Store>(
    () => ({
      state,
      dispatch,
      effects,
      shiftEffect,
      lastYumAt,
      reaction,
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
    [state, dispatch, effects, shiftEffect, lastYumAt, reaction, screen, go, showQr, purchaseOpen, demoOpen, aboutOpen, reset],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useClub() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useClub must be used inside <ClubProvider>')
  return ctx
}
