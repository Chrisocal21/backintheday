import { useEffect } from 'react'
import { audio, tone } from './audio'
import { usePreferences } from './preferences'

// Only devices make sound (TV, records, iPod, cassette, games). No room/house/weather ambience:
// Chris asked for no background noises. The rain loop used to start at full volume on the first
// click (a loud static burst) — removed along with hum, pipes, footsteps, thunder and the clock.
export function startHouseAudio() {
  const c = audio(), out = c.createGain(), cassette = c.createGain()
  out.gain.value = 0; cassette.gain.value = 0 // start silent; never pop on the first click
  out.connect(c.destination); cassette.connect(out)
  const update = () => {
    const p = usePreferences.getState(), t = c.currentTime
    out.gain.setTargetAtTime(p.master, t, 0.1)
    cassette.gain.setTargetAtTime(p.cassettePlaying ? p.cassetteVolume : 0, t, 0.1)
  }
  update(); const unsub = usePreferences.subscribe(update)
  let beat = 0
  // The original after-hours mixtape on the cassette deck (only while it's playing).
  const timer = window.setInterval(() => {
    if (c.state !== 'running') return
    const p = usePreferences.getState(), t = c.currentTime; beat++
    if (p.cassettePlaying) {
      const chord = [130.81, 174.61, 164.81, 146.83][Math.floor(beat / 4) % 4]
      tone(c, cassette, t, chord, 1.8, 0.035, 'triangle'); tone(c, cassette, t, chord * 1.5, 1.4, 0.018, 'sine')
    }
  }, 1000)
  return () => { unsub(); clearInterval(timer); out.disconnect() }
}

export function HouseAudio() {
  useEffect(() => {
    let stop: (() => void) | undefined
    const start = () => { if (!stop) stop = startHouseAudio(); else void audio().resume() }
    window.addEventListener('pointerdown', start, { capture: true }); window.addEventListener('keydown', start, { capture: true })
    return () => { window.removeEventListener('pointerdown', start, true); window.removeEventListener('keydown', start, true); stop?.() }
  }, [])
  return null
}
