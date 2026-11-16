import { InkBox, InkLine } from './Ink'
import { Zones } from './Zones'
import { ROOM } from './layout'
import { TV } from './TV'
import { Remote } from './Remote'
import { useStore } from '../store'
import { Atmosphere } from './Atmosphere'
import { CoffeeTable, FurnitureMaterial, LoungeCouch, TVCabinet } from './Furniture'
import { BasementDetails, PlasterWall, WoodFloor } from './Architecture'
import { WallClutter } from './WallClutter'
import { GroundShadows } from './GroundShadows'

const H = ROOM.half
const CEIL = ROOM.height
const L = 0.025 // ink line width for room corners and seams

export function Room() {
  const lightLevel = useStore(s => s.lightLevel)
  return (
    <>
      {/* Warm basement light */}
      <hemisphereLight args={['#ffe9cc', '#4a3426', 0.12 + lightLevel * 0.43]} />
      <pointLight
        position={[0, CEIL - 0.3, 0.3]}
        intensity={16 * lightLevel}
        distance={12}
        color="#ffd9a8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.002}
        shadow-radius={6}
      />
      <Atmosphere />
      <BasementDetails />
      <WoodFloor />
      <GroundShadows />

      {/* Shell: no hull outlines (they swallow the view up close); corners get ink lines instead */}
      <InkBox size={[H * 2, 0.1, H * 2]} position={[0, -0.08, 0]} color="#3f3026" outline={0} />
      {/* Ceiling with an opening over the stairwell (x -1.5..1, z -5..-4) */}
      <InkBox size={[H * 2, 0.1, 9]} position={[0, CEIL + 0.05, 0.5]} color="#d9cbb3" outline={0} />
      <InkBox size={[3.5, 0.1, 1]} position={[-3.25, CEIL + 0.05, -4.5]} color="#d9cbb3" outline={0} />
      <InkBox size={[4, 0.1, 1]} position={[3, CEIL + 0.05, -4.5]} color="#d9cbb3" outline={0} />
      <PlasterWall size={[H * 2, CEIL, 0.1]} position={[0, CEIL / 2, -H - 0.05]} color="#c9b48f" />
      <PlasterWall size={[H * 2, CEIL, 0.1]} position={[0, CEIL / 2, H + 0.05]} color="#bfa98a" />
      <PlasterWall size={[0.1, CEIL, H * 2]} position={[-H - 0.05, CEIL / 2, 0]} color="#b89f7d" />
      <PlasterWall size={[0.1, CEIL, H * 2]} position={[H + 0.05, CEIL / 2, 0]} color="#c4ae8c" />
      <RoomInk />

      {/* Center rug */}
      <mesh position={[0, 0.01, 0.4]} receiveShadow><boxGeometry args={[3.6, 0.02, 3]} /><FurnitureMaterial color="#8a3b2e" finish="cloth" /></mesh>

      {/* TV stand + CRT */}
      <TVCabinet />
      <TV position={[0, 0.85, -1.6]} />

      <CoffeeTable />
      <Remote />

      <LoungeCouch />
      <Zones />
      <WallClutter />

      {/* Staircase along north wall, rising toward +x */}
      <Stairs />
      {/* Stairwell above the ceiling opening */}
      <InkBox size={[2.5, 1.9, 0.1]} position={[-0.25, CEIL + 0.95, -3.95]} color="#b89f7d" outline={0} />
      <InkBox size={[0.1, 1.9, 1]} position={[-1.55, CEIL + 0.95, -4.5]} color="#b89f7d" outline={0} />
      <InkBox size={[2.6, 0.1, 1.1]} position={[-0.25, CEIL + 1.95, -4.5]} color="#d9cbb3" outline={0} />
      {/* Closed door at the top (future hook), light leaking under it */}
      <InkBox size={[0.06, 2, 0.9]} position={[1.03, 3.4, -4.5]} color="#8b6a4a" />
      <InkBox size={[0.06, 0.06, 0.06]} position={[0.98, 3.35, -4.2]} color="#c9a227" outline={0.004} />
      <mesh position={[0.99, 2.43, -4.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 0.03]} />
        <meshBasicMaterial color="#fff2c0" />
      </mesh>
      <pointLight position={[0.7, 2.6, -4.5]} intensity={0.6} distance={1.5} color="#fff2c0" />
    </>
  )
}

// Ink lines along the room's corners and wall/floor/ceiling seams.
function RoomInk() {
  const lines: { size: [number, number, number]; position: [number, number, number] }[] = []
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) lines.push({ size: [L, CEIL, L], position: [sx * H, CEIL / 2, sz * H] })
  for (const y of [0.005, CEIL - 0.005]) {
    for (const s of [-1, 1]) {
      lines.push({ size: [H * 2, L, L], position: [0, y, s * H] })
      lines.push({ size: [L, L, H * 2], position: [s * H, y, 0] })
    }
  }
  return (
    <>
      {lines.map((l, i) => (
        <InkLine key={i} {...l} />
      ))}
    </>
  )
}

function Stairs() {
  const steps = 10
  const run = 0.25
  const rise = 0.24
  return (
    <>
      {Array.from({ length: steps }, (_, i) => (
        <InkBox
          key={i}
          size={[run, 0.06, 1]}
          position={[-1.5 + i * run + run / 2, rise * (i + 1), -H + 0.5]}
          color="#9c7651"
          outline={0.01}
        />
      ))}
      {/* Stringer */}
      <InkBox
        size={[Math.hypot(steps * run, steps * rise), 0.2, 0.06]}
        position={[-1.5 + (steps * run) / 2, (steps * rise) / 2, -H + 1]}
        rotation={[0, 0, Math.atan2(rise, run)]}
        color="#6e4f33"
      />
    </>
  )
}
