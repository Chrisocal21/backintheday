import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { InkBox } from './Ink'
import { useStore } from '../store'
import { openTable, useTable } from '../ui/tableState'

// Open shelf against the west wall: stacked board game boxes + a comic longbox.
// Look at it and press E to open the Game Closet overlay.
const CENTER = new THREE.Vector3(-4.75, 0.8, 0.5)
const RANGE = 2.2

const BOXES: { size: [number, number, number]; color: string; y: number; z: number }[] = [
  { size: [0.36, 0.07, 0.5], color: '#c0392b', y: 0.81, z: 0.2 },
  { size: [0.34, 0.06, 0.46], color: '#1f5fa8', y: 0.875, z: 0.22 },
  { size: [0.3, 0.08, 0.4], color: '#f2c12e', y: 0.945, z: 0.2 },
  { size: [0.36, 0.06, 0.5], color: '#2e8b57', y: 1.31, z: 0.75 },
  { size: [0.32, 0.07, 0.42], color: '#8a2be2', y: 1.375, z: 0.75 },
]

export function GameCloset() {
  const { camera } = useThree()
  const aimed = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (e.code !== 'KeyE' || e.repeat || !aimed.current || s.arriving || s.playingGame || s.electronics || !s.locked || s.menuOpen || s.holdingRemote || useTable.getState().open) return
      e.stopImmediatePropagation()
      openTable('comics')
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const dir = new THREE.Vector3()
  const to = new THREE.Vector3()
  useFrame(() => {
    const s = useStore.getState()
    const d = Math.hypot(camera.position.x - CENTER.x, camera.position.z - CENTER.z)
    camera.getWorldDirection(dir)
    to.copy(CENTER).sub(camera.position).normalize()
    aimed.current = d < RANGE && dir.dot(to) > 0.85 && s.seated === null
    s.setHint('closet', aimed.current && s.locked ? 'E  open the game closet (comics + board games)' : null)
  })

  return (
    <group>
      {/* shelf frame */}
      <InkBox size={[0.45, 1.5, 0.04]} position={[-4.77, 0.75, -0.1]} color="#6b4a2e" />
      <InkBox size={[0.45, 1.5, 0.04]} position={[-4.77, 0.75, 1.1]} color="#6b4a2e" />
      <InkBox size={[0.04, 1.5, 1.24]} position={[-4.98, 0.75, 0.5]} color="#5a3b24" />
      {[0.04, 0.76, 1.26, 1.5].map((y) => (
        <InkBox key={y} size={[0.45, 0.04, 1.2]} position={[-4.77, y, 0.5]} color="#7a5232" />
      ))}
      {BOXES.map((b, i) => (
        <InkBox key={i} size={b.size} position={[-4.77, b.y, b.z]} color={b.color} roughness={0.6} />
      ))}
      {/* comic longbox with comics poking out */}
      <InkBox size={[0.4, 0.3, 0.5]} position={[-4.77, 0.21, 0.4]} color="#d9cbb3" roughness={0.9} />
      {['#e0662a', '#ff3fa4', '#7bd13a', '#3fb6ff'].map((c, i) => (
        <InkBox key={c} size={[0.26, 0.04, 0.008]} position={[-4.77, 0.38, 0.25 + i * 0.07]} color={c} outline={0.002} />
      ))}
      {/* loose comic on top shelf */}
      <InkBox size={[0.26, 0.01, 0.18]} position={[-4.74, 0.785, 0.85]} rotation={[0, 0.2, 0]} color="#e0662a" outline={0.002} />
      {/* checkerboard box lying open on the bottom shelf */}
      <InkBox size={[0.34, 0.02, 0.34]} position={[-4.77, 0.07, 0.88]} color="#1a1a1a" outline={0.003} />
    </group>
  )
}
