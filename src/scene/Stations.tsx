import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { InkBox } from './Ink'
import { useStore } from '../store'
import { STATIONS, type StationId } from '../stations/catalog'
import { openStation, useStation } from '../stations/state'
import { FurnitureBox } from './Furniture'

// Look at a device and press E: each opens its own system and library.
const SPOTS: { id: StationId; at: THREE.Vector3; range: number }[] = [
  { id: 'arcade', at: new THREE.Vector3(4.45, 1.3, -3.6), range: 2.2 },
  { id: 'console', at: new THREE.Vector3(2.95, 0.1, -4.35), range: 2.0 },
  { id: 'handheld', at: new THREE.Vector3(-3.75, 0.05, 2.5), range: 1.9 },
  { id: 'disc', at: new THREE.Vector3(4.47, 0.82, 4.26), range: 1.9 },
]

export function Stations() {
  const { camera } = useThree()
  const aimed = useRef<StationId | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (e.code !== 'KeyE' || e.repeat || s.arriving || s.playingGame || s.electronics || !aimed.current || !s.locked || s.menuOpen || s.holdingRemote || useStation.getState().open) return
      e.stopImmediatePropagation()
      openStation(aimed.current)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const dir = new THREE.Vector3(), to = new THREE.Vector3()
  useFrame(() => {
    const s = useStore.getState()
    camera.getWorldDirection(dir)
    let best: StationId | null = null, bestDot = 0.88
    for (const sp of SPOTS) {
      if (camera.position.distanceTo(sp.at) > sp.range + 1) continue
      to.copy(sp.at).sub(camera.position).normalize()
      const d = dir.dot(to)
      if (d > bestDot && Math.hypot(camera.position.x - sp.at.x, camera.position.z - sp.at.z) < sp.range) { best = sp.id; bestDot = d }
    }
    aimed.current = s.seated === null ? best : null
    const st = aimed.current && STATIONS[aimed.current]
    s.setHint('station', st && s.locked ? `E  play the ${st.kind.toLowerCase()} (${st.games.length} games)` : null)
  })

  return <><WoodgrainConsole /><DiscConsole /></>
}

function DiscConsole() {
  return <group position={[4.47,0.81,4.26]} rotation={[0,-Math.PI/2,0]} onClick={e=>{e.stopPropagation();openStation('disc')}}>
    <FurnitureBox size={[0.26,0.07,0.28]} color="#444956" finish="plastic" radius={0.015} />
    <mesh position={[0,0.036,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.095,40]} /><meshStandardMaterial color="#3b414c" roughness={0.55} /></mesh>
    <FurnitureBox size={[0.16,0.009,0.002]} position={[0,-0.008,0.142]} color="#171c25" finish="plastic" radius={0.001} />
    <mesh position={[0.105,-0.008,0.143]}><sphereGeometry args={[0.003,8,8]} /><meshBasicMaterial color="#9eb8a6" /></mesh>
    <group position={[-0.21,-0.005,0.015]}>
      <FurnitureBox size={[0.14,0.035,0.07]} color="#5c6570" finish="plastic" radius={0.015} />
      <FurnitureBox size={[0.025,0.005,0.008]} position={[-0.04,0.02,0]} color="#262b33" finish="plastic" radius={0.002} />
      <FurnitureBox size={[0.008,0.005,0.025]} position={[-0.04,0.02,0]} color="#262b33" finish="plastic" radius={0.002} />
      {[0.027,0.049].map(x=><mesh key={x} position={[x,0.02,0]}><sphereGeometry args={[0.006,10,6]} /><meshStandardMaterial color="#a4afaa" /></mesh>)}
    </group>
  </group>
}

// The Hearth 2400: wood-grain home console with a joystick, on the floor by the rolling TV.
function WoodgrainConsole() {
  return (
    <group position={[2.95, 0, -4.35]} rotation={[0, 0.25, 0]}>
      <InkBox size={[0.34, 0.06, 0.2]} position={[0, 0.03, 0]} color="#1a1a1a" roughness={0.5} />
      <InkBox size={[0.34, 0.03, 0.1]} position={[0, 0.07, 0.05]} color="#7a4f2a" roughness={0.6} />
      <InkBox size={[0.1, 0.03, 0.06]} position={[0, 0.075, -0.05]} color="#2a2a2a" />
      {[-0.12, -0.08, 0.08, 0.12].map((x) => (
        <InkBox key={x} size={[0.015, 0.02, 0.01]} position={[x, 0.075, 0.095]} color="#999" outline={0.001} />
      ))}
      {/* cartridge in the slot */}
      <InkBox size={[0.08, 0.05, 0.02]} position={[0, 0.1, -0.05]} color="#3a3a3a" outline={0.002} />
      {/* joystick on a cord */}
      <group position={[0.1, 0, 0.3]}>
        <InkBox size={[0.07, 0.03, 0.07]} position={[0, 0.015, 0]} color="#151515" />
        <InkBox size={[0.012, 0.07, 0.012]} position={[0, 0.06, 0]} color="#111" outline={0.001} />
        <InkBox size={[0.015, 0.008, 0.015]} position={[-0.022, 0.034, -0.022]} color="#c0392b" outline={0.001} />
      </group>
    </group>
  )
}
