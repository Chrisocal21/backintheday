import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Group, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { FurnitureBox } from './Furniture'
import { openDevice } from '../store'
import { usePreferences } from '../preferences'
import { useListening } from '../listening/state'

export function ComputerScreen() {
  const map=useMemo(()=>{const c=document.createElement('canvas');c.width=320;c.height=256;const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t},[])
  const last=useRef(-1),power=usePreferences(s=>s.computerPower)
  useFrame(({clock})=>{
    const p=usePreferences.getState(),t=p.reducedMotion?0:clock.elapsedTime
    if(last.current===Math.floor(t*12) && p.computerPower===power)return
    last.current=Math.floor(t*12)
    const c=(map.image as HTMLCanvasElement).getContext('2d')!;c.fillStyle='#070e1b';c.fillRect(0,0,320,256)
    if(p.computerPower) {
      for(let i=0;i<48;i++){const z=1-((i/48+t*0.035)%1),x=160+Math.sin(i*9.8)*70/Math.max(z,0.15),y=128+Math.cos(i*4.3)*50/Math.max(z,0.15);c.fillStyle=i%3?'#b9c9d3':'#829ebd';c.fillRect(x,y,1+(1-z)*2,1+(1-z)*2)}
      c.font='13px monospace';c.textAlign='center';c.fillStyle='#91a3ad';c.fillText('FAMILY COMPUTER',160,238)
    }
    map.needsUpdate=true
  })
  useEffect(()=>{last.current=-1},[power])
  return <mesh position={[-0.173,0.99,0]} rotation={[0,-Math.PI/2,0]} onClick={e=>{e.stopPropagation();openDevice('computer')}}><planeGeometry args={[0.3,0.24]} /><meshStandardMaterial map={map} emissiveMap={map} emissive={power?'#ffffff':'#000000'} emissiveIntensity={0.5} roughness={0.2} /></mesh>
}

export function CassetteDeck() {
  const reels=useRef<Group>(null),synth=usePreferences(s=>s.cassettePlaying),stream=useListening(s=>s.tape?.playing??false),playing=synth||stream
  useFrame((_,dt)=>{if(reels.current && playing && !usePreferences.getState().reducedMotion)reels.current.children.forEach(o=>o.rotation.z-=dt*0.8)})
  return <group position={[2.3,0.15,-4.65]} onClick={e=>{e.stopPropagation();openDevice('cassette')}}>
    <FurnitureBox size={[0.6,0.28,0.16]} color="#3b3b38" finish="plastic" radius={0.012} />
    {[-0.2,0.2].map(x=><group key={x}>
      <mesh position={[x,-0.005,0.086]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.085,0.085,0.008,32]} /><meshStandardMaterial color="#181c1b" roughness={0.9} /></mesh>
      <mesh position={[x,-0.005,0.092]}><torusGeometry args={[0.065,0.003,6,32]} /><meshStandardMaterial color="#74766b" roughness={0.6} /></mesh>
    </group>)}
    <FurnitureBox size={[0.17,0.09,0.012]} position={[0,-0.02,0.084]} color="#a69d7e" finish="plastic" radius={0.005} />
    <group ref={reels} position={[0,-0.02,0.094]}>{[-0.042,0.042].map(x=><group key={x} position={[x,0,0]}><mesh><ringGeometry args={[0.013,0.022,24]} /><meshStandardMaterial color="#353a34" /></mesh><FurnitureBox size={[0.034,0.003,0.002]} color="#c0b89f" finish="plastic" radius={0.0005} /></group>)}</group>
    {[-0.065,-0.025,0.015,0.055].map(x=><FurnitureBox key={x} size={[0.029,0.014,0.04]} position={[x,0.147,0.035]} color="#a59b82" finish="plastic" radius={0.003} />)}
    <FurnitureBox size={[0.34,0.025,0.026]} position={[0,0.205,-0.025]} color="#858477" finish="plastic" />
    {[-0.16,0.16].map(x=><FurnitureBox key={x} size={[0.025,0.07,0.026]} position={[x,0.175,-0.025]} color="#858477" finish="plastic" />)}
    <mesh position={[0.1,0.075,0.086]}><sphereGeometry args={[0.004,8,8]} /><meshBasicMaterial color={playing?'#d5b56a':'#3f3929'} /></mesh>
  </group>
}

function PersonalPrint({position,rotation,kind}:{position:[number,number,number];rotation:number;kind:'photo'|'poster'}) {
  const data=usePreferences(s=>kind==='photo'?s.photoData:s.posterData),[map,setMap]=useState<Texture|null>(null)
  useEffect(()=>{
    let current=true,texture:Texture|undefined
    if(!data){setMap(null);return}
    new TextureLoader().load(data,t=>{texture=t;t.colorSpace=SRGBColorSpace;if(current)setMap(t);else t.dispose()})
    return()=>{current=false;texture?.dispose()}
  },[data])
  const w=kind==='photo'?0.38:0.6,h=kind==='photo'?0.45:0.8
  const aspect=map?.image?.width/map?.image?.height
  const imageW=map?Math.min(w,h*aspect):w,imageH=map?Math.min(h,w/aspect):h
  return <group position={position} rotation={[0,rotation,0]} onClick={e=>{e.stopPropagation();openDevice('personal')}}>
    <FurnitureBox size={[w+0.04,h+0.04,0.025]} color="#70513a" />
    <mesh position={[0,0,0.014]}><planeGeometry args={[w,h]} /><meshStandardMaterial color="#d4c39d" roughness={0.9} /></mesh>
    {map&&<mesh position={[0,0,0.016]}><planeGeometry args={[imageW,imageH]} /><meshStandardMaterial map={map} roughness={0.9} /></mesh>}
    {!map&&<><mesh position={[0,0.025,0.016]}><circleGeometry args={[w*0.2,32]} /><meshStandardMaterial color="#8c9a87" /></mesh><FurnitureBox size={[w*0.6,0.012,0.002]} position={[0,-h*0.28,0.016]} color="#9b845c" finish="plastic" radius={0.0005} /></>}
  </group>
}
export function PersonalPrints() {
  return <><PersonalPrint position={[-1.2,1.72,4.94]} rotation={Math.PI} kind="photo" /><PersonalPrint position={[4.94,1.45,1.3]} rotation={-Math.PI/2} kind="poster" /></>
}
