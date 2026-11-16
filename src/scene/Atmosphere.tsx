import { DoubleSide } from 'three'
import { useStore } from '../store'
import { Ink, InkBox } from './Ink'
import { usePreferences } from '../preferences'

function FloorLamp({ position }: { position: [number, number, number] }) {
  const dim = useStore(s => s.lampLevel)
  const enabled=usePreferences(s=>position[0]<-2?s.nookLamp:s.leftLamp)
  const level=enabled?dim:0
  return <group position={position} onClick={e => { e.stopPropagation(); useStore.getState().setElectronics('lights'); document.exitPointerLock() }}>
    <Ink color="#403326" roughness={0.4} position={[0, 0.04, 0]} outline={0.002}>
      <cylinderGeometry args={[0.22, 0.24, 0.08, 32]} />
    </Ink>
    <Ink color="#897351" roughness={0.4} position={[0, 0.81, 0]} outline={0.001}>
      <cylinderGeometry args={[0.018, 0.024, 1.55, 16]} />
    </Ink>
    <mesh position={[0, 1.61, 0]}>
      <cylinderGeometry args={[0.19, 0.34, 0.42, 40, 1, true]} />
      <meshStandardMaterial color="#e7c796" emissive="#ffb85e" emissiveIntensity={level * 0.65} roughness={1} side={DoubleSide} />
    </mesh>
    <mesh position={[0, 1.59, 0]}>
      <sphereGeometry args={[0.055, 16, 12]} />
      <meshBasicMaterial color={level > 0 ? '#ffe2ae' : '#655848'} />
    </mesh>
    <pointLight position={[0, 1.49, 0]} intensity={level * 5} distance={5} decay={2} color="#ffc078" />
    {[1.4, 1.82].map((y, i) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[i ? 0.19 : 0.34, 0.008, 6, 40]} />
      <meshStandardMaterial color="#947244" roughness={0.7} />
    </mesh>)}
  </group>
}

export function Atmosphere() {
  const tvGlow = useStore(s => s.tvGlow)
  const power=usePreferences(s=>s.tvPower)
  return <>
    <FloorLamp position={[-1.8, 0, 1.85]} />
    <FloorLamp position={[-2.1, 0, -4.15]} />
    {/* A steady CRT spill; deliberately no flicker during long sessions. */}
    <pointLight position={[0, 1.05, -0.9]} intensity={power?tvGlow * 3.5:0} distance={4.5} decay={2} color="#a4c5ff" />
    {/* Skirting, ceiling trim, and floor joints ground the room's scale. */}
    {[-1, 1].map(s => <group key={s}>
      <InkBox size={[10, 0.14, 0.065]} position={[0, 0.07, s * 4.96]} color="#705139" outline={0.001} />
      <InkBox size={[0.065, 0.14, 10]} position={[s * 4.96, 0.07, 0]} color="#705139" outline={0.001} />
      <InkBox size={[10, 0.075, 0.07]} position={[0, 2.75, s * 4.95]} color="#a28c6d" outline={0} />
      <InkBox size={[0.07, 0.075, 10]} position={[s * 4.95, 2.75, 0]} color="#a28c6d" outline={0} />
    </group>)}
    {/* A worn border and simple woven stripes on the shared rug. */}
    {[-1, 1].map(s => <group key={s}>
      <InkBox size={[3.4, 0.004, 0.055]} position={[0, 0.023, 0.4 + s * 1.37]} color="#c09768" outline={0} />
      <InkBox size={[0.055, 0.004, 2.78]} position={[s * 1.67, 0.023, 0.4]} color="#c09768" outline={0} />
    </group>)}
  </>
}
