import { RoundedBox } from '@react-three/drei'
import { DataTexture, RGBAFormat, RepeatWrapping, SRGBColorSpace } from 'three'

// Small deterministic, shared textures: no asset downloads or runtime randomness.
function surface(kind: 'wood' | 'cloth') {
  const n = 256, data = new Uint8Array(n*n*4)
  for (let y=0;y<n;y++) for(let x=0;x<n;x++) {
    const noise = ((x*173 + y*37 + x*y*13) % 101) / 100 - 0.5
    const wave = y + Math.sin(x/49)*3 + Math.sin(x/19)*0.8
    const tone = kind === 'wood'
      ? 218 + Math.sin(wave*0.24)*12 + Math.sin(wave*1.6)*5 + noise*8
      : 226 + Math.sin(x*Math.PI/2)*9 + Math.sin(y*Math.PI/2)*6 + noise*14
    const i=(y*n+x)*4
    data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,tone));data[i+3]=255
  }
  const map = new DataTexture(data,n,n,RGBAFormat)
  map.wrapS = map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 4
  map.needsUpdate = true
  return map
}
let wood: DataTexture | undefined, cloth: DataTexture | undefined
export function furnitureTexture(kind: 'wood' | 'cloth') {
  return kind === 'wood' ? (wood ??= surface('wood')) : (cloth ??= surface('cloth'))
}
export function FurnitureMaterial({color, finish='wood'}: {color:string; finish?:'wood'|'cloth'|'plastic'}) {
  const map = finish === 'plastic' ? undefined : furnitureTexture(finish)
  return <meshStandardMaterial color={color} map={map} bumpMap={map} bumpScale={finish === 'cloth' ? 0.003 : 0.0012} roughness={finish === 'cloth' ? 0.98 : finish === 'plastic' ? 0.72 : 0.54} />
}
type Box = { size:[number,number,number]; position?:[number,number,number]; rotation?:[number,number,number]; color:string; finish?:'wood'|'cloth'|'plastic'; radius?:number }
export function FurnitureBox({size,position,rotation,color,finish='wood',radius=0.015}:Box) {
  return <RoundedBox args={size} radius={Math.min(radius, Math.min(...size)*0.45)} smoothness={4} position={position} rotation={rotation} castShadow receiveShadow>
    <FurnitureMaterial color={color} finish={finish} />
  </RoundedBox>
}

export function CoffeeTable() {
  return <group>
    <FurnitureBox size={[1.2,0.075,0.6]} position={[0,0.42,0]} color="#a47b50" radius={0.028} />
    {/* Rounded apron and gently splayed legs. */}
    {[-1,1].map(s=><FurnitureBox key={s} size={[1.04,0.09,0.035]} position={[0,0.345,s*0.245]} color="#715032" />)}
    {[-1,1].flatMap(x=>[-1,1].map(z=><FurnitureBox key={`${x},${z}`} size={[0.062,0.35,0.062]} position={[x*0.5,0.18,z*0.2]} rotation={[z*0.035,0,-x*0.035]} color="#705031" radius={0.012} />))}
    <FurnitureBox size={[0.98,0.026,0.4]} position={[0,0.14,0]} color="#8c643e" />
    {/* Cork coaster, a ceramic mug, and a soft wear ring. */}
    <mesh position={[-0.34,0.46,-0.09]} receiveShadow><cylinderGeometry args={[0.065,0.065,0.004,32]} /><meshStandardMaterial color="#a58b61" roughness={1} /></mesh>
    <mesh position={[-0.34,0.503,-0.09]} castShadow><cylinderGeometry args={[0.043,0.036,0.085,32,1,true]} /><meshStandardMaterial color="#d6c6a4" roughness={0.35} side={2} /></mesh>
    <mesh position={[-0.34,0.535,-0.09]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.037,32]} /><meshStandardMaterial color="#38241a" roughness={0.3} /></mesh>
    <mesh position={[-0.39,0.508,-0.09]} rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[0.027,0.008,8,20]} /><meshStandardMaterial color="#d6c6a4" roughness={0.35} /></mesh>
    <mesh position={[0.06,0.458,-0.12]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[0.052,0.055,40]} /><meshStandardMaterial color="#6f5037" transparent opacity={0.22} roughness={0.9} depthWrite={false} /></mesh>
  </group>
}

export function TVCabinet() {
  return <group position={[0,0,-1.6]}>
    <FurnitureBox size={[1.8,0.055,0.6]} position={[0,0.475,0]} color="#8f6744" radius={0.018} />
    <FurnitureBox size={[1.72,0.045,0.54]} position={[0,0.13,0]} color="#715033" />
    <FurnitureBox size={[1.72,0.29,0.025]} position={[0,0.3,-0.26]} color="#3f2d21" />
    {[-1,1].map(s=><group key={s}>
      <FurnitureBox size={[0.045,0.31,0.54]} position={[s*0.85,0.3,0]} color="#795637" />
      <FurnitureBox size={[0.45,0.28,0.035]} position={[s*0.59,0.3,0.255]} color="#916941" radius={0.01} />
      <FurnitureBox size={[0.012,0.09,0.02]} position={[s*0.43,0.31,0.282]} color="#bcaa7b" finish="plastic" radius={0.004} />
      <FurnitureBox size={[0.04,0.3,0.51]} position={[s*0.34,0.3,0]} color="#705034" />
    </group>)}
    {[-0.77,0.77].flatMap(x=>[-0.21,0.21].map(z=><FurnitureBox key={`${x},${z}`} size={[0.075,0.11,0.075]} position={[x,0.055,z]} color="#493222" />))}
    <FurnitureBox size={[0.57,0.07,0.31]} position={[0,0.19,0.035]} color="#25272a" finish="plastic" radius={0.008} />
    <FurnitureBox size={[0.23,0.009,0.007]} position={[-0.08,0.195,0.194]} color="#111416" finish="plastic" radius={0.002} />
    {[0,1,2].map(i=><FurnitureBox key={i} size={[0.5,0.022,0.27]} position={[0,0.25+i*0.023,0.04]} color={['#6a4039','#b9aa88','#3d514d'][i]} radius={0.004} />)}
  </group>
}

export function LoungeCouch() {
  return <group position={[0,0,2.1]}>
    <FurnitureBox size={[2.3,0.28,0.85]} position={[0,0.23,0]} color="#626c3f" finish="cloth" radius={0.075} />
    <FurnitureBox size={[2.27,0.47,0.2]} position={[0,0.58,0.32]} color="#626c3f" finish="cloth" radius={0.065} />
    {[-0.7,0,0.7].map((x,i)=><group key={x}>
      <FurnitureBox size={[0.68,0.155,0.66]} position={[x,0.425,-0.055]} color={['#858a55','#7d8450','#838856'][i]} finish="cloth" radius={0.055} />
      <FurnitureBox size={[0.64,0.38,0.18]} position={[x,0.68,0.19]} rotation={[-0.13,0,(i-1)*0.018]} color="#7c8350" finish="cloth" radius={0.07} />
      {/* Fine upholstery welting across the cushion fronts. */}
      <FurnitureBox size={[0.58,0.008,0.008]} position={[x,0.4,-0.383]} color="#a0a272" finish="cloth" radius={0.003} />
    </group>)}
    {[-1.1,1.1].map(x=><FurnitureBox key={x} size={[0.23,0.43,0.85]} position={[x,0.4,0]} color="#737c49" finish="cloth" radius={0.105} />)}
    <FurnitureBox size={[0.33,0.3,0.16]} position={[-0.82,0.63,-0.015]} rotation={[-0.16,0,0.18]} color="#ba854f" finish="cloth" radius={0.065} />
    <FurnitureBox size={[0.32,0.29,0.16]} position={[0.82,0.63,-0.015]} rotation={[-0.16,0,-0.17]} color="#b5a787" finish="cloth" radius={0.065} />
    {/* A folded rust-coloured throw over the back. */}
    <FurnitureBox size={[0.43,0.025,0.3]} position={[-0.42,0.83,0.26]} rotation={[0,0.08,0]} color="#9b603b" finish="cloth" radius={0.009} />
    <FurnitureBox size={[0.43,0.32,0.022]} position={[-0.42,0.67,0.432]} color="#9b603b" finish="cloth" radius={0.008} />
    {[-1.02,1.02].flatMap(x=>[-0.32,0.32].map(z=><FurnitureBox key={`${x},${z}`} size={[0.075,0.1,0.075]} position={[x,0.05,z]} color="#4b3424" radius={0.009} />))}
  </group>
}
