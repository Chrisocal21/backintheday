import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Ink, InkBox } from './Ink'
import { FurnitureBox, FurnitureMaterial } from './Furniture'
import { usePreferences } from '../preferences'

type P = { position: [number, number, number]; rotation?: number }

// The spare kitchen chair that became the family computer chair.
export function FamilyChair({ position, rotation = 0 }: P) {
  const oak = '#986338'
  return <group position={position} rotation={[0, rotation, 0]}>
    <FurnitureBox size={[0.48, 0.055, 0.46]} position={[0, 0.46, 0]} color="#ad7947" radius={0.022} />
    {[-1, 1].flatMap(x => [-1, 1].map(z => <Ink key={`${x},${z}`} color={oak} roughness={0.7} outline={0.001} position={[x * 0.19, 0.225, z * 0.18]} rotation={[z * 0.035, 0, -x * 0.035]}>
      <cylinderGeometry args={[0.024, 0.019, 0.45, 12]} />
    </Ink>))}
    {[-1, 1].map(s => <group key={s}>
      <InkBox size={[0.027, 0.025, 0.36]} position={[s * 0.19, 0.19, 0]} color={oak} outline={0.001} />
      <FurnitureBox size={[0.035, 0.53, 0.035]} position={[s * 0.205, 0.735, 0.2]} rotation={[0.08, 0, 0]} color={oak} />
    </group>)}
    <InkBox size={[0.38, 0.025, 0.025]} position={[0, 0.18, 0]} color={oak} outline={0.001} />
    {[-0.12, 0, 0.12].map(x => <FurnitureBox key={x} size={[0.035, 0.36, 0.025]} position={[x, 0.76, 0.21]} rotation={[0.08, 0, 0]} color="#ac7846" />)}
    <FurnitureBox size={[0.47, 0.085, 0.045]} position={[0, 0.98, 0.225]} color={oak} radius={0.018} />
  </group>
}

// Squashed sack shape that reads as a bean bag.
export function BeanBag({ position, color, rotation = 0 }: P & { color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.22, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 24, 16]} />
        <FurnitureMaterial color={color} finish="cloth" />
      </mesh>
      {/* slumped back */}
      <mesh position={[0, 0.42, 0.2]} scale={[0.85, 0.6, 0.6]} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 24, 16]} />
        <FurnitureMaterial color={color} finish="cloth" />
      </mesh>
      <mesh position={[0,0.17,0]} rotation={[Math.PI/2,0,0]} scale={[1,1,0.5]}><torusGeometry args={[0.425,0.004,6,40]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
    </group>
  )
}

// Rattan bowl on a ring stand, big round cushion. Faces -z by default.
export function Papasan({ position, rotation = 0 }: P) {
  const ribs = useMemo(() => Array.from({length:16},(_,i) => {
    const theta = i / 16 * Math.PI * 2
    return new THREE.CatmullRomCurve3(Array.from({length:12},(_,j) => {
      const phi = Math.PI/2 + j/11*Math.PI/2
      return new THREE.Vector3(Math.cos(theta)*0.65*Math.sin(phi),0.65*Math.cos(phi),Math.sin(theta)*0.65*Math.sin(phi))
    }))
  }), [])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Ink color="#6b4a2b" rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <torusGeometry args={[0.32, 0.035, 10, 32]} />
      </Ink>
      {Array.from({length:10},(_,i)=><FurnitureBox key={i} size={[0.022,0.22,0.022]} position={[Math.cos(i*Math.PI/5)*0.28,0.23,Math.sin(i*Math.PI/5)*0.28]} color="#92663d" radius={0.008} />)}
      <group position={[0, 0.85, 0]} rotation={[-0.25, 0, 0]}>
        {ribs.map((curve,i)=><mesh key={i} castShadow><tubeGeometry args={[curve,20,0.009,5,false]} /><meshStandardMaterial color="#ad8150" roughness={0.85} /></mesh>)}
        {[Math.PI/2,1.85,2.15,2.5].map(phi=><mesh key={phi} position={[0,0.65*Math.cos(phi),0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[0.65*Math.sin(phi),phi===Math.PI/2?0.022:0.008,6,48]} /><meshStandardMaterial color="#ac7e4a" roughness={0.85} /></mesh>)}
        <mesh position={[0, -0.32, 0]} scale={[1, 0.28, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.56, 28, 16]} />
          <FurnitureMaterial color="#b8703d" finish="cloth" />
        </mesh>
        {[-0.22,0.22].flatMap(x=>[-0.2,0.2].map(z=><mesh key={`${x},${z}`} position={[x,-0.188,z]}><sphereGeometry args={[0.015,10,6]} /><meshStandardMaterial color="#875032" roughness={1} /></mesh>))}
      </group>
    </group>
  )
}

// Clear plastic inflatable chair (early 2000s).
export function InflatableChair({ position, rotation = 0, color = '#a24bd6' }: P & { color?: string }) {
  const mat = (
    <meshPhysicalMaterial color={color} roughness={0.15} transmission={0.6} thickness={0.3} transparent opacity={0.75} />
  )
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} castShadow>
        <torusGeometry args={[0.32, 0.17, 16, 32]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.62, 0.3]} rotation={[-0.25, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.15, 16, 32]} />
        {mat}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 0.42, 0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.2, 0.11, 12, 24]} />
          {mat}
        </mesh>
      ))}
    </group>
  )
}

// Lava lamp with slowly rising blobs and a warm glow.
export function LavaLamp({ position, color = '#ff5a1f', glass = '#ffb347' }: P & { color?: string; glass?: string }) {
  const blobs = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    if(usePreferences.getState().reducedMotion)return
    const t = clock.elapsedTime
    blobs.current.forEach((b, i) => {
      if (b) b.position.y = 0.2 + 0.1 * (1 + Math.sin(t * 0.4 + i * 2.1))
    })
  })
  return (
    <group position={position}>
      <Ink color="#b8b8c0" roughness={0.3} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.045, 0.08, 0.12, 20]} />
      </Ink>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.035, 0.06, 0.26, 20]} />
        <meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => m && (blobs.current[i] = m)} position={[0, 0.2, 0]} scale={[1, 1.3, 1]}>
          <sphereGeometry args={[0.022 + i * 0.006, 12, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
        </mesh>
      ))}
      <Ink color="#b8b8c0" roughness={0.3} position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.02, 0.035, 0.06, 20]} />
      </Ink>
      <pointLight position={[0, 0.3, 0]} intensity={1.2} distance={2.2} color={color} />
    </group>
  )
}

export { Poster } from './PosterArt'

// Round shag rug.
export function Rug({ position, radius, color }: P & { radius: number; color: string }) {
  return (
    <group position={position}>
      <mesh receiveShadow><cylinderGeometry args={[radius,radius,0.025,64]} /><FurnitureMaterial color={color} finish="cloth" /></mesh>
      <mesh position={[0,0.012,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius-0.025,0.009,6,64]} /><meshStandardMaterial color="#a89b78" roughness={1} /></mesh>
    </group>
  )
}
