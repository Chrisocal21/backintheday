import { create } from 'zustand'
import { useStore } from '../store'
import type { StationId } from './catalog'
import { usePreferences } from '../preferences'
import { leaveFullscreen } from '../takeover'

// big = the device's screen has taken over the whole window (scroll wheel all the way in).
export const useStation = create<{ open: StationId | null; big: boolean }>(() => ({ open: null, big: false }))

export function openStation(id: StationId, big = false) {
  const prefs=usePreferences.getState()
  if(id==='computer')prefs.change('computerPower',true)
  else if(id!=='handheld')prefs.change('consolePower',true)
  document.exitPointerLock()
  useStore.setState({ locked: false, electronics: null })
  useStation.setState({ open: id, big })
}
export function closeStation() {
  useStation.setState({ open: null, big: false })
  leaveFullscreen()
  useStore.setState({ locked: true })
}
