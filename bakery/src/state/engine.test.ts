import { describe, expect, it } from 'vitest'
import {
  apply,
  clearSaved,
  load,
  save,
  availableRewards,
  chapterOf,
  initialState,
  progressTowardsNext,
  redeemedRewards,
  remainingToNext,
  totalCollected,
} from './engine'
import type { Action, ClubState } from './types'

const run = (actions: Action[], start: ClubState = onboarded()) =>
  actions.reduce((s, a) => apply(s, a).state, start)

const onboarded = () =>
  apply(initialState(), { type: 'onboard', species: 'bean', buddyName: 'Beanjamin', memberName: 'Test', memberNo: 'BC-1' }).state

let n = 0
const buy = (productId: string): Action => ({ type: 'purchase', txId: `t${++n}`, productId })
const topup = (amount: number): Action => ({ type: 'topup', txId: `t${++n}`, amount })

describe('loyalty engine', () => {
  it('adds purchases in Rappen without float drift', () => {
    const s = run([buy('coffee'), buy('croissant'), buy('sandwich')])
    expect(totalCollected(s)).toBe(550 + 490 + 980)
  })

  it('unlocks a reward at exactly CHF 150 and keeps the surplus', () => {
    let s = run([topup(14000)])
    expect(s.rewards).toHaveLength(0)
    expect(remainingToNext(s)).toBe(1000)
    s = run([buy('combo')], s) // +15.90 -> 155.90
    expect(s.rewards).toHaveLength(1)
    expect(progressTowardsNext(s)).toBe(590)
  })

  it('creates multiple rewards correctly from one large amount', () => {
    const s = run([topup(45500)])
    expect(s.rewards).toHaveLength(3)
    expect(progressTowardsNext(s)).toBe(500)
  })

  it('never credits the same transaction twice', () => {
    const s1 = run([{ type: 'purchase', txId: 'dup', productId: 'coffee' }])
    const s2 = apply(s1, { type: 'purchase', txId: 'dup', productId: 'coffee' }).state
    expect(totalCollected(s2)).toBe(550)
    expect(s2).toBe(s1)
  })

  it('ignores unknown products', () => {
    const s = run([buy('caviar')])
    expect(totalCollected(s)).toBe(0)
  })

  it('tracks redeemed rewards separately and only once', () => {
    let s = run([topup(30000)])
    const id = s.rewards[0].id
    s = run([{ type: 'redeem', rewardId: id }, { type: 'redeem', rewardId: id }], s)
    expect(availableRewards(s)).toHaveLength(1)
    expect(redeemedRewards(s)).toHaveLength(1)
    // Redeeming must not change the collected total or the earned count
    expect(totalCollected(s)).toBe(30000)
    expect(s.rewards).toHaveLength(2)
  })

  it('unlockRewardNow tops up exactly the remaining amount', () => {
    const s = run([buy('sandwich'), { type: 'unlockRewardNow', txId: 'u1' }])
    expect(s.rewards).toHaveLength(1)
    expect(progressTowardsNext(s)).toBe(0)
  })

  it('evolves the buddy without spending money', () => {
    const s = run([
      { type: 'discoverStore', storeId: 'bern-bhf' },
      { type: 'tasteCoffee', coffeeId: 'espresso' },
      { type: 'tasteCoffee', coffeeId: 'cortado' },
      { type: 'tasteCoffee', coffeeId: 'iced' },
      { type: 'pickNew', productId: 'cookie' },
      { type: 'earlyBird' },
    ])
    expect(totalCollected(s)).toBe(0)
    expect(chapterOf(s)).toBeGreaterThanOrEqual(2)
    expect(s.unlocked).toEqual(expect.arrayContaining(['bag', 'cup', 'chefHat', 'scarf']))
  })

  it('completes First Bite and unlocks sunglasses on the first purchase', () => {
    const { state, effects } = apply(onboarded(), buy('croissant'))
    expect(state.completedChallenges).toContain('firstBite')
    expect(state.unlocked).toContain('sunglasses')
    expect(effects.map((e) => e.type)).toEqual(['yum', 'challenge', 'accessory'])
  })

  it('only lets unlocked accessories be worn', () => {
    const s = run([{ type: 'toggleAccessory', accessory: 'chefHat' }])
    expect(s.equipped).toEqual([])
  })

  it('builds the story only from real demo actions, newest first', () => {
    const s = run([buy('coffee')])
    expect(s.story[s.story.length - 1].kind).toBe('joined')
    expect(s.story.map((e) => e.text)).toContain('Your first coffee.')
  })

  it('boostBuddy advances exactly one chapter', () => {
    const s = run([{ type: 'boostBuddy' }])
    expect(chapterOf(s)).toBe(2)
  })
})

describe('loyalty engine: edge cases (1.1)', () => {
  it('rejects zero and negative amounts', () => {
    const s0 = run([buy('coffee')])
    expect(apply(s0, topup(0)).state).toBe(s0)
    expect(apply(s0, topup(-5000)).state).toBe(s0)
    expect(totalCollected(s0)).toBe(550)
  })

  it('carries the surplus over several rewards in a row', () => {
    // 3 × 140 = 420 -> two rewards, 120 towards the third
    const s = run([topup(14000), topup(14000), topup(14000)])
    expect(s.rewards).toHaveLength(2)
    expect(progressTowardsNext(s)).toBe(12000)
    expect(remainingToNext(s)).toBe(3000)
  })

  it('keeps earned rewards when some are redeemed and more are earned', () => {
    let s = run([topup(15000)])
    s = run([{ type: 'redeem', rewardId: s.rewards[0].id }, topup(30000)], s)
    expect(s.rewards).toHaveLength(3)
    expect(redeemedRewards(s)).toHaveLength(1)
    expect(availableRewards(s)).toHaveLength(2)
  })

  it('survives a save/load round trip and a reset', () => {
    const store = new Map<string, string>()
    const ls = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }
    ;(globalThis as { localStorage?: unknown }).localStorage = ls
    const s = run([buy('combo'), topup(15000)])
    save(s)
    expect(load()).toEqual(s)
    clearSaved()
    expect(load()).toEqual(initialState())
    delete (globalThis as { localStorage?: unknown }).localStorage
  })
})
