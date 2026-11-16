import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
import { SEATS, TV_SCREEN } from './layout'

export const ARRIVAL_END = [-1.65, 1.6, -2.8] as const
const path = [new Vector3(0.8, 4, -4.5), new Vector3(-1.3, 1.94, -4.5), new Vector3(-1.8, 1.6, -3.35), new Vector3(...ARRIVAL_END)]
export function Arrival() {
  const elapsed = useRef(0)
  const done = useRef(false)
  useFrame(({ camera }, dt) => {
    if (done.current) return
    const arriving = useStore.getState().arriving
    elapsed.current += Math.min(dt, 0.05)
    const prefs=usePreferences.getState()
    const t = arriving && !prefs.reducedMotion ? Math.min(1, elapsed.current / 6) : 1
    const segment = t < 0.72 ? 0 : t < 0.92 ? 1 : 2
    const start = [0, 0.72, 0.92][segment], end = [0.72, 0.92, 1][segment]
    const local = (t - start) / (end - start)
    camera.position.lerpVectors(path[segment], path[segment+1], local * local * (3 - 2 * local))
    // Gradually turn into the room as you step off the staircase. No head bob.
    camera.lookAt(-3 * (1-t), camera.position.y - 0.6, -4.5 + 5.5 * t)
    if (t === 1) {
      done.current = true
      const s=useStore.getState(),seat=prefs.rememberSeat&&s.seated!==null?SEATS[s.seated]:null
      if(seat){camera.position.set(...seat.eye);camera.lookAt(...(seat.target??TV_SCREEN))}
      else if(s.seated!==null)s.setSeated(null)
      s.finishArrival()
    }
  })
  return null
}
