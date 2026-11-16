import type { MediaItem } from './types'
import live from './live.json'

// ---- Real live channels: official 24/7 YouTube streams. Their video ids change when a
// broadcaster restarts a stream, so refresh with: node tools/check-live-channels.mjs
// If one goes stale the TV shows NO SIGNAL with a link to the channel's live page.
export const LIVE_CHANNELS = live as MediaItem[]

// ---- Basement Cable: themed channels that run on the clock, built from the free library.
// Tune in and you land mid-show, like real TV. When a show ends the next one comes on.
export type Cable = { id: string; number: number; name: string; slotMin: number; match: (i: MediaItem) => boolean }
export const CABLE: Cable[] = [
  { id: 'saturday', number: 3, name: 'Saturday Morning Cartoons', slotMin: 8, match: (i) => /cartoon/i.test(i.genre) },
  { id: 'reruns', number: 4, name: 'Night Owl Reruns', slotMin: 26, match: (i) => /classic tv/i.test(i.genre) },
  { id: 'creature', number: 5, name: 'Creature Feature', slotMin: 75, match: (i) => /sci-fi|horror/i.test(i.genre) },
  { id: 'silver', number: 6, name: 'Silver Screen Classics', slotMin: 90, match: (i) => /feature film|comedy|noir/i.test(i.genre) },
  { id: 'silent', number: 7, name: 'Silent Theater', slotMin: 25, match: (i) => /silent/i.test(i.genre) },
  { id: 'jukebox', number: 8, name: 'Video Jukebox', slotMin: 4, match: (i) => i.kind === 'music-video' },
  { id: 'adbreak', number: 9, name: 'Commercial Break', slotMin: 1, match: (i) => /commercial/i.test(i.genre) },
  { id: 'newsreel', number: 10, name: 'Newsreel Network', slotMin: 10, match: (i) => /newsreel|short/i.test(i.genre) },
]

// Deterministic shuffle so every visitor sees the same "schedule" for a given time.
const hash = (n: number) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return (x ^ (x >>> 16)) >>> 0 }

/** What's on this cable channel right now, starting at the right point in the show. */
export function tuneCable(c: Cable, library: MediaItem[], now = Date.now()): MediaItem | null {
  const pool = library.filter((i) => i.playback !== 'external' && c.match(i))
  if (!pool.length) return null
  const slotMs = c.slotMin * 60000
  const slot = Math.floor(now / slotMs)
  const show = pool[hash(slot * 31 + c.number) % pool.length]
  return { ...show, cable: c.id, startAt: (now % slotMs) / 1000, title: `CH ${c.number} · ${c.name}: ${show.title}` }
}

export function cableCard(c: Cable, library: MediaItem[]): MediaItem {
  return { id: 'cable-' + c.id, title: `CH ${c.number} · ${c.name}`, kind: 'live', genre: 'Basement Cable', era: 'Now', year: `CH ${String(c.number).padStart(2, '0')}`, playback: 'video', url: '', source: '', credit: `${library.filter(c.match).length} shows in rotation`, note: 'Always on.', verified: '', cable: c.id }
}
