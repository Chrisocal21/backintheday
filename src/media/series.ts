import type { MediaItem } from './types'

// Group the guide into series/collections: "The Lucy Show", "Charlie Chaplin", "Betty Boop"…
// Known names first (matched on title + credit), then a generic "Series - Episode" prefix rule.
const KNOWN: [RegExp, string][] = [
  [/\blucy\b|\bviv\b.*lucy/i, 'The Lucy Show'],
  [/chaplin/i, 'Charlie Chaplin'],
  [/betty boop/i, 'Betty Boop'],
  [/popeye/i, 'Popeye'],
  [/superman/i, 'Superman cartoons'],
  [/(three|3) stooges/i, 'The Three Stooges'],
  [/laurel (and|&) hardy/i, 'Laurel & Hardy'],
  [/buster keaton|keaton/i, 'Buster Keaton'],
  [/harold lloyd/i, 'Harold Lloyd'],
  [/beverly hillbillies/i, 'The Beverly Hillbillies'],
  [/andy griffith|\bandy\b.*(mayberry|opie)|wife for andy/i, 'The Andy Griffith Show'],
  [/sherlock holmes/i, 'Sherlock Holmes'],
  [/lone ranger/i, 'The Lone Ranger'],
  [/bonanza/i, 'Bonanza'],
  [/dragnet/i, 'Dragnet'],
  [/cisco kid/i, 'The Cisco Kid'],
  [/hopalong/i, 'Hopalong Cassidy'],
  [/roy rogers/i, 'Roy Rogers'],
  [/dick tracy/i, 'Dick Tracy'],
  [/flash gordon/i, 'Flash Gordon'],
  [/you bet your life|groucho/i, 'Groucho Marx'],
  [/jack benny/i, 'The Jack Benny Program'],
  [/burns (and|&) allen/i, 'Burns & Allen'],
  [/jackie gleason|honeymooners/i, 'Jackie Gleason'],
  [/topper\b/i, 'Topper'],
  [/robin hood/i, 'Robin Hood'],
  [/little rascals|our gang/i, 'The Little Rascals'],
  [/abbott (and|&) costello/i, 'Abbott & Costello'],
  [/felix the cat/i, 'Felix the Cat'],
  [/casper/i, 'Casper'],
  [/woody woodpecker/i, 'Woody Woodpecker'],
  [/bugs bunny|daffy|porky|looney tunes|merrie melodies/i, 'Looney Tunes'],
  [/mighty mouse/i, 'Mighty Mouse'],
  [/campaign|election/i, 'Election ads'],
  [/\bunivac\b|computer commercial/i, 'Computer ads'],
]

function prefixOf(title: string) {
  const m = title.match(/^(.{3,40}?)\s*(?:[-–:|]|\bEp(?:isode)?\.?\s*\d|\bS\d+\s*E\d+|#\d)/i)
  if (!m) return null
  const p = m[1].replace(/^the\s+/i, '').replace(/["“”']/g, '').trim()
  // Too short or generic to be a series name ("Over", "Part", "Reel 2"…)
  return /^\d+$/.test(p) || p.length < 6 || /^(part|reel|vol(ume)?|chapter|over|under|after|before|news)\b/i.test(p) ? null : p
}

export function seriesOf(i: MediaItem): string | null {
  if (i.kind === 'live') return null // live channels are organized by genre chips instead
  const hay = `${i.title} ${i.credit}`
  for (const [re, name] of KNOWN) if (re.test(hay)) return name
  if (i.kind === 'music-video') { const a = i.title.split(/\s[-–]\s/)[0]; return a && a !== i.title ? a.trim() : null }
  return prefixOf(i.title)
}

export type GuideRow = { kind: 'item'; item: MediaItem } | { kind: 'series'; name: string; items: MediaItem[] }

/** Collapse items into series rows (2+ episodes); everything else stays a single row. */
export function groupRows(items: MediaItem[]): GuideRow[] {
  const by = new Map<string, MediaItem[]>()
  for (const i of items) { const s = seriesOf(i); if (s) by.set(s, [...(by.get(s) ?? []), i]) }
  const rows: GuideRow[] = []
  const done = new Set<string>()
  for (const i of items) {
    const s = seriesOf(i)
    if (s && (by.get(s)?.length ?? 0) >= 2) {
      if (!done.has(s)) { done.add(s); rows.push({ kind: 'series', name: s, items: by.get(s)! }) }
    } else rows.push({ kind: 'item', item: i })
  }
  // Collections first (biggest first), then single titles.
  return [...rows.filter((r) => r.kind === 'series').sort((a, b) => (b as any).items.length - (a as any).items.length), ...rows.filter((r) => r.kind === 'item')]
}
