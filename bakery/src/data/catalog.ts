import type { Accessory, ChallengeId, Chapter } from '../state/types'

/** Fictional demo prices. Not the official Bakery Bakery price list. */
export interface DemoProduct {
  id: string
  label: string
  price: number
  emoji: string
  isCoffee: boolean
  quip: string
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'coffee', label: 'Coffee', price: 550, emoji: '☕', isCoffee: true, quip: 'Bean there, loved that.' },
  { id: 'croissant', label: 'Croissant', price: 490, emoji: '🥐', isCoffee: false, quip: 'Life’s better with crumbs.' },
  { id: 'sandwich', label: 'Sandwich', price: 980, emoji: '🥪', isCoffee: false, quip: 'Lunch, sorted.' },
  { id: 'combo', label: 'Bakery Combo', price: 1590, emoji: '🧺', isCoffee: true, quip: 'Oops. Too much deliciousness.' },
]

export const productById = (id: string) => DEMO_PRODUCTS.find((p) => p.id === id)

/** Coffee Explorer: discover specialties by flipping cards. No purchase needed. */
export const COFFEE_SPECIALTIES = [
  { id: 'espresso', label: 'Espresso', fact: 'Small cup, big personality. Italian for “pressed out”.' },
  { id: 'cappuccino', label: 'Cappuccino', fact: 'Named after the brown robes of Capuchin friars. Fashion icons.' },
  { id: 'flatwhite', label: 'Flat White', fact: 'Silky microfoam, no fluffy hat. Two countries claim to have invented it.' },
  { id: 'cortado', label: 'Cortado', fact: 'Espresso “cut” with a splash of warm plant milk.' },
  { id: 'iced', label: 'Iced Latte', fact: 'Coffee that learned to chill out.' },
]

/** Something New: a pick for next time. It stays a pick, nothing is sold here. */
export const TRY_NEXT = [
  { id: 'cinnamon', label: 'Cinnamon Bun', emoji: '🌀' },
  { id: 'focaccia', label: 'Focaccia', emoji: '🫓' },
  { id: 'cookie', label: 'Cookie', emoji: '🍪' },
  { id: 'cake', label: 'Cake Slice', emoji: '🍰' },
  { id: 'pretzel', label: 'Pretzel', emoji: '🥨' },
  { id: 'chai', label: 'Chai Latte', emoji: '🫖' },
]

export const REWARD_THRESHOLD = 15000 // CHF 150 (concept assumption, not an official offer)
export const REWARD_TITLE = 'Free coffee'

export const ACCESSORIES: Record<Accessory, { label: string; how: string }> = {
  sunglasses: { label: 'Sunglasses', how: 'Complete “First Bite”' },
  scarf: { label: 'Cosy Scarf', how: 'Reach Chapter 2' },
  cup: { label: 'Coffee Cup', how: 'Complete “Coffee Explorer”' },
  chefHat: { label: 'Chef’s Hat', how: 'Complete “Something New”' },
  bag: { label: 'Tiny Tote', how: 'Complete “Bakery Tourist”' },
}

export const CHAPTERS: Record<Chapter, { title: string; line: string; xp: number }> = {
  1: { title: 'Fresh Dough', line: 'New, curious and slightly floury.', xp: 0 },
  2: { title: 'Getting Toasty', line: 'Warming up. Rosy cheeks, cosy scarf.', xp: 3 },
  3: { title: 'Croissant Companion', line: 'Waves at strangers. Grins a lot.', xp: 7 },
  4: { title: 'Bakery Legend', line: 'Mostly dancing. Occasionally sprinkles.', xp: 12 },
}

export interface ChallengeDef {
  id: ChallengeId
  title: string
  blurb: string
  target: number
  unlock: Accessory | 'badge'
  icon: string
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'firstBite', title: 'First Bite', blurb: 'Simulate your very first purchase. Every story starts with a crumb.', target: 1, unlock: 'sunglasses', icon: 'croissant' },
  { id: 'coffeeExplorer', title: 'Coffee Explorer', blurb: 'Flip through three coffee specialties. Sniffing is optional.', target: 3, unlock: 'cup', icon: 'coffee' },
  { id: 'somethingNew', title: 'Something New', blurb: 'Pick something you haven’t tried yet. For next time, no rush.', target: 1, unlock: 'chefHat', icon: 'sparkles' },
  { id: 'bakeryTourist', title: 'Bakery Tourist', blurb: 'Discover another bakery on the map. Sightseeing, but tastier.', target: 1, unlock: 'bag', icon: 'map' },
  { id: 'earlyBird', title: 'Early Bird', blurb: 'Drop by a breakfast moment (demo). The early bird gets the bun.', target: 1, unlock: 'badge', icon: 'sunrise' },
]
