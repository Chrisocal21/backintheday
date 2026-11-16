import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { useStore } from '../store'
import { SEATS, TV_SCREEN } from './layout'
import { usePreferences } from '../preferences'

// Frame the physical device at roughly half the view, preserving its surroundings.
export function focusedFov(distance: number, aspect: number, computer: boolean) {
  const h = computer ? 0.38 : 0.7, w = computer ? 0.42 : 0.9
  const requiredHeight = Math.max(h, w / Math.max(aspect, 0.1))
  return MathUtils.clamp(MathUtils.radToDeg(2 * Math.atan(requiredHeight / (2 * Math.max(distance, 0.1) * 0.55))), 10, 60)
}

export function SeatedFocus() {
  const { camera } = useThree()
  useEffect(() => {
    const available = (target: EventTarget | null) => {
      const s = useStore.getState()
      return s.seated !== null && !s.arriving && !s.menuOpen && !(target as Element | null)?.closest?.('button, input, textarea, select, .room-remote, .tt-backdrop')
    }
    const wheel = (e: WheelEvent) => {
      if (!available(e.target)) return
      e.preventDefault()
      const amount = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 300 : 1)
      const s = useStore.getState()
      s.setSeatZoom(s.seatZoom - MathUtils.clamp(amount, -120, 120) * 0.0015)
    }
    const key = (e: KeyboardEvent) => {
      if (!available(e.target)) return
      const s = useStore.getState()
      if (['Equal', 'NumpadAdd', 'Minus', 'NumpadSubtract', 'Digit0', 'KeyZ'].includes(e.code)) {
        e.preventDefault()
        if (e.code === 'KeyZ') {
          const seat = SEATS[s.seated!]
          camera.lookAt(...(seat.target ?? TV_SCREEN))
        } else s.setSeatZoom(e.code === 'Digit0' ? 0 : s.seatZoom + (e.code === 'Minus' || e.code === 'NumpadSubtract' ? -0.12 : 0.12))
      }
    }
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key) }
  }, [camera])
  useFrame((_, dt) => {
    if (!(camera instanceof PerspectiveCamera)) return
    const s = useStore.getState()
    let target = 70
    if (s.seated !== null && !s.arriving) {
      const seat = SEATS[s.seated]
      const d = new Vector3(...seat.eye).distanceTo(new Vector3(...(seat.target ?? TV_SCREEN)))
      target = MathUtils.lerp(70, focusedFov(d, camera.aspect, !!seat.target), s.seatZoom)
    }
    const next = usePreferences.getState().reducedMotion ? target : MathUtils.damp(camera.fov, target, 10, Math.min(dt, 0.05))
    if (Math.abs(next - camera.fov) > 0.001) { camera.fov = next; camera.updateProjectionMatrix() }
  })
  return null
}
