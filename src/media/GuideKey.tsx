import { useEffect } from 'react'
import { useStore } from '../store'
import { SEATS } from '../scene/layout'
import { openMediaHub, useMediaHub } from './state'

// Sitting on the couch (or any seat facing the TV)? Press T to open the program guide and
// put something on right away. No tapes to carry.
export function GuideKey() {
  const seated = useStore((s) => s.seated)
  const facesTV = seated !== null && !SEATS[seated]?.target
  useEffect(() => {
    useStore.getState().setHint('guide', facesTV ? 'T  TV guide (put something on)' : null)
    if (!facesTV) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyT' || e.repeat) return
      const s = useStore.getState()
      if (s.menuOpen || useMediaHub.getState().open || (e.target as HTMLElement)?.closest?.('input, textarea')) return
      e.preventDefault()
      openMediaHub()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [facesTV])
  return null
}
