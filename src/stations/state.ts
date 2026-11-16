import { create } from 'zustand'
import { useStore } from '../store'
import type { StationId } from './catalog'
import { usePreferences } from '../preferences'

export const useStation = create<{ open: StationId | null }>(() => ({ open: null }))

export function openStation(id: StationId) {
  const prefs=usePreferences.getState()
  if(id==='computer')prefs.change('computerPower',true)
  else if(id!=='handheld')prefs.change('consolePower',true)
  document.exitPointerLock()
  useStore.setState({ locked: false, electronics: null })
  useStation.setState({ open: id })
}
export function closeStation() {
  useStation.setState({ open: null })
  useStore.setState({ locked: true })
}
