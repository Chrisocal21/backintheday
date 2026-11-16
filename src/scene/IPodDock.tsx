import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FurnitureBox } from './Furniture'
import { useStore } from '../store'
import { openIPod, useIPod } from '../listening/IPod'
import { useListening } from '../listening/state'

// A white click-wheel player in a speaker dock, sitting on the right floor speaker of the
// record nook's sound system. Look at it + E (or click) to open it.
const AT = new THREE.Vector3(-2.7, 0.98, -4.7)

export function IPodDock() {
  const { camera } = useThree()
  const aimed = useRef(false)
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (e.code !== 'KeyE' || e.repeat || !aimed.current || !s.locked || s.menuOpen || s.holdingRemote || useIPod.getState().open) return
      e.stopImmediatePropagation(); openIPod()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  const dir = new THREE.Vector3(), to = new THREE.Vector3()
  useFrame(() => {
    const s = useStore.getState()
    camera.getWorldDirection(dir); to.copy(AT).sub(camera.position)
    aimed.current = to.length() < 2.2 && dir.dot(to.normalize()) > 0.9 && s.seated === null
    s.setHint('ipod', aimed.current && s.locked ? 'E  use the iPod (plays on the sound system)' : null)
    if (glow.current) glow.current.color.set(useListening.getState().ipod?.playing ? '#9ad0ff' : '#dfe6ee')
  })
  return (
    <group position={[-2.7, 0.9, -4.72]} rotation={[0, 0.15, 0]} onClick={(e) => { e.stopPropagation(); openIPod() }}>
      {/* speaker dock */}
      <FurnitureBox size={[0.26, 0.06, 0.1]} position={[0, 0.03, 0]} color="#1c1c1f" finish="plastic" radius={0.02} />
      {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.032, 0.051]}><circleGeometry args={[0.022, 20]} /><meshStandardMaterial color="#333" roughness={0.9} /></mesh>)}
      {/* the player: white body, screen, click wheel */}
      <group position={[0, 0.115, -0.005]} rotation={[-0.12, 0, 0]}>
        <FurnitureBox size={[0.06, 0.1, 0.011]} color="#f2f3f5" finish="plastic" radius={0.008} />
        <mesh position={[0, 0.022, 0.0058]}><planeGeometry args={[0.046, 0.034]} /><meshBasicMaterial ref={glow} color="#dfe6ee" /></mesh>
        <mesh position={[0, -0.022, 0.0058]}><circleGeometry args={[0.018, 24]} /><meshStandardMaterial color="#e3e5e9" roughness={0.4} /></mesh>
        <mesh position={[0, -0.022, 0.006]}><circleGeometry args={[0.006, 16]} /><meshStandardMaterial color="#f7f8fa" roughness={0.4} /></mesh>
      </group>
    </group>
  )
}
