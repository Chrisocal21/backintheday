// All music here is synthesized in the browser, so it is royalty-free by construction.
// Placeholder until real public-domain / CC records are chosen (open question 3).
import { usePreferences } from './preferences'

let ctx: AudioContext | null = null
export function audio() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export type Record = {
  title: string
  era: '70s' | '80s' | '90s' | '2000s'
  label: string // sleeve/label color
  bpm: number
  wave: OscillatorType
  root: number // midi
  scale: number[]
  prog: number[] // scale degrees per bar
  seed: number
  swing: number
}

export const RECORDS: Record[] = [
  { title: 'Sunburst Lounge', era: '70s', label: '#e07a2a', bpm: 96, wave: 'triangle', root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 4, 3], seed: 3, swing: 0.12 },
  { title: 'Velvet Basement', era: '70s', label: '#8a4b2a', bpm: 84, wave: 'sine', root: 45, scale: [0, 3, 5, 7, 10], prog: [0, 0, 3, 4], seed: 11, swing: 0.15 },
  { title: 'Neon Highway', era: '80s', label: '#ff3fa4', bpm: 118, wave: 'sawtooth', root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 2, 6], seed: 7, swing: 0 },
  { title: 'Mall at Midnight', era: '90s', label: '#3fb6ff', bpm: 100, wave: 'square', root: 55, scale: [0, 2, 4, 7, 9], prog: [0, 3, 1, 4], seed: 21, swing: 0.08 },
  { title: 'Dial-Up Dreams', era: '2000s', label: '#a4ff3f', bpm: 126, wave: 'square', root: 57, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], seed: 42, swing: 0 },
  // More original synthesized records (free to use), sorted by era in the crate.
  { title: 'Shag Carpet Strut', era: '70s', label: '#c8641e', bpm: 104, wave: 'triangle', root: 48, scale: [0, 2, 4, 7, 9], prog: [0, 3, 0, 4], seed: 5, swing: 0.18 },
  { title: 'Mood Ring Blues', era: '70s', label: '#6b3fa0', bpm: 72, wave: 'sine', root: 43, scale: [0, 3, 5, 6, 7, 10], prog: [0, 3, 0, 4], seed: 13, swing: 0.2 },
  { title: 'Station Wagon Sunday', era: '70s', label: '#d9a441', bpm: 90, wave: 'triangle', root: 53, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], seed: 29, swing: 0.1 },
  { title: 'Arcade After Dark', era: '80s', label: '#2a1a5a', bpm: 128, wave: 'square', root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], seed: 17, swing: 0 },
  { title: 'Synth Sunset Drive', era: '80s', label: '#ff7a3f', bpm: 108, wave: 'sawtooth', root: 47, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 3, 5, 4], seed: 31, swing: 0 },
  { title: 'Leg Warmer Workout', era: '80s', label: '#3fffd0', bpm: 136, wave: 'square', root: 55, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], seed: 37, swing: 0 },
  { title: 'Flannel Weather', era: '90s', label: '#7a2a2a', bpm: 88, wave: 'sawtooth', root: 40, scale: [0, 3, 5, 7, 10], prog: [0, 2, 3, 2], seed: 23, swing: 0.05 },
  { title: 'Saturday Morning Static', era: '90s', label: '#ffd23f', bpm: 112, wave: 'square', root: 52, scale: [0, 2, 4, 7, 9], prog: [0, 4, 3, 4], seed: 41, swing: 0.1 },
  { title: 'Rewind Before Returning', era: '90s', label: '#3f7aff', bpm: 94, wave: 'triangle', root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 4], seed: 53, swing: 0.12 },
  { title: 'Burned CD Mix Vol. 2', era: '2000s', label: '#c0c0d0', bpm: 120, wave: 'sawtooth', root: 54, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 2, 6], seed: 47, swing: 0 },
  { title: 'Flip Phone Ringtone Rave', era: '2000s', label: '#ff3fff', bpm: 140, wave: 'square', root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 3], seed: 59, swing: 0 },
  { title: 'Away Message', era: '2000s', label: '#3fd0ff', bpm: 82, wave: 'sine', root: 49, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], seed: 61, swing: 0.08 },
]
RECORDS.sort((a, b) => ['70s', '80s', '90s', '2000s'].indexOf(a.era) - ['70s', '80s', '90s', '2000s'].indexOf(b.era))

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
function rng(seed: number) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

let noiseBuf: AudioBuffer | null = null
export function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

export function tone(c: AudioContext, out: AudioNode, t: number, freq: number, dur: number, vol: number, wave: OscillatorType) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = wave
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
  o.onended = () => { o.disconnect(); g.disconnect() }
}

function hit(c: AudioContext, out: AudioNode, t: number, kind: 'kick' | 'hat' | 'snare', vol = 1) {
  if (kind === 'kick') {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15)
    g.gain.setValueAtTime(0.5 * vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 0.3)
    o.onended=()=>{o.disconnect();g.disconnect()}
    return
  }
  const s = c.createBufferSource()
  s.buffer = noise(c)
  const f = c.createBiquadFilter()
  f.type = kind === 'hat' ? 'highpass' : 'bandpass'
  f.frequency.value = kind === 'hat' ? 7000 : 1800
  const g = c.createGain()
  const len = kind === 'hat' ? 0.05 : 0.15
  g.gain.setValueAtTime((kind === 'hat' ? 0.08 : 0.2) * vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + len)
  s.connect(f).connect(g).connect(out)
  s.start(t, Math.random())
  s.stop(t + len + 0.02)
  s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()}
}

// --- Record playback -------------------------------------------------------

let player: { stop: () => void; out: GainNode } | null = null

export function playRecord(rec: Record) {
  stopRecord()
  const c = audio()
  const out = c.createGain()
  out.gain.value = 0
  const tilt = c.createBiquadFilter() // warm, slightly dull vinyl top end
  tilt.type = 'lowpass'
  tilt.frequency.value = rec.era === '70s' ? 2600 : 4200
  out.connect(tilt).connect(recordBus())

  // Crackle
  const crackle = c.createBufferSource()
  const cb = c.createBuffer(1, c.sampleRate * 3, c.sampleRate)
  const cd = cb.getChannelData(0)
  for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.004
  crackle.buffer = cb
  crackle.loop = true
  crackle.connect(out)
  crackle.start()

  const r = rng(rec.seed)
  const beat = 60 / rec.bpm
  const melody: number[] = Array.from({ length: 32 }, () => (r() < 0.7 ? Math.floor(r() * rec.scale.length) : -1))
  const note = (deg: number, oct = 0) => {
    const n = rec.scale.length
    const o = Math.floor(deg / n)
    return rec.root + rec.scale[((deg % n) + n) % n] + 12 * (o + oct)
  }

  let step = 0 // eighth notes
  let next = c.currentTime + 0.6 // a beat of needle-drop silence
  const timer = window.setInterval(() => {
    if (next < c.currentTime - 0.5) next = c.currentTime + 0.05
    while (next < c.currentTime + 0.2) {
      const bar = Math.floor(step / 8) % rec.prog.length
      const chord = rec.prog[bar]
      const inBar = step % 8
      const t = next + (inBar % 2 ? rec.swing * beat : 0)
      if (inBar === 0) [0, 2, 4].forEach((d) => tone(c, out, t, hz(note(chord + d)), beat * 3.8, 0.035, 'triangle'))
      if (inBar % 2 === 0) tone(c, out, t, hz(note(chord, -2) + (inBar === 4 ? 7 : 0)), beat * 0.9, 0.16, 'sine')
      const m = melody[step % 32]
      if (m >= 0 && step % 64 >= 16) tone(c, out, t, hz(note(m + chord, 1)), beat * 0.6, 0.05, rec.wave)
      if (inBar === 0 || inBar === 4 || (rec.era !== '70s' && inBar === 6 && r() < 0.3)) hit(c, out, t, 'kick')
      if (inBar === 2 || inBar === 6) hit(c, out, t, 'snare', rec.era === '70s' ? 0.5 : 1)
      hit(c, out, t, 'hat', inBar % 2 ? 0.6 : 1)
      step++
      next += beat / 2
    }
  }, 50)

  player = {
    out,
    stop: () => {
      window.clearInterval(timer)
      out.gain.setTargetAtTime(0, c.currentTime, 0.05)
      crackle.stop(c.currentTime + 0.3)
      setTimeout(() => out.disconnect(), 600)
    },
  }
}

export function stopRecord() {
  player?.stop()
  player = null
}

/** 0..1 loudness, set each frame from distance to the turntable. */
export function setRecordVolume(v: number) {
  if (player) player.out.gain.setTargetAtTime(v, audio().currentTime, 0.1)
}

let recordGain: GainNode | undefined
function recordBus() {
  const c=audio()
  if(!recordGain) {
    recordGain=c.createGain();recordGain.connect(c.destination)
    const update=()=>{const p=usePreferences.getState();recordGain!.gain.setTargetAtTime(p.master*p.musicVolume,c.currentTime,0.08)}
    update();usePreferences.subscribe(update)
  }
  return recordGain
}

