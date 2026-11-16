import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
import { openMediaHub, useMediaHub } from './state'
import { LINEUP, channelUp, powerToggle, useTuner, volumeStep } from './lineup'

// The one and only TV control: Power, Channel ▲▼, Volume ±, Guide.
// Shows when you hold the remote, use the TV (E), or are watching close-up.
// Keyboard while it's showing: [ ] channel · - = volume · G guide · P power.
export function TVRemote() {
  const electronics = useStore((s) => s.electronics), holding = useStore((s) => s.holdingRemote)
  const view = useMediaHub((s) => s.view), guideOpen = useMediaHub((s) => s.open)
  const show = !guideOpen && (electronics === 'tv' || holding || view !== 'room')
  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest?.('input, textarea')) return
      const k = e.code
      if (k === 'BracketRight' || k === 'PageUp') channelUp(1)
      else if (k === 'BracketLeft' || k === 'PageDown') channelUp(-1)
      else if (k === 'Equal' || k === 'NumpadAdd') volumeStep(0.1)
      else if (k === 'Minus' || k === 'NumpadSubtract') volumeStep(-0.1)
      else if (k === 'KeyG') openMediaHub()
      else if (k === 'KeyP') powerToggle()
      else return
      e.preventDefault(); e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [show])
  if (!show) return null
  return (
    <aside className="tv-remote" aria-label="TV remote" onPointerDown={(e) => e.stopPropagation()}>
      <button className="r-power" onClick={powerToggle} aria-label="Power">⏻</button>
      <div className="r-pair">
        <div className="r-col"><button onClick={() => channelUp(1)} aria-label="Channel up">▲</button><span>CH</span><button onClick={() => channelUp(-1)} aria-label="Channel down">▼</button></div>
        <div className="r-col"><button onClick={() => volumeStep(0.1)} aria-label="Volume up">+</button><span>VOL</span><button onClick={() => volumeStep(-0.1)} aria-label="Volume down">−</button></div>
      </div>
      <button className="r-guide" onClick={openMediaHub}>GUIDE</button>
      <small>[ ] ch · − = vol · G guide</small>
      {electronics === 'tv' && <button className="r-done" onClick={() => useStore.getState().setElectronics(null)}>put down</button>}
    </aside>
  )
}

/** On-screen display: channel number + name, or volume bar, like a real set. Lives inside the TV picture. */
export function ChannelOSD() {
  const { number, at } = useTuner()
  const vol = usePreferences((s) => s.tvVolume), power = usePreferences((s) => s.tvPower)
  const [, tick] = useState(0)
  useEffect(() => { const t = setTimeout(() => tick((n) => n + 1), 3100); return () => clearTimeout(t) }, [at])
  if (!power || !at || performance.now() - at > 3000) return null
  const ch = LINEUP.find((c) => c.number === number)
  return (
    <div className="tv-osd">
      {ch && <div className="tv-osd-ch"><b>{ch.number}</b><span>{ch.item.cable ? ch.item.title.replace(/^CH \d+ · /, '') : ch.item.title}</span></div>}
      <div className="tv-osd-vol">VOL {'▮'.repeat(Math.round(vol * 10))}{'▯'.repeat(10 - Math.round(vol * 10))}</div>
    </div>
  )
}
