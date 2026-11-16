import { create } from 'zustand'
import { CHANNELS } from './channels'
import type { GameId } from './library'
import { readRoom, ROOM_SAVE_KEY, usePreferences } from './preferences'
import type { MediaItem } from './media/types'
export type Electronics = 'tv' | 'lights' | 'room' | 'record' | 'media' | 'personal' | 'computer' | 'cassette' | 'portable' | null

export type Input = 'tv' | 'game'

type State = {
  locked: boolean
  arriving: boolean
  finishArrival: () => void
  lightLevel: number
  setLightLevel: (v: number) => void
  lampLevel: number
  tvGlow: number
  setLampLevel: (v: number) => void
  setTvGlow: (v: number) => void
  setMood: (mood: 'late' | 'movie' | 'bright') => void
  holdingRemote: boolean
  electronics: Electronics
  setElectronics: (v: Electronics) => void
  mediaPaused: boolean
  recordPlaying: boolean
  recordIndex: number
  heldMedia: {kind:'tape'|'cartridge';id:string;title:string}|null
  insertedTape: string|null
  insertedCartridge: GameId|null
  pickMedia: (kind:'tape'|'cartridge',id:string,title:string)=>void
  menuOpen: boolean
  input: Input
  filmId: string | null
  watchItem: MediaItem | null
  gameId: GameId
  playingGame: boolean
  playFilm: (id: string) => void
  playGame: (id: GameId) => void
  stopGame: () => void
  channel: number // index into CHANNELS, or -1 for the custom link
  customId: string | null
  noSignal: boolean
  osdAt: number // timestamp of last channel change, for the on-screen display
  hints: Record<string, string | null> // per-system hint lines shown at the bottom
  seated: number | null // index into SEATS
  seatZoom: number
  setSeatZoom: (v: number) => void

  setLocked: (v: boolean) => void
  setHint: (key: string, h: string | null) => void
  setSeated: (i: number | null) => void
  toggleRemote: () => void
  channelStep: (d: 1 | -1) => void
  openMenu: () => void
  closeMenu: () => void
  setInput: (i: Input) => void
  playCustom: (id: string) => void
  setNoSignal: (v: boolean) => void
}

export const useStore = create<State>((set, get) => ({
  locked: true, // walk mode is always on; there is no intro screen
  arriving: true,
  finishArrival: () => set({ arriving: false }),
  lightLevel: 0.24,
  lampLevel: 0.8,
  tvGlow: 0.65,
  setLampLevel: (v) => set({ lampLevel: Math.max(0, Math.min(1, v)) }),
  setTvGlow: (v) => set({ tvGlow: Math.max(0, Math.min(1, v)) }),
  setMood: (mood) => set(mood === 'movie' ? { lightLevel: 0.03, lampLevel: 0.25, tvGlow: 0.9 } : mood === 'bright' ? { lightLevel: 1, lampLevel: 0.7, tvGlow: 0.3 } : { lightLevel: 0.24, lampLevel: 0.8, tvGlow: 0.65 }),
  setLightLevel: (lightLevel) => set({ lightLevel: Math.max(0, Math.min(1, lightLevel)) }),
  holdingRemote: false,
  electronics: null,
  setElectronics: (electronics) => set({ electronics }),
  menuOpen: false,
  input: 'tv',
  filmId: null,
  watchItem: null,
  gameId: 'rally',
  playingGame: false,
  playFilm: (filmId) => set({ filmId, watchItem:null, input: 'tv', mediaPaused:false, playingGame: false, noSignal: false, menuOpen: false, electronics: null, osdAt: performance.now() }),
  playGame: (gameId) => { set({ gameId, input: 'game', playingGame: true, menuOpen: false, electronics: null, noSignal: false, osdAt: performance.now() }); document.exitPointerLock() },
  stopGame: () => set({ playingGame: false, electronics: 'tv' }),
  channel: 2,
  customId: null,
  noSignal: false,
  osdAt: 0,
  hints: {},
  seated: null,
  seatZoom: 0,
  mediaPaused: false,
  recordPlaying: false,
  recordIndex: 0,
  heldMedia: null,
  insertedTape: null,
  insertedCartridge: null,
  // No carrying tapes/cartridges to the VCR: choosing one puts it straight on the TV.
  pickMedia: (kind,id)=>{
    const prefs=usePreferences.getState()
    prefs.change('tvPower',true)
    if(kind==='tape'){set({heldMedia:null,insertedTape:id});get().playFilm(id)}
    else{prefs.change('consolePower',true);set({heldMedia:null,insertedCartridge:id as GameId});get().playGame(id as GameId)}
  },
  setSeatZoom: (v) => set({ seatZoom: Math.max(0, Math.min(1, v)) }),

  setLocked: (locked) => set({ locked }),
  setHint: (key, h) => {
    if ((get().hints[key] ?? null) !== h) set((s) => ({ hints: { ...s.hints, [key]: h } }))
  },
  setSeated: (seated) => set({ seated, seatZoom: 0 }),
  toggleRemote: () => set((s) => ({ holdingRemote: !s.holdingRemote, electronics: s.holdingRemote ? null : 'tv' })),
  channelStep: (d) =>
    set((s) => {
      const n = CHANNELS.length
      const cur = s.channel < 0 ? 0 : s.channel
      return { channel: (cur + d + n) % n, watchItem:null, filmId: null, playingGame: false, input: 'tv', noSignal: false, osdAt: performance.now() }
    }),
  openMenu: () => {
    set({ menuOpen: true })
    document.exitPointerLock()
  },
  closeMenu: () => {
    set({ menuOpen: false })
    lockPointer()
  },
  setInput: (input) => set({ input, watchItem:null, filmId: null, playingGame: false, osdAt: performance.now() }),
  playCustom: (customId) => set({ customId, watchItem:null, filmId: null, mediaPaused:false, playingGame: false, channel: -1, input: 'tv', noSignal: false, osdAt: performance.now() }),
  setNoSignal: (noSignal) => set({ noSignal }),
  ...readRoom(),
}))

let saveTimer: ReturnType<typeof setTimeout> | undefined
function saveRoom() {
  const s=useStore.getState(), remember=usePreferences.getState().rememberSeat
  try { localStorage.setItem(ROOM_SAVE_KEY,JSON.stringify({lightLevel:s.lightLevel,lampLevel:s.lampLevel,tvGlow:s.tvGlow,channel:s.channel,customId:s.customId,seated:remember?s.seated:null,seatZoom:remember?s.seatZoom:0})) } catch { /* Storage can be disabled; the room still works. */ }
}
useStore.subscribe((s,previous)=>{
  if(['lightLevel','lampLevel','tvGlow','channel','customId','seated','seatZoom'].some(k=>s[k as keyof State]!==previous[k as keyof State])) {
    clearTimeout(saveTimer);saveTimer=setTimeout(saveRoom,200)
  }
})
if(typeof window!=='undefined')window.addEventListener('pagehide',saveRoom)
export function openDevice(device:Electronics) { useStore.getState().setElectronics(device);document.exitPointerLock() }

export function lockPointer() {
  const canvas = document.getElementById('room-canvas') as HTMLCanvasElement | null
  if (!canvas) return
  // Walking is a room mode. Mouse capture may be denied by the browser.
  useStore.getState().setLocked(true)
  canvas.focus({ preventScroll: true })
  try {
    const request = canvas.requestPointerLock() as Promise<void> | undefined
    request?.catch(() => { /* WASD and drag-to-look remain available. */ })
  } catch {
    // Keep keyboard navigation available when pointer lock is unavailable.
  }
}

// Pull the 11-char video id out of any common YouTube URL form (or a bare id).
export function parseYouTubeId(text: string): string | null {
  const t = text.trim()
  if (/^[\w-]{11}$/.test(t)) return t
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/)
  return m ? m[1] : null
}
