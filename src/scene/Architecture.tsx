import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DataTexture, InstancedMesh, Object3D, RepeatWrapping, RGBAFormat } from 'three'
import { FurnitureBox, furnitureTexture } from './Furniture'
import { useStore } from '../store'

export function WoodFloor() {
  const mesh=useRef<InstancedMesh>(null)
  const boards=useMemo(()=>{
    const list:{x:number;z:number;length:number;tone:number}[]=[]
    for(let column=0;column<25;column++) {
      const offset=(column%3)*0.66
      for(let row=-1;row<6;row++) {
        const start=Math.max(-5,-5+row*2+offset),end=Math.min(5,-3+row*2+offset)
        if(end>start) list.push({x:-4.8+column*0.4,z:(start+end)/2,length:end-start,tone:0.86+((column*13+row*7)%11)/90})
      }
    }
    return list
  },[])
  const map=useMemo(()=>{const t=furnitureTexture('wood').clone();t.center.set(0.5,0.5);t.rotation=Math.PI/2;t.needsUpdate=true;return t},[])
  useLayoutEffect(()=>{
    if(!mesh.current)return
    const o=new Object3D(),color=new Color()
    boards.forEach((b,i)=>{o.position.set(b.x,-0.013,b.z);o.scale.set(0.397,0.026,b.length-0.003);o.updateMatrix();mesh.current!.setMatrixAt(i,o.matrix);color.set('#9a7957').multiplyScalar(b.tone);mesh.current!.setColorAt(i,color)})
    mesh.current.instanceMatrix.needsUpdate=true
    if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true
  },[boards])
  return <instancedMesh ref={mesh} args={[undefined,undefined,boards.length]} receiveShadow>
    <boxGeometry args={[1,1,1]} />
    <meshStandardMaterial map={map} bumpMap={map} bumpScale={0.001} roughness={0.7} />
  </instancedMesh>
}

let plaster:DataTexture|undefined
function wallTexture() {
  if(plaster)return plaster
  const n=128,data=new Uint8Array(n*n*4)
  for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
    const value=220+((x*73+y*107+x*y*17)%23)-11,i=(y*n+x)*4
    data[i]=data[i+1]=data[i+2]=value;data[i+3]=255
  }
  plaster=new DataTexture(data,n,n,RGBAFormat);plaster.wrapS=plaster.wrapT=RepeatWrapping;plaster.repeat.set(8,3);plaster.needsUpdate=true
  return plaster
}
export function PlasterWall({size,position,color}:{size:[number,number,number];position:[number,number,number];color:string}) {
  const bump=wallTexture()
  return <mesh position={position} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} bumpMap={bump} bumpScale={0.004} roughness={0.97} /></mesh>
}

export function BasementDetails() {
  const level=useStore(s=>s.lightLevel)
  return <>
    {/* A practical fixture at the actual overhead light, rather than an invisible source. */}
    <group position={[0,2.74,0.3]} onClick={e=>{e.stopPropagation();useStore.getState().setElectronics('lights');document.exitPointerLock()}}>
      <mesh><cylinderGeometry args={[0.27,0.27,0.025,40]} /><meshStandardMaterial color="#9e8b68" metalness={0.45} roughness={0.45} /></mesh>
      <mesh rotation={[Math.PI,0,0]} scale={[1,0.5,1]}><sphereGeometry args={[0.245,40,20,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color="#d8c7a4" emissive="#ffcc84" emissiveIntensity={level*1.5} roughness={0.55} /></mesh>
      <mesh position={[0,-0.125,0]}><sphereGeometry args={[0.015,12,8]} /><meshStandardMaterial color="#8c7959" metalness={0.45} roughness={0.4} /></mesh>
    </group>
    {/* Subtle ceiling panel joints stop before the stair opening. */}
    {Array.from({length:7},(_,i)=><group key={i}>
      <mesh position={[-3.75+i*1.25,2.798,0.5]}><boxGeometry args={[0.007,0.002,9]} /><meshStandardMaterial color="#b1a58f" roughness={1} /></mesh>
      <mesh position={[0,2.798,-3.75+i*1.25]}><boxGeometry args={[10,0.002,0.007]} /><meshStandardMaterial color="#b1a58f" roughness={1} /></mesh>
    </group>)}
    {/* High basement windows: dark outdoors, with a little cool glass reflection. */}
    {[1.9,3.65].map(x=><group key={x} position={[x,2.3,-4.94]}>
      <FurnitureBox size={[1.25,0.49,0.05]} color="#a69c85" radius={0.006} />
      <FurnitureBox size={[1.13,0.37,0.012]} position={[0,0,0.031]} color="#13232d" finish="plastic" radius={0.002} />
      <mesh position={[0,0,0.039]}><planeGeometry args={[1.1,0.34]} /><meshStandardMaterial color="#1e3442" emissive="#223c54" emissiveIntensity={0.15} roughness={0.2} metalness={0.15} /></mesh>
      <FurnitureBox size={[0.025,0.38,0.018]} position={[0,0,0.045]} color="#a69c85" radius={0.003} />
      <FurnitureBox size={[1.33,0.045,0.12]} position={[0,-0.25,0.035]} color="#9b8c70" radius={0.008} />
    </group>)}
  </>
}

export function NookPaneling() {
  const map=useMemo(()=>{const t=furnitureTexture('wood').clone();t.center.set(0.5,0.5);t.rotation=Math.PI/2;t.needsUpdate=true;return t},[])
  return <>
    {Array.from({length:7},(_,i)=><mesh key={`north${i}`} position={[-4.75+i*0.5,1.4,-4.977]} receiveShadow><boxGeometry args={[0.492,2.8,0.014]} /><meshStandardMaterial color={['#795333','#714c2e','#805938'][i%3]} map={map} bumpMap={map} bumpScale={0.001} roughness={0.7} /></mesh>)}
    {Array.from({length:6},(_,i)=><mesh key={`west${i}`} position={[-4.977,1.4,-4.75+i*0.46]} rotation={[0,Math.PI/2,0]} receiveShadow><boxGeometry args={[0.452,2.8,0.014]} /><meshStandardMaterial color={['#795333','#714c2e','#805938'][i%3]} map={map} bumpMap={map} bumpScale={0.001} roughness={0.7} /></mesh>)}
  </>
}
