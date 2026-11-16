import { useMemo } from 'react'
import { CanvasTexture, Shape, SRGBColorSpace } from 'three'
import { FurnitureBox } from './Furniture'
import { LavaLamp } from './Props'
import { usePreferences } from '../preferences'

export function ArcadeCabinet() {
  const power=usePreferences(s=>s.consolePower)
  const profile = useMemo(()=>{
    const shape = new Shape()
    ;[[-0.35,0.04],[0.3,0.04],[0.3,0.9],[0.36,0.98],[0.36,1.07],[0.19,1.16],[0.26,1.6],[0.35,1.66],[0.35,1.8],[-0.35,1.8]].forEach(([x,y],i)=>i ? shape.lineTo(x,y) : shape.moveTo(x,y))
    shape.closePath(); return shape
  },[])
  const marquee = useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128
    const c=canvas.getContext('2d')!;c.fillStyle='#21162f';c.fillRect(0,0,512,128)
    c.strokeStyle='#ed7596';c.lineWidth=4;c.strokeRect(8,8,496,112)
    c.font='bold italic 56px sans-serif';c.textAlign='center';c.fillStyle='#f8d798';c.fillText('NIGHT ORBIT',256,84)
    const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;return map
  },[])
  return <group position={[4.6,0,-3.6]} rotation={[0,Math.PI/2,0]}>
    {[-0.35,0.325].map(x=><mesh key={x} position={[x,0,0]} rotation={[0,Math.PI/2,0]} castShadow receiveShadow><extrudeGeometry args={[profile,{depth:0.025,bevelEnabled:false}]} /><meshStandardMaterial color="#383043" roughness={0.72} /></mesh>)}
    <FurnitureBox size={[0.64,0.8,0.55]} position={[0,0.46,-0.01]} color="#24212b" finish="plastic" />
    <FurnitureBox size={[0.65,0.045,0.28]} position={[0,1.045,-0.21]} rotation={[-0.08,0,0]} color="#5f4163" finish="plastic" />
    <FurnitureBox size={[0.62,0.5,0.035]} position={[0,1.4,-0.21]} rotation={[-0.16,0,0]} color="#11181b" finish="plastic" />
    <group position={[0,1.4,-0.235]} rotation={[-0.16,0,0]}>
      <mesh rotation={[0,Math.PI,0]}><planeGeometry args={[0.49,0.36]} /><meshStandardMaterial color="#121528" emissive="#292851" emissiveIntensity={power?0.7:0} roughness={0.25} /></mesh>
      {/* Original attract-screen graphic, with no game footage or brand marks. */}
      {Array.from({length:18},(_,i)=><mesh key={i} position={[Math.sin(i*8.3)*0.22,Math.cos(i*3.7)*0.16,-0.003]}><sphereGeometry args={[0.0015+i%3*0.0007,6,4]} /><meshBasicMaterial color="#b9e2ea" /></mesh>)}
      <mesh position={[0,-0.04,-0.004]}><torusGeometry args={[0.07,0.004,6,32]} /><meshBasicMaterial color="#dcb56c" /></mesh>
    </group>
    <mesh position={[0,1.72,-0.355]} rotation={[0,Math.PI,0]}><planeGeometry args={[0.62,0.12]} /><meshStandardMaterial map={marquee} emissiveMap={marquee} emissive="#fff4dc" emissiveIntensity={power?0.45:0} /></mesh>
    <FurnitureBox size={[0.19,0.24,0.016]} position={[0,0.55,-0.292]} color="#151517" finish="plastic" />
    {[-0.045,0.045].map(x=><group key={x}>
      <FurnitureBox size={[0.035,0.055,0.014]} position={[x,0.58,-0.307]} color="#9d6654" finish="plastic" radius={0.003} />
      <FurnitureBox size={[0.025,0.004,0.016]} position={[x,0.6,-0.317]} color="#101113" finish="plastic" radius={0.001} />
    </group>)}
    <mesh position={[-0.16,1.1,-0.24]} castShadow><cylinderGeometry args={[0.007,0.007,0.085,10]} /><meshStandardMaterial color="#a4a2a1" metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[-0.16,1.145,-0.24]} castShadow><sphereGeometry args={[0.027,16,12]} /><meshStandardMaterial color="#a74748" roughness={0.35} /></mesh>
    {[0.04,0.13,0.22].map((x,i)=><mesh key={x} position={[x,1.08,-0.25]}><cylinderGeometry args={[0.023,0.026,0.013,20]} /><meshStandardMaterial color={['#ba655e','#b7a164','#8a9b79'][i]} roughness={0.4} /></mesh>)}
    <pointLight position={[0,1.4,-0.6]} intensity={power?0.7:0} distance={2} color="#a39cd3" />
  </group>
}

export function NinetiesShelf() {
  return <group position={[-4.77,0,3.6]}>
    {[-0.68,0.68].map(z=><FurnitureBox key={z} size={[0.42,1,0.035]} position={[0,0.5,z]} color="#c9bda4" radius={0.007} />)}
    {[0.1,0.52,1].map(y=><FurnitureBox key={y} size={[0.42,0.035,1.4]} position={[0,y,0]} color="#d9cbb0" radius={0.006} />)}
    <FurnitureBox size={[0.016,0.9,1.35]} position={[-0.2,0.55,0]} color="#a99c83" />
    {['#b79a4b','#a2503f','#53798e','#bc8145'].map((c,i)=><group key={i} position={[0.02,1.17,-0.5+i*0.24]}>
      <FurnitureBox size={[0.26,0.3,0.17]} color={c} finish="plastic" radius={0.002} />
      <FurnitureBox size={[0.002,0.032,0.13]} position={[0.132,0.08,0]} color="#e2d7b1" finish="plastic" radius={0.0005} />
      <mesh position={[0.134,-0.025,0]} rotation={[0,Math.PI/2,0]}><circleGeometry args={[0.045,20]} /><meshStandardMaterial color="#dfc48a" roughness={1} /></mesh>
    </group>)}
    {['#42664a','#715370','#788048','#a45943','#485c73','#a68b60','#6e6764'].map((c,i)=><group key={i} position={[0.025,0.69,-0.46+i*0.075]} rotation={[i>4?0.06:0,0,0]}>
      <FurnitureBox size={[0.26,0.28+(i%3)*0.018,0.045]} color={c} finish="plastic" radius={0.003} />
      <FurnitureBox size={[0.002,0.013,0.032]} position={[0.133,0.065,0]} color="#cabf9e" finish="plastic" radius={0.0005} />
    </group>)}
    <FurnitureBox size={[0.3,0.18,0.38]} position={[0.015,0.22,0.35]} color="#5e696b" finish="cloth" radius={0.012} />
    <FurnitureBox size={[0.003,0.028,0.11]} position={[0.167,0.245,0.35]} color="#c2b69c" finish="plastic" radius={0.001} />
    <LavaLamp position={[0.05,1.02,0.45]} color="#5eb7c1" glass="#b2d5d2" />
  </group>
}

export function RollingTV() {
  return <group position={[3.6,0,-4.65]}>
    {[0.18,0.6].map(y=><FurnitureBox key={y} size={[0.85,0.035,0.6]} position={[0,y,0]} color="#a38b68" />)}
    {[-0.36,0.36].flatMap(x=>[-0.23,0.23].map(z=><group key={`${x},${z}`}>
      <FurnitureBox size={[0.025,0.52,0.025]} position={[x,0.35,z]} color="#6d6a63" finish="plastic" radius={0.004} />
      <mesh position={[x,0.06,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.045,0.045,0.025,16]} /><meshStandardMaterial color="#292a2c" roughness={0.8} /></mesh>
    </group>))}
    <FurnitureBox size={[0.72,0.55,0.5]} position={[0,0.91,0]} color="#94663e" radius={0.02} />
    <FurnitureBox size={[0.5,0.42,0.025]} position={[-0.08,0.92,0.252]} color="#171d1d" finish="plastic" />
    <FurnitureBox size={[0.46,0.38,0.009]} position={[-0.08,0.92,0.268]} color="#2e3935" finish="plastic" radius={0.004} />
    <FurnitureBox size={[0.12,0.38,0.014]} position={[0.26,0.92,0.25]} color="#c2b08c" finish="plastic" />
    {[0.99,0.87].map(y=><mesh key={y} position={[0.26,y,0.275]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.032,0.032,0.02,20]} /><meshStandardMaterial color="#77766c" metalness={0.35} roughness={0.5} /></mesh>)}
    {Array.from({length:6},(_,i)=><FurnitureBox key={i} size={[0.072,0.004,0.004]} position={[0.26,0.8+i*0.009,0.263]} color="#5b584d" finish="plastic" radius={0.001} />)}
    {[-0.5,0.5].map(r=><mesh key={r} position={[Math.sin(r)*0.18,1.36,0]} rotation={[0,0,-r]}><cylinderGeometry args={[0.004,0.004,0.42,8]} /><meshStandardMaterial color="#a29f97" metalness={0.8} roughness={0.3} /></mesh>)}
    {['#6d5b42','#965747','#4e645e'].map((c,i)=><FurnitureBox key={i} size={[0.4,0.035,0.25]} position={[0,0.22+i*0.037,0.02]} color={c} finish="plastic" radius={0.003} />)}
  </group>
}
