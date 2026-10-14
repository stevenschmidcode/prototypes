import {
  ACCESSORIES,
  CHALLENGES,
  CHAPTERS,
  COFFEE_SPECIALTIES,
  REWARD_THRESHOLD,
  REWARD_TITLE,
  TRY_NEXT,
  productById,
} from '../data/catalog'
import { STORES } from '../data/stores'
import type { Accessory, Action, ChallengeId, Chapter, ClubState, Effect, StoryKind } from './types'

export const initialState = (): ClubState => ({
  version: 1,
  onboarded: false,
  memberName: '',
  memberNo: '',
  buddy: { species: 'croissant', name: '' },
  transactions: [],
  rewards: [],
  unlocked: [],
  equipped: [],
  tastedCoffees: [],
  wishlist: [],
  discoveredStores: [],
  earlyBirdVisits: 0,
  completedChallenges: [],
  buddyXp: 0,
  story: [],
  seq: 0,
})

// ---------- Derived values ----------

export const totalCollected = (s: ClubState) => s.transactions.reduce((sum, t) => sum + t.amount, 0)

/** Amount collected towards the *next* reward. Surplus carries over automatically. */
export const progressTowardsNext = (s: ClubState) => totalCollected(s) % REWARD_THRESHOLD

export const remainingToNext = (s: ClubState) => REWARD_THRESHOLD - progressTowardsNext(s)

export const availableRewards = (s: ClubState) => s.rewards.filter((r) => !r.redeemedAt)
export const redeemedRewards = (s: ClubState) => s.rewards.filter((r) => r.redeemedAt)

export const purchaseCount = (s: ClubState) => s.transactions.filter((t) => t.kind === 'purchase').length

export const chapterFor = (xp: number): Chapter =>
  xp >= CHAPTERS[4].xp ? 4 : xp >= CHAPTERS[3].xp ? 3 : xp >= CHAPTERS[2].xp ? 2 : 1

export const chapterOf = (s: ClubState) => chapterFor(s.buddyXp)

export const challengeProgress = (s: ClubState, id: ChallengeId): number => {
  switch (id) {
    case 'firstBite':
      return purchaseCount(s)
    case 'coffeeExplorer':
      return s.tastedCoffees.length
    case 'somethingNew':
      return s.wishlist.length
    case 'bakeryTourist':
      return s.discoveredStores.length
    case 'earlyBird':
      return s.earlyBirdVisits
  }
}

export const formatChf = (rappen: number) => `CHF ${(rappen / 100).toFixed(2).replace(/\.00$/, '')}`
export const formatChfExact = (rappen: number) => `CHF ${(rappen / 100).toFixed(2)}`

// ---------- Reducer ----------

export interface Result {
  state: ClubState
  effects: Effect[]
}

const MAX_STORY = 200

function nextId(s: ClubState, prefix: string): [ClubState, string] {
  const seq = s.seq + 1
  return [{ ...s, seq }, `${prefix}-${seq}`]
}

function addStory(s: ClubState, kind: StoryKind, text: string, at: string): ClubState {
  const [s2, id] = nextId(s, 'ev')
  return { ...s2, story: [{ id, kind, at, text }, ...s2.story].slice(0, MAX_STORY) }
}

function unlockAccessory(s: ClubState, a: Accessory, at: string, effects: Effect[]): ClubState {
  if (s.unlocked.includes(a)) return s
  effects.push({ type: 'accessory', accessory: a })
  const next = {
    ...s,
    unlocked: [...s.unlocked, a],
    // Auto-wear new things so the change is immediately visible. Can be taken off.
    equipped: s.equipped.includes(a) ? s.equipped : [...s.equipped, a],
  }
  return addStory(next, 'accessory', `${s.buddy.name} got a new ${ACCESSORIES[a].label.toLowerCase()}.`, at)
}

/**
 * After every action, bring derived bookkeeping in line:
 * rewards owed by the money total, completed challenges and the buddy chapter.
 * Money and buddy evolution are deliberately separate tracks.
 */
function settle(prev: ClubState, s: ClubState, at: string, effects: Effect[]): ClubState {
  // 1. Rewards: one per full CHF 150 of lifetime total. Never removed, never duplicated.
  const owed = Math.floor(totalCollected(s) / REWARD_THRESHOLD)
  while (s.rewards.length < owed) {
    let id: string
    ;[s, id] = nextId(s, 'reward')
    s = { ...s, rewards: [...s.rewards, { id, title: REWARD_TITLE, earnedAt: at, redeemedAt: null }] }
    effects.push({ type: 'reward', rewardId: id })
    s = addStory(s, 'reward', s.rewards.length === 1 ? 'You unlocked your first treat.' : 'Another treat unlocked. Coffee’s on us.', at)
  }

  // 2. Challenges (Bakery Moments)
  for (const c of CHALLENGES) {
    if (s.completedChallenges.includes(c.id)) continue
    if (challengeProgress(s, c.id) >= c.target) {
      s = { ...s, completedChallenges: [...s.completedChallenges, c.id], buddyXp: s.buddyXp + 1 }
      effects.push({ type: 'challenge', id: c.id })
      s = addStory(s, 'challenge', `Bakery Moment complete: ${c.title}.`, at)
      if (c.unlock !== 'badge') s = unlockAccessory(s, c.unlock, at, effects)
    }
  }

  // 3. Buddy chapters, driven by moments rather than money
  const before = chapterFor(prev.buddyXp)
  const after = chapterFor(s.buddyXp)
  for (let ch = before + 1; ch <= after; ch++) {
    const chapter = ch as Chapter
    effects.push({ type: 'chapter', chapter })
    s = addStory(s, 'chapter', `New chapter: ${CHAPTERS[chapter].title}.`, at)
    if (chapter === 2) s = unlockAccessory(s, 'scarf', at, effects)
  }
  return s
}

export function apply(prev: ClubState, action: Action, at: string = new Date().toISOString()): Result {
  const effects: Effect[] = []
  let s = prev

  switch (action.type) {
    case 'onboard': {
      s = {
        ...initialState(),
        onboarded: true,
        memberName: action.memberName.trim(),
        memberNo: action.memberNo,
        buddy: { species: action.species, name: action.buddyName.trim() || 'Buddy' },
      }
      s = addStory(s, 'joined', `${s.buddy.name} joined the Bakery Club. You're officially part of the dough!`, at)
      return { state: s, effects }
    }

    case 'purchase': {
      const product = productById(action.productId)
      // Guard: unknown product or a transaction id we have already seen => no credit.
      if (!product || s.transactions.some((t) => t.id === action.txId)) return { state: prev, effects }
      const hadCoffee = s.transactions.some((t) => t.kind === 'purchase' && productById(t.productId)?.isCoffee)
      const isFirst = purchaseCount(s) === 0
      s = {
        ...s,
        transactions: [...s.transactions, { id: action.txId, productId: product.id, label: product.label, amount: product.price, at, kind: 'purchase' }],
        buddyXp: s.buddyXp + 1,
      }
      effects.push({ type: 'yum', amount: product.price, label: product.label })
      const text =
        product.isCoffee && !hadCoffee
          ? 'Your first coffee.'
          : isFirst
            ? `Your first bite: a ${product.label.toLowerCase()}.`
            : `A ${product.label.toLowerCase()}. +${formatChfExact(product.price)} collected.`
      s = addStory(s, 'purchase', text, at)
      break
    }

    case 'topup': {
      if (action.amount <= 0 || s.transactions.some((t) => t.id === action.txId)) return { state: prev, effects }
      s = {
        ...s,
        transactions: [...s.transactions, { id: action.txId, productId: 'demo-topup', label: 'Demo top-up', amount: action.amount, at, kind: 'topup' }],
      }
      effects.push({ type: 'yum', amount: action.amount, label: 'Demo top-up' })
      s = addStory(s, 'topup', `Demo control: +${formatChfExact(action.amount)} added.`, at)
      break
    }

    case 'unlockRewardNow':
      return apply(prev, { type: 'topup', txId: action.txId, amount: remainingToNext(prev) }, at)

    case 'redeem': {
      const r = s.rewards.find((x) => x.id === action.rewardId)
      if (!r || r.redeemedAt) return { state: prev, effects }
      s = { ...s, rewards: s.rewards.map((x) => (x.id === r.id ? { ...x, redeemedAt: at } : x)) }
      s = addStory(s, 'redeemed', 'Treat redeemed. Enjoy that coffee (in this demo).', at)
      break
    }

    case 'tasteCoffee': {
      if (!COFFEE_SPECIALTIES.some((c) => c.id === action.coffeeId) || s.tastedCoffees.includes(action.coffeeId)) return { state: prev, effects }
      s = { ...s, tastedCoffees: [...s.tastedCoffees, action.coffeeId] }
      break
    }

    case 'pickNew': {
      const item = TRY_NEXT.find((p) => p.id === action.productId)
      if (!item || s.wishlist.includes(item.id)) return { state: prev, effects }
      s = { ...s, wishlist: [...s.wishlist, item.id], buddyXp: s.buddyXp + 1 }
      s = addStory(s, 'wishlist', `Put the ${item.label.toLowerCase()} on your try-next list.`, at)
      break
    }

    case 'discoverStore': {
      const store = STORES.find((x) => x.id === action.storeId)
      if (!store || s.discoveredStores.includes(store.id)) return { state: prev, effects }
      s = { ...s, discoveredStores: [...s.discoveredStores, store.id], buddyXp: s.buddyXp + 1 }
      s = addStory(s, 'store', `You explored a new bakery: ${store.name}, ${store.city}.`, at)
      break
    }

    case 'earlyBird': {
      s = { ...s, earlyBirdVisits: s.earlyBirdVisits + 1, buddyXp: s.buddyXp + 1 }
      s = addStory(s, 'earlyBird', 'An early-bird breakfast moment (demo). Good things take thyme.', at)
      break
    }

    case 'toggleAccessory': {
      if (!s.unlocked.includes(action.accessory)) return { state: prev, effects }
      const on = s.equipped.includes(action.accessory)
      s = { ...s, equipped: on ? s.equipped.filter((a) => a !== action.accessory) : [...s.equipped, action.accessory] }
      return { state: s, effects }
    }

    case 'boostBuddy': {
      const ch = chapterOf(s)
      if (ch === 4) return { state: prev, effects }
      const target = CHAPTERS[(ch + 1) as Chapter].xp
      s = { ...s, buddyXp: target }
      s = addStory(s, 'demo', 'Demo control: buddy evolution fast-forwarded.', at)
      break
    }
  }

  return { state: settle(prev, s, at, effects), effects }
}

// ---------- Persistence ----------

export const STORAGE_KEY = 'bakery-club:v1'

export function load(): ClubState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<ClubState>
    if (parsed.version !== 1) return initialState()
    return { ...initialState(), ...parsed }
  } catch {
    return initialState()
  }
}

export function save(s: ClubState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable (private mode). The demo still works in-memory. */
  }
}

export function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export const makeMemberNo = () => {
  const n = () => Math.floor(1000 + Math.random() * 9000)
  return `BC-${n()}-${n()}`
}

export const makeTxId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
