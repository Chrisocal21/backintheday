import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Preferences = {
  master: number; tvVolume: number; musicVolume: number; cassetteVolume:number
  hum: number; clock: number; pipes: number; upstairs: number; weatherVolume: number
  weather: 'clear' | 'rain' | 'storm'
  tvPower: boolean; computerPower: boolean; consolePower: boolean; cassettePlaying: boolean
  leftLamp: boolean; nookLamp: boolean
  hideHints: boolean; reducedMotion: boolean; brightness: number; rememberSeat: boolean
  posterStyle: 'original' | 'warm' | 'neon'; photoData: string; posterData: string
  favorites: {id:string; name:string}[]
}
export const DEFAULT_PREFERENCES: Preferences = {
  master: 0.7, tvVolume: 0.5, musicVolume: 0.65, cassetteVolume:0.4,
  hum: 0.04, clock: 0, pipes: 0.18, upstairs: 0.2, weatherVolume: 0.3,
  weather: 'clear', tvPower: true, computerPower: true, consolePower: true, cassettePlaying: false,
  leftLamp: true, nookLamp: true, hideHints: false, reducedMotion: false, brightness: 1, rememberSeat: true,
  posterStyle: 'original', photoData: '', posterData: '', favorites: [],
}
type Settings = Preferences & { change: <K extends keyof Preferences>(key:K,value:Preferences[K])=>void; reset:()=>void }
export const usePreferences = create<Settings>()(persist((set)=>({
  ...DEFAULT_PREFERENCES,
  change: (key,value)=>set({[key]:value}),
  reset: ()=>set({...DEFAULT_PREFERENCES}),
}),{name:'back-in-the-day-preferences',version:2,
  // v2: the clock "tick" was a beep and the hum a constant buzz on entry. Reset both for everyone.
  migrate:(saved,version)=>{const s=(saved??{}) as Partial<Preferences>;if(version<2){s.clock=0;s.hum=0.04};return s as Settings}}))

// Keep session state (pointer lock, open panels, playback) out of saved settings.
export const ROOM_SAVE_KEY='back-in-the-day-room'
export type SavedRoom = {lightLevel:number;lampLevel:number;tvGlow:number;channel:number;customId:string|null;seated:number|null;seatZoom:number}
export function readRoom():Partial<SavedRoom> {
  try {
    const s=JSON.parse(localStorage.getItem(ROOM_SAVE_KEY) ?? '{}'), out:Partial<SavedRoom>={}
    for(const key of ['lightLevel','lampLevel','tvGlow','seatZoom'] as const) if(typeof s[key]==='number' && Number.isFinite(s[key]))out[key]=Math.max(0,Math.min(1,s[key]))
    if(Number.isInteger(s.channel)&&s.channel>=-1&&s.channel<4)out.channel=s.channel
    if(typeof s.customId==='string'&&/^[\w-]{11}$/.test(s.customId))out.customId=s.customId
    if(s.seated===null || Number.isInteger(s.seated)&&s.seated>=0&&s.seated<9)out.seated=s.seated
    return out
  }catch{return {}}
}
