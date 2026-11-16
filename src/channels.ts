// Curated channels, one per era. Every id here was checked for embed support
// (YouTube oEmbed) on 2026-11-15. Re-check when adding: see docs/02-open-questions.md #4.
// These are placeholder picks to prove the TV works; the final lineup is still open.
export type Channel = { number: number; era: string; videos: string[] }

export const CHANNELS: Channel[] = [
  { number: 3, era: '70s', videos: ['fJ9rUzIMcZQ', 'I_izvAbhExY'] },
  { number: 4, era: '80s', videos: ['djV11Xbc914', 'dQw4w9WgXcQ'] },
  { number: 5, era: '90s', videos: ['hTWKbfoikeg', '4fndeDfaWCg'] },
  { number: 6, era: '2000s', videos: ['y6120QOlsfU', 'CvBfHwUxHIk'] },
]
