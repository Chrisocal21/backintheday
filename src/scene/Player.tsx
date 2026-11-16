import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLLIDERS, PLAYER_RADIUS, ROOM } from './layout'
import { lockPointer, useStore } from '../store'

const SPEED = 2.6
const EYE = 1.6

export function Player() {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const fwd = new THREE.Vector3()
  const right = new THREE.Vector3()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.arriving) { if (e.code === 'Escape' || e.code === 'Space') s.finishArrival(); return }
      if (s.playingGame) return
      if (s.menuOpen || !s.locked) return
      if (e.code === 'Escape') {
        s.setElectronics(null)
        document.exitPointerLock() // frees the mouse; WASD keeps working
        return
      }
      if(s.electronics || (e.target as Element|null)?.closest?.('input,textarea,select'))return
      if (/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(e.code)) e.preventDefault()
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false)
    const clear = () => { keys.current = {} }
    // The TV's YouTube iframe can grab focus when it loads, which eats WASD and drops pointer lock.
    // Pull focus straight back to the room canvas.
    const reclaim = () => {
      clear()
      setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') {
          ;(document.activeElement as HTMLElement).blur()
          document.getElementById('room-canvas')?.focus({ preventScroll: true })
        }
      }, 0)
    }
    let dragging = false
    const dragStart = (e: PointerEvent) => {
      if (useStore.getState().arriving || useStore.getState().playingGame || useStore.getState().electronics) return
      // drei's <Html occlude> layers a div over the canvas, so accept any click that isn't on UI.
      const onUi = (e.target as Element | null)?.closest?.('button, input, label, .hangout-dock')
      dragging = !onUi && e.button === 0
      const s = useStore.getState()
      if (dragging && s.locked && !s.menuOpen && !document.pointerLockElement) lockPointer()
    }
    const dragEnd = () => { dragging = false }
    const dragLook = (e: PointerEvent) => {
      const s = useStore.getState()
      if (!dragging || document.pointerLockElement || !s.locked || s.menuOpen || s.electronics) return
      const angle = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
      angle.y -= e.movementX * 0.002
      angle.x = THREE.MathUtils.clamp(angle.x - e.movementY * 0.002, -1.4, 1.4)
      camera.quaternion.setFromEuler(angle)
    }
    // Mouse look while pointer-locked, and leave walk mode only when a real lock is released.
    let hadLock = false
    const lockLook = (e: MouseEvent) => {
      const s = useStore.getState()
      if (!document.pointerLockElement || s.menuOpen || s.electronics) return
      const angle = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
      angle.y -= e.movementX * 0.002
      angle.x = THREE.MathUtils.clamp(angle.x - e.movementY * 0.002, -1.4, 1.4)
      camera.quaternion.setFromEuler(angle)
    }
    const lockChange = () => {
      const now = !!document.pointerLockElement
      // Losing the mouse never stops walking; click the room to recapture it.
      hadLock = now
    }
    document.addEventListener('mousemove', lockLook)
    document.addEventListener('pointerlockchange', lockChange)
    window.addEventListener('pointerdown', dragStart)
    window.addEventListener('pointerup', dragEnd)
    window.addEventListener('pointermove', dragLook)
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', reclaim)
    document.addEventListener('pointerlockchange', clear)
    return () => {
      document.removeEventListener('mousemove', lockLook)
      document.removeEventListener('pointerlockchange', lockChange)
      window.removeEventListener('pointerdown', dragStart)
      window.removeEventListener('pointerup', dragEnd)
      window.removeEventListener('pointermove', dragLook)
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      window.removeEventListener('blur', reclaim)
      document.removeEventListener('pointerlockchange', clear)
    }
  }, [camera])

  useFrame((_, dt) => {
    const state = useStore.getState()
    if (state.arriving || state.playingGame || state.electronics || !state.locked || state.menuOpen) return
    dt = Math.min(dt, 0.05)
    const k = keys.current
    let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)
    let mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)

    // Gamepad left stick
    const pad = navigator.getGamepads?.().find((p) => p)
    if (pad) {
      const dz = (v: number) => (Math.abs(v) > 0.15 ? v : 0)
      mx += dz(pad.axes[0])
      mz -= dz(pad.axes[1])
      // Right stick look
      const lx = dz(pad.axes[2] ?? 0), ly = dz(pad.axes[3] ?? 0)
      if (lx || ly) {
        const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
        e.y -= lx * 2.2 * dt
        e.x = THREE.MathUtils.clamp(e.x - ly * 2.2 * dt, -1.4, 1.4)
        camera.quaternion.setFromEuler(e)
      }
    }
    if (!mx && !mz) return
    if (useStore.getState().seated !== null) return // sitting: free look only

    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    right.crossVectors(fwd, camera.up).normalize()
    const len = Math.min(1, Math.hypot(mx, mz))
    const dir = fwd.multiplyScalar(mz).add(right.multiplyScalar(mx)).normalize().multiplyScalar(len * SPEED * dt)

    // Move each axis separately so you slide along walls.
    tryMove(camera.position, dir.x, 0)
    tryMove(camera.position, 0, dir.z)
    camera.position.y = EYE
  })

  return null
}

function blocked(x: number, z: number) {
  const lim = ROOM.half - PLAYER_RADIUS
  if (x < -lim || x > lim || z < -lim || z > lim) return true
  for (const [x0, z0, x1, z1] of COLLIDERS) {
    const cx = Math.max(x0, Math.min(x, x1))
    const cz = Math.max(z0, Math.min(z, z1))
    if ((x - cx) ** 2 + (z - cz) ** 2 < PLAYER_RADIUS ** 2) return true
  }
  return false
}

function tryMove(p: THREE.Vector3, dx: number, dz: number) {
  if (!blocked(p.x + dx, p.z + dz)) {
    p.x += dx
    p.z += dz
  }
}
