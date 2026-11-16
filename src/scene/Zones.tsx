import { Ink, InkBox } from './Ink'
import { BeanBag, FamilyChair, InflatableChair, LavaLamp, Papasan, Poster, Rug } from './Props'
import { ROOM, faceTV } from './layout'
import { FamilyDesk, RecordConsole } from './CornerFurniture'
import { ArcadeCabinet, NinetiesShelf, RollingTV } from './RetroDetails'
import { NookPaneling } from './Architecture'

const H = ROOM.half
const WALL = H - 0.01 // poster depth just off the wall

// Blockout of the four decade corners. Brands are invented; shapes nod to the real thing.
export function Zones() {
  return (
    <>
      <Seventies />
      <Eighties />
      <Nineties />
      <Noughties />
    </>
  )
}

// 70s: NW corner beside/under the stairs. Wood paneling, orange & brown.
function Seventies() {
  return (
    <group>
      <NookPaneling />
      <Rug position={[-3.95, 0.013, -1.9]} radius={1.0} color="#ae693e" />
      <Papasan position={[-4.05, 0, -1.75]} rotation={faceTV(-4.05, -1.75)} />

      <RecordConsole />

      {/* Side table + lava lamp */}
      <Ink color="#7a4a22" position={[-4.5, 0.25, -3.6]}>
        <cylinderGeometry args={[0.22, 0.2, 0.5, 24]} />
      </Ink>
      <LavaLamp position={[-4.5, 0.5, -3.6]} />

      {/* posters sit proud of the paneling */}
      <Poster position={[-H + 0.035, 1.6, -2.9]} rotation={Math.PI / 2} bg="#f2d9a0" fg="#b5401c" shape="circle" />
      <Poster position={[-2.2, 1.7, -H + 0.035]} bg="#1d1d33" fg="#e8c547" shape="star" />
    </group>
  )
}

// 80s: NE corner. Arcade cabinet, wood TV on a rolling cart, neon.
function Eighties() {
  return (
    <group>
      <Rug position={[3.3, 0.013, -3.4]} radius={1.2} color="#347f79" />
      <BeanBag position={[2.0, 0, -2.65]} rotation={faceTV(2.0, -2.65)} color="#e0457b" />

      <ArcadeCabinet />
      <RollingTV />

      <Poster position={[WALL, 1.6, -2.3]} rotation={-Math.PI / 2} bg="#140a2e" fg="#ff3fd0" shape="grid" />
      <Poster position={[2.0, 1.7, -WALL]} bg="#e83a2c" fg="#fff2c0" shape="stripes" size={[0.85, 0.6]} />
    </group>
  )
}

// 90s: SW corner. Bean bag, shelf of cereal & paperbacks, Lego pile, cards, handheld.
function Nineties() {
  const lego = ['#d22', '#26c', '#fc0', '#2a2', '#fff', '#d22', '#26c', '#fc0']
  return (
    <group>
      <Rug position={[-3.4, 0.013, 3.4]} radius={1.2} color="#465d8c" />
      <BeanBag position={[-3.2, 0, 3.0]} rotation={faceTV(-3.2, 3.0)} color="#6a2bb0" />

      <NinetiesShelf />

      {/* Lego pile */}
      {lego.map((c, i) => (
        <InkBox
          key={i}
          size={[0.06, 0.04, 0.03]}
          position={[-2.4 + Math.sin(i * 2.3) * 0.18, 0.04 + (i % 3) * 0.03, 4.1 + Math.cos(i * 1.7) * 0.15]}
          rotation={[0, i * 0.9, 0]}
          color={c}
          roughness={0.3}
          outline={0.002}
        />
      ))}

      {/* Trading cards on the floor */}
      {lego.map((c,i)=><group key={`studs-${i}`} position={[-2.4+Math.sin(i*2.3)*0.18,0.04+(i%3)*0.03,4.1+Math.cos(i*1.7)*0.15]} rotation={[0,i*0.9,0]}>
        {[-0.015,0.015].map(x=><mesh key={x} position={[x,0.024,0]} castShadow><cylinderGeometry args={[0.007,0.007,0.008,10]} /><meshStandardMaterial color={c} roughness={0.4} /></mesh>)}
      </group>)}
      {[0, 1, 2, 3, 4].map((i) => (
        <InkBox
          key={i}
          size={[0.063, 0.002, 0.088]}
          position={[-2.75 + i * 0.07, 0.03, 2.55 + Math.sin(i) * 0.05]}
          rotation={[0, i * 0.5 - 1, 0]}
          color={i % 2 ? '#f5d142' : '#e9e9e9'}
          outline={0.001}
        />
      ))}

      {/* Gray handheld */}
      <group position={[-3.75, 0.035, 2.5]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <InkBox size={[0.09, 0.15, 0.03]} color="#b9b7b0" roughness={0.5} outline={0.002} />
        <InkBox size={[0.026,0.009,0.003]} position={[-0.022,-0.025,0.017]} color="#303238" outline={0} />
        <InkBox size={[0.009,0.026,0.003]} position={[-0.022,-0.025,0.017]} color="#303238" outline={0} />
        {[0.012,0.028].map((x,i)=><mesh key={x} position={[x,-0.025-i*0.008,0.017]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.006,0.006,0.003,12]} /><meshStandardMaterial color="#855166" roughness={0.4} /></mesh>)}
        <mesh position={[0, 0.03, 0.016]}>
          <planeGeometry args={[0.05, 0.045]} />
          <meshStandardMaterial color="#8a9a3a" />
        </mesh>
      </group>

      {/* Virtual pet egg */}
      <Ink color="#ff7ab8" roughness={0.3} position={[-2.9, 0.04, 2.45]} scale={[1, 1.2, 0.6]}>
        <sphereGeometry args={[0.03, 16, 12]} />
      </Ink>

      <Poster position={[-3.0, 1.6, WALL]} rotation={Math.PI} bg="#18c4b0" fg="#ffe14d" shape="star" />
      <Poster position={[-WALL, 1.6, 2.2]} rotation={Math.PI / 2} bg="#202020" fg="#ff4fa3" shape="stripes" />
    </group>
  )
}

// Early 2000s: SE corner. Inflatable chair, desktop computer, glow stars.
function Noughties() {
  return (
    <group>
      <Rug position={[3.3, 0.013, 3.6]} radius={1.2} color="#7a8c47" />
      <InflatableChair position={[2.55, 0, 2.6]} rotation={faceTV(2.55, 2.6)} />
      <FamilyChair position={[3.8, 0, 3.8]} rotation={-Math.PI / 2} />
      <BeanBag position={[1.6, 0, 4.15]} rotation={faceTV(1.6, 4.15)} color="#ff9a1f" />

      <FamilyDesk />

      {/* CD binder on the floor */}
      <InkBox size={[0.3, 0.06, 0.3]} position={[2.9, 0.03, 2.4]} rotation={[0, 0.3, 0]} color="#2a2a7a" />

      {/* Glow-in-the-dark stars on the ceiling */}
      {[...Array(14)].map((_, i) => (
        <mesh
          key={i}
          position={[2.2 + ((i * 1.37) % 2.6), ROOM.height - 0.005, 2.3 + ((i * 2.11) % 2.5)]}
          rotation={[Math.PI / 2, 0, i]}
        >
          <circleGeometry args={[0.05, 5]} />
          <meshStandardMaterial color="#d8ffb0" emissive="#b6ff6a" emissiveIntensity={0.9} side={2} />
        </mesh>
      ))}

      <Poster position={[3.0, 1.6, WALL]} rotation={Math.PI} bg="#ff5fae" fg="#ffffff" shape="circle" />
      <Poster position={[WALL, 1.6, 2.2]} rotation={-Math.PI / 2} bg="#101418" fg="#ff3b30" shape="stripes" />
    </group>
  )
}
