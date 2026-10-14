/**
 * Locations as published on https://www.bakerybakery.ch/standorte (retrieved Oct 2026).
 * Opening hours are intentionally not shown. Please check the official website.
 * x/y are positions on the hand-drawn, not-to-scale map (viewBox 0 0 320 200).
 */
export interface Store {
  id: string
  name: string
  city: string
  address: string
  x: number
  y: number
}

export const STORES: Store[] = [
  { id: 'bern-bhf', name: 'Bern Bhf', city: 'Bern', address: 'Bahnhofplatz 10A, 3011 Bern', x: 108, y: 128 },
  { id: 'breitenrain', name: 'Breitenrain', city: 'Bern', address: 'Schärerstrasse 23, 3014 Bern', x: 114, y: 122 },
  { id: 'holligerplatz', name: 'Holligerplatz', city: 'Bern', address: 'Holligerplatz 1, 3008 Bern', x: 102, y: 133 },
  { id: 'bollwerk', name: 'Bollwerk', city: 'Bern', address: 'Bollwerk 15, 3011 Bern', x: 111, y: 131 },
  { id: 'laenggasse', name: 'Länggasse', city: 'Bern', address: 'Falkenplatz 9, 3012 Bern', x: 104, y: 124 },
  { id: 'zuerich-hb', name: 'Zürich HB', city: 'Zürich', address: 'Museumstrasse 1, 8001 Zürich', x: 208, y: 62 },
  { id: 'schaffhauserplatz', name: 'Schaffhauserplatz', city: 'Zürich', address: 'Hotzestrasse 65, 8006 Zürich', x: 213, y: 56 },
  { id: 'basel-bhf', name: 'Basel Bhf', city: 'Basel', address: 'Güterstrasse 115, 4053 Basel', x: 102, y: 42 },
  { id: 'winterthur-bhf', name: 'Winterthur Bhf', city: 'Winterthur', address: 'Bahnhofplatz 5, 8400 Winterthur', x: 232, y: 44 },
  { id: 'roesslimatt', name: 'Rösslimatt', city: 'Luzern', address: 'Bürgenstrasse 10, 6005 Luzern', x: 182, y: 108 },
  { id: 'bundesstrasse', name: 'Bundesstrasse', city: 'Luzern', address: 'Bundesstrasse, 6003 Luzern', x: 176, y: 104 },
]

export const STORES_SOURCE = 'bakerybakery.ch/standorte'

export const mapsUrl = (s: Store) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Bakery Bakery ${s.address}`)}`
