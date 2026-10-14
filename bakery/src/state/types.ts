export type Species = 'croissant' | 'bean' | 'bread'

export type Accessory = 'sunglasses' | 'chefHat' | 'scarf' | 'cup' | 'bag'

export type ChallengeId = 'firstBite' | 'coffeeExplorer' | 'somethingNew' | 'bakeryTourist' | 'earlyBird'

export type Chapter = 1 | 2 | 3 | 4

/** All money values are integer Rappen (CHF 1.00 = 100) to avoid float drift. */
export interface Transaction {
  id: string
  productId: string
  label: string
  amount: number
  at: string
  /** 'purchase' = simulated counter purchase, 'topup' = demo control shortcut */
  kind: 'purchase' | 'topup'
}

export interface Reward {
  id: string
  title: string
  earnedAt: string
  redeemedAt: string | null
}

export type StoryKind =
  | 'joined'
  | 'purchase'
  | 'topup'
  | 'reward'
  | 'redeemed'
  | 'accessory'
  | 'chapter'
  | 'store'
  | 'challenge'
  | 'wishlist'
  | 'earlyBird'
  | 'demo'

export interface StoryEvent {
  id: string
  kind: StoryKind
  at: string
  text: string
}

export interface ClubState {
  version: 1
  onboarded: boolean
  memberName: string
  memberNo: string
  buddy: { species: Species; name: string }
  transactions: Transaction[]
  rewards: Reward[]
  unlocked: Accessory[]
  equipped: Accessory[]
  tastedCoffees: string[]
  wishlist: string[]
  discoveredStores: string[]
  earlyBirdVisits: number
  completedChallenges: ChallengeId[]
  /** Non-monetary "moments" counter that drives buddy evolution. */
  buddyXp: number
  story: StoryEvent[]
  seq: number
}

export type Action =
  | { type: 'onboard'; species: Species; buddyName: string; memberName: string; memberNo: string }
  | { type: 'purchase'; txId: string; productId: string }
  | { type: 'topup'; txId: string; amount: number }
  | { type: 'unlockRewardNow'; txId: string }
  | { type: 'redeem'; rewardId: string }
  | { type: 'tasteCoffee'; coffeeId: string }
  | { type: 'pickNew'; productId: string }
  | { type: 'discoverStore'; storeId: string }
  | { type: 'earlyBird' }
  | { type: 'toggleAccessory'; accessory: Accessory }
  | { type: 'boostBuddy' }

export type Effect =
  | { type: 'yum'; amount: number; label: string }
  | { type: 'reward'; rewardId: string }
  | { type: 'chapter'; chapter: Chapter }
  | { type: 'accessory'; accessory: Accessory }
  | { type: 'challenge'; id: ChallengeId }
  | { type: 'note'; text: string }
