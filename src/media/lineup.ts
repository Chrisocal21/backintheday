import { create } from 'zustand'
import { BUNDLED_MEDIA } from './catalog'
import { CABLE, cableCard } from './cable'
import { playMedia } from './state'
import { usePreferences } from '../preferences'
import type { MediaItem } from './types'

// Basic cable: every live channel gets a number, 2 through whatever, like the free tier.
// Channel up/down on the remote just flips through these; the Guide picks anything else.
const ORDER = ['Basement Cable', 'Live news', 'World news', 'Business news', 'Sports', 'Reruns', 'Cartoons', 'Music', 'Chill radio', 'Retro games', 'Nature', 'Space']
const rank = (i: MediaItem) => { const r = ORDER.indexOf(i.cable ? 'Basement Cable' : i.genre); return r < 0 ? ORDER.length : r }

export type Channel = { number: number; item: MediaItem }
export const LINEUP: Channel[] = (() => {
  const lib = BUNDLED_MEDIA.filter((i) => i.playback !== 'external')
  const live = [...CABLE.map((c) => cableCard(c, lib)), ...lib.filter((i) => i.kind === 'live')]
  // Basement Cable keeps its own numbers (3–10); live channels follow from 11 up.
  const cable = live.filter((i) => i.cable).map((item) => ({ number: CABLE.find((c) => c.id === item.cable)!.number, item }))
  const rest = live.filter((i) => !i.cable).sort((a, b) => rank(a) - rank(b)).map((item, k) => ({ number: 11 + k, item }))
  return [...cable, ...rest]
})()
export const channelNumberOf = (id: string) => LINEUP.find((c) => c.item.id === id)?.number

export const useTuner = create<{ number: number | null; at: number }>(() => ({ number: null, at: 0 }))

export function tune(number: number, keepView = true) {
  const ch = LINEUP.find((c) => c.number === number)
  if (!ch) return
  usePreferences.getState().change('tvPower', true)
  useTuner.setState({ number, at: performance.now() })
  playMedia(ch.item, { keepView })
}
export function channelUp(d: 1 | -1 = 1) {
  const cur = useTuner.getState().number
  const idx = cur === null ? (d > 0 ? -1 : 0) : LINEUP.findIndex((c) => c.number === cur)
  tune(LINEUP[(idx + d + LINEUP.length) % LINEUP.length].number)
}
export function volumeStep(d: number) {
  const p = usePreferences.getState()
  p.change('tvVolume', Math.max(0, Math.min(1, Math.round((p.tvVolume + d) * 10) / 10)))
  useTuner.setState({ at: performance.now() })
}
export function powerToggle() {
  const p = usePreferences.getState()
  p.change('tvPower', !p.tvPower)
  if (!p.tvPower && useTuner.getState().number === null) channelUp(1) // first power-on lands on CH 2
}
