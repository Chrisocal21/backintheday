// Scroll-wheel "push through" detection: keep scrolling past a limit to trigger a takeover.
// Browsers only allow real fullscreen after a click/key, so a wheel takeover fills the window
// (and tries real fullscreen, which works when the page already has permission).
export function makePush(threshold = 240) {
  let acc = 0, last = 0
  return (deltaY: number, dir: 'in' | 'out') => {
    const now = performance.now()
    if (now - last > 400) acc = 0
    last = now
    const amt = dir === 'in' ? -deltaY : deltaY
    if (amt <= 0) { acc = 0; return false }
    acc += amt
    if (acc >= threshold) { acc = 0; return true }
    return false
  }
}
export function tryFullscreen(el?: Element | null) {
  const target = (el as HTMLElement | null) ?? document.documentElement
  if (!document.fullscreenElement) target.requestFullscreen?.().catch(() => {})
}
export function leaveFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
}
export const wheelAmount = (e: WheelEvent) => e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 300 : 1)
