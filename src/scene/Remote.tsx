import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { InkBox } from './Ink'
import { useStore } from '../store'

export const REMOTE_TABLE_POS = new THREE.Vector3(0.25, 0.475, 0)
const HAND_OFFSET = new THREE.Vector3(0.22, -0.2, -0.42)
const REACH = 2.2
const TV_POS = new THREE.Vector3(0, 0.87, -1.29)

function RemoteModel() {
  return (
    <>
      <InkBox size={[0.06, 0.03, 0.2]} color="#222226" outline={0.004} />
      <InkBox size={[0.02, 0.012, 0.02]} position={[0, 0.018, -0.075]} color="#c33" outline={0.002} />
      <InkBox size={[0.035, 0.012, 0.018]} position={[0, 0.018, -0.035]} color="#888" outline={0.002} />
      <InkBox size={[0.035, 0.012, 0.018]} position={[0, 0.018, -0.005]} color="#888" outline={0.002} />
      <InkBox size={[0.015, 0.012, 0.015]} position={[-0.012, 0.018, 0.04]} color="#bbb" outline={0.002} />
      <InkBox size={[0.015, 0.012, 0.015]} position={[0.012, 0.018, 0.04]} color="#bbb" outline={0.002} />
    </>
  )
}

export function Remote() {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const tmp = new THREE.Vector3()
  const look = new THREE.Vector3()

  // Keyboard: E pick up / put down; [ ] or PageUp/PageDown change channel; I opens Input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.arriving || s.playingGame || s.menuOpen || s.electronics || !s.locked || e.repeat) return
      if (e.code === 'KeyE') {
        if (s.holdingRemote && !nearTable(camera)) { s.setElectronics(s.electronics === 'tv' ? null : 'tv'); return }
        if (aimedAt(camera, TV_POS)) { s.setElectronics('tv'); return }
        if (s.holdingRemote ? nearTable(camera) : canReach(camera)) s.toggleRemote()
      }
      // Channel / volume / guide / power keys live on the remote itself (src/media/TVRemote.tsx).
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [camera])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const s = useStore.getState()
    s.setHint('tv', aimedAt(camera, TV_POS) ? 'E  use TV' : null)
    if (s.holdingRemote) {
      g.position.copy(HAND_OFFSET).applyQuaternion(camera.quaternion).add(camera.position)
      g.quaternion.copy(camera.quaternion)
      g.rotateX(0.5)
      g.rotateY(-0.15)
      s.setHint('remote', nearTable(camera) ? 'E  put remote down' : null)
    } else {
      g.position.copy(REMOTE_TABLE_POS)
      g.rotation.set(0, 0.4, 0)
      s.setHint('remote', canReach(camera) ? 'E  pick up remote' : null)
    }
  })

  function canReach(cam: THREE.Camera) {
    tmp.copy(REMOTE_TABLE_POS).sub(cam.position)
    if (tmp.length() > REACH) return false
    cam.getWorldDirection(look)
    return look.dot(tmp.normalize()) > 0.93
  }

  return (
    <group ref={group} position={REMOTE_TABLE_POS.toArray()}>
      <RemoteModel />
    </group>
  )
}

function aimedAt(camera: THREE.Camera, target: THREE.Vector3) {
  const to = target.clone().sub(camera.position)
  return to.length() < REACH && camera.getWorldDirection(new THREE.Vector3()).dot(to.normalize()) > 0.94
}

function nearTable(cam: THREE.Camera) {
  return cam.position.distanceTo(REMOTE_TABLE_POS) < REACH + 0.3
}
