import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SEATS, TV_SCREEN } from './layout'
import { useStore } from '../store'
import { usePreferences } from '../preferences'

const EYE = 1.6
const SIT_RANGE = 1.3
const EASE_TIME = 0.4

// Sit mode: F near a seat to sit (camera eases to seat height, facing the TV, free look,
// no walking). F again to stand. Audio/video keep playing either way.
export function Seats() {
  const { camera } = useThree()
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.arriving || s.playingGame || s.electronics || s.menuOpen || !s.locked || anim.current || e.repeat) return
      // F always sits/stands. E does too, unless E is busy with the remote.
      const remoteUsesE = !!s.hints.remote?.startsWith('E') || !!s.hints.record?.startsWith('E') || !!s.hints.tv?.startsWith('E') || !!s.hints.media?.startsWith('E') || !!s.hints.house?.startsWith('E')
      if (e.code !== 'KeyF' && !(e.code === 'KeyE' && !remoteUsesE && !s.holdingRemote)) return
      if (s.seated === null) {
        const i = nearestSeat(camera.position)
        if (i < 0) return
        const seat = SEATS[i]
        s.setSeated(i)
        anim.current = { from: camera.position.clone(), to: new THREE.Vector3(...seat.eye), t: 0 }
        // Computer chair faces its monitor; lounge seats face the TV.
        const look = new THREE.Matrix4().lookAt(new THREE.Vector3(...seat.eye), new THREE.Vector3(...(seat.target ?? TV_SCREEN)), camera.up)
        camera.quaternion.setFromRotationMatrix(look)
      } else {
        const seat = SEATS[s.seated]
        s.setSeated(null)
        anim.current = { from: camera.position.clone(), to: new THREE.Vector3(seat.stand[0], EYE, seat.stand[1]), t: 0 }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [camera])

  useFrame((_, dt) => {
    const a = anim.current
    if (a) {
      a.t = usePreferences.getState().reducedMotion ? 1 : Math.min(1, a.t + dt / EASE_TIME)
      const k = a.t * a.t * (3 - 2 * a.t) // smoothstep
      camera.position.lerpVectors(a.from, a.to, k)
      if (a.t >= 1) anim.current = null
    }
    const s = useStore.getState()
    const key = s.holdingRemote || s.hints.remote?.startsWith('E') || s.hints.record?.startsWith('E') || s.hints.tv?.startsWith('E') ? 'F' : 'E'
    if (s.seated !== null) s.setHint('seat', `${key}  stand up   ·   Scroll / + −  zoom   ·   Z  face screen   ·   0  reset view`)
    else {
      const i = nearestSeat(camera.position)
      s.setHint('seat', i >= 0 ? `${key}  sit on ${SEATS[i].name}` : null)
    }
  })

  return null
}

function nearestSeat(p: THREE.Vector3) {
  let best = -1
  let bestD = SIT_RANGE
  SEATS.forEach((s, i) => {
    const d = Math.hypot(p.x - s.eye[0], p.z - s.eye[2])
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}
