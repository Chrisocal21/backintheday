import { useLayoutEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, InstancedMesh, Object3D, Vector3 } from 'three'
import { FurnitureBox, FurnitureMaterial } from './Furniture'
import { RecordPlayer } from './RecordPlayer'
import { ComputerScreen } from './RetroLife'
import { usePreferences } from '../preferences'
import { openDevice } from '../store'

export function RecordConsole() {
  return <group>
    <group position={[-3.6,0,-4.72]}>
      <FurnitureBox size={[1.2,0.05,0.45]} position={[0,0.575,0]} color="#92633a" radius={0.012} />
      <FurnitureBox size={[1.16,0.04,0.42]} position={[0,0.12,0]} color="#6f472b" />
      <FurnitureBox size={[1.16,0.43,0.022]} position={[0,0.34,-0.2]} color="#3d2d22" />
      {[-1,1].map(s=><group key={s}>
        <FurnitureBox size={[0.035,0.43,0.42]} position={[s*0.58,0.34,0]} color="#835a35" />
        <FurnitureBox size={[0.055,0.1,0.055]} position={[s*0.52,0.05,0.16]} rotation={[0,0,-s*0.06]} color="#67442b" />
        <FurnitureBox size={[0.055,0.1,0.055]} position={[s*0.52,0.05,-0.16]} color="#67442b" />
      </group>)}
      <FurnitureBox size={[0.035,0.43,0.42]} position={[0.12,0.34,0]} color="#795031" />
      {['#8d4739','#c19d60','#465a50','#68526e','#ac7742','#536e7c'].map((color,i)=><FurnitureBox key={i} size={[0.025,0.32,0.3]} position={[-0.46+i*0.064,0.3,0.025]} rotation={[0,0,-0.09+i*0.025]} color={color} finish="plastic" radius={0.002} />)}
      <FurnitureBox size={[0.32,0.24,0.028]} position={[0.35,0.28,0.205]} color="#966c42" />
      <FurnitureBox size={[0.11,0.015,0.016]} position={[0.35,0.3,0.228]} color="#b7a37b" finish="plastic" />
    </group>
    <RecordPlayer />
    {/* Slatted crate with visible sleeves instead of a solid cube. */}
    <group position={[-3.1,0.6,-4.72]}>
      <FurnitureBox size={[0.4,0.025,0.32]} position={[0,0.015,0]} color="#997345" />
      {[-1,1].flatMap(s=>[0.07,0.15,0.23].map(y=><group key={`${s},${y}`}>
        <FurnitureBox size={[0.4,0.055,0.014]} position={[0,y,s*0.154]} color="#a48050" />
        <FurnitureBox size={[0.014,0.055,0.3]} position={[s*0.193,y,0]} color="#9b7244" />
      </group>))}
      {['#5b7567','#b58248','#8e5348','#d6bc85','#575673'].map((c,i)=><group key={i} position={[0,0.23+i*0.006,-0.1+i*0.044]} rotation={[0,0,-0.025+i*0.01]}>
        <FurnitureBox size={[0.3,0.3,0.008]} color={c} finish="plastic" radius={0.002} />
        <mesh position={[0,0,0.005]}><circleGeometry args={[0.073,32]} /><meshStandardMaterial color="#d2ba85" roughness={1} /></mesh>
        <mesh position={[0,0,0.006]}><circleGeometry args={[0.033,24]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
      </group>)}
    </group>
    {[-4.5,-2.7].map(x=><group key={x} position={[x,0,-4.75]}>
      <FurnitureBox size={[0.35,0.9,0.3]} position={[0,0.45,0]} color="#704b2e" radius={0.008} />
      <FurnitureBox size={[0.29,0.79,0.015]} position={[0,0.47,0.152]} color="#9a876b" finish="cloth" radius={0.005} />
      <mesh position={[0,0.29,0.162]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.095,0.095,0.001,32]} /><meshStandardMaterial color="#584c3e" transparent opacity={0.2} roughness={1} /></mesh>
      <mesh position={[0,0.7,0.162]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.04,0.04,0.001,24]} /><meshStandardMaterial color="#584c3e" transparent opacity={0.2} roughness={1} /></mesh>
    </group>)}
  </group>
}

function KeyboardKeys() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(()=>{
    if(!mesh.current) return
    const o = new Object3D()
    for(let row=0;row<5;row++) for(let col=0;col<12;col++) {
      o.position.set(-0.255+row*0.026,0.792,-0.174+col*0.031)
      o.updateMatrix(); mesh.current.setMatrixAt(row*12+col,o.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate=true
  },[])
  return <instancedMesh ref={mesh} args={[undefined,undefined,60]} castShadow><boxGeometry args={[0.019,0.008,0.024]} /><meshStandardMaterial color="#d0c6ac" roughness={0.75} /></instancedMesh>
}

export function FamilyDesk() {
  const power=usePreferences(s=>s.computerPower)
  const cable = useMemo(()=>new CatmullRomCurve3([new Vector3(0.17,0.83,0.13),new Vector3(0.3,0.75,0.22),new Vector3(0.3,0.3,0.23),new Vector3(0.15,0.21,0.32)]),[])
  return <group position={[4.62,0,3.8]} onClick={e=>{e.stopPropagation();openDevice('computer')}}>
    <FurnitureBox size={[0.7,0.05,1.4]} position={[0,0.74,0]} color="#b99b70" radius={0.02} />
    {[-0.65,0.65].map(z=><FurnitureBox key={z} size={[0.66,0.72,0.04]} position={[0,0.36,z]} color="#9e805b" />)}
    <FurnitureBox size={[0.03,0.52,1.25]} position={[0.28,0.43,0]} color="#8f7352" />
    <FurnitureBox size={[0.42,0.38,0.4]} position={[0.05,0.98,0]} color="#d9cdb2" finish="plastic" radius={0.027} />
    <FurnitureBox size={[0.25,0.035,0.3]} position={[0.03,0.79,0]} color="#c4b99f" finish="plastic" radius={0.012} />
    <FurnitureBox size={[0.015,0.28,0.34]} position={[-0.163,0.98,0]} color="#a99f8b" finish="plastic" radius={0.006} />
    <ComputerScreen />
    <mesh position={[-0.174,0.82,0.12]}><sphereGeometry args={[0.004,8,8]} /><meshBasicMaterial color="#a0b86c" /></mesh>
    <pointLight position={[-0.45,0.97,0]} intensity={power?0.5:0} distance={1.8} color="#5a8cff" />
    <FurnitureBox size={[0.16,0.025,0.42]} position={[-0.2,0.775,0]} color="#e0d6bc" finish="plastic" radius={0.009} />
    <KeyboardKeys />
    <FurnitureBox size={[0.18,0.003,0.2]} position={[-0.2,0.767,0.4]} color="#465365" finish="cloth" radius={0.001} />
    <mesh position={[-0.2,0.782,0.4]} scale={[0.028,0.016,0.048]} castShadow><sphereGeometry args={[1,20,12]} /><meshStandardMaterial color="#d8cfb9" roughness={0.6} /></mesh>
    <FurnitureBox size={[0.42,0.42,0.18]} position={[0.02,0.21,0.4]} color="#d3c7ad" finish="plastic" radius={0.012} />
    <FurnitureBox size={[0.005,0.027,0.12]} position={[-0.193,0.33,0.4]} color="#938b7b" finish="plastic" radius={0.001} />
    <mesh position={[-0.196,0.2,0.4]}><sphereGeometry args={[0.007,10,8]} /><meshStandardMaterial color="#b1b89b" roughness={0.5} /></mesh>
    <mesh castShadow><tubeGeometry args={[cable,20,0.004,5,false]} /><meshStandardMaterial color="#484338" roughness={0.9} /></mesh>
  </group>
}
