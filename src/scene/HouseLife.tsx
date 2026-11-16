import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Group, LineSegments, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three'
import { openDevice, useStore } from '../store'
import { usePreferences } from '../preferences'
import { FurnitureBox } from './Furniture'
import { useStation } from '../stations/state'

function RainGlass({x}:{x:number}) {
  const ref=useRef<LineSegments>(null),weather=usePreferences(s=>s.weather)
  const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(48*6),3));return g},[])
  useFrame(({clock})=>{
    if(!ref.current || weather==='clear')return
    const a=geometry.attributes.position as BufferAttribute,p=usePreferences.getState(),time=p.reducedMotion?0:clock.elapsedTime
    for(let i=0;i<48;i++) {
      const px=-0.53+((i*37)%101)/101*1.06,y=0.16-((time*(0.06+i%5*0.015)+i*0.037)%0.32)
      a.setXYZ(i*2,px,y,0);a.setXYZ(i*2+1,px+0.004,Math.max(-0.16,y-0.025),0)
    }
    a.needsUpdate=true
  })
  return <lineSegments ref={ref} geometry={geometry} position={[x,2.3,-4.892]} visible={weather!=='clear'}><lineBasicMaterial color="#aac7d5" transparent opacity={weather==='storm'?0.4:0.23} depthWrite={false} /></lineSegments>
}

function WallSwitch() {
  const level=useStore(s=>s.lightLevel),p=usePreferences()
  return <group position={[1.18,1.23,-4.93]}>
    <group onClick={e=>{e.stopPropagation();useStore.getState().setLightLevel(level>0?0:0.45)}}>
      <FurnitureBox size={[0.1,0.16,0.018]} color="#c7bda6" finish="plastic" radius={0.008} />
      <FurnitureBox size={[0.032,0.07,0.025]} position={[0,0,0.018]} rotation={[level>0?-0.16:0.16,0,0]} color="#e5dac0" finish="plastic" radius={0.005} />
      {[-0.062,0.062].map(y=><mesh key={y} position={[0,y,0.01]}><circleGeometry args={[0.004,10]} /><meshStandardMaterial color="#79766a" metalness={0.6} /></mesh>)}
    </group>
    <group position={[0.25,0,0]} onClick={e=>{e.stopPropagation();openDevice('room')}}>
      <FurnitureBox size={[0.3,0.2,0.018]} color="#a87d47" radius={0.009} />
      <mesh position={[0,0,0.011]}><planeGeometry args={[0.27,0.17]} /><meshStandardMaterial map={useMemo(()=>{
        const c=document.createElement('canvas');c.width=300;c.height=180;const g=c.getContext('2d')!;g.fillStyle='#ded0ac';g.fillRect(0,0,300,180);g.fillStyle='#55452e';g.textAlign='center';g.font='bold 27px monospace';g.fillText('YOUR ROOM',150,65);g.font='19px monospace';g.fillText('Sound · Weather',150,106);g.fillText('O · Settings',150,143);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t
      },[])} roughness={1} /></mesh>
    </group>
  </group>
}

function WallClock() {
  const second=useRef<Mesh>(null),minute=useRef<Group>(null),hour=useRef<Group>(null)
  const texture=useMemo(()=>{
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d')!;g.fillStyle='#dfd5b9';g.fillRect(0,0,256,256);g.fillStyle='#413c30';g.textAlign='center';g.textBaseline='middle';g.font='22px Georgia'
    for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;g.fillText(String(i),128+Math.sin(a)*94,128-Math.cos(a)*94)}
    const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t
  },[])
  useFrame(()=>{
    const now=new Date(),sec=now.getSeconds(),min=now.getMinutes()+sec/60,hr=now.getHours()%12+min/60
    if(second.current)second.current.rotation.z=-sec/60*Math.PI*2
    if(minute.current)minute.current.rotation.z=-min/60*Math.PI*2
    if(hour.current)hour.current.rotation.z=-hr/12*Math.PI*2
  })
  return <group position={[0,2.47,4.94]} rotation={[0,Math.PI,0]}>
    <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[0.17,0.17,0.035,40]} /><meshStandardMaterial color="#674b34" roughness={0.7} /></mesh>
    <mesh position={[0,0,0.019]}><circleGeometry args={[0.153,48]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh>
    <group ref={hour}><FurnitureBox size={[0.008,0.07,0.003]} position={[0,0.025,0.023]} color="#3c3932" finish="plastic" radius={0.001} /></group>
    <group ref={minute}><FurnitureBox size={[0.005,0.11,0.003]} position={[0,0.043,0.026]} color="#3c3932" finish="plastic" radius={0.001} /></group>
    <mesh ref={second} position={[0,0,0.03]}><boxGeometry args={[0.002,0.22,0.002]} /><meshStandardMaterial color="#9d4838" /></mesh>
  </group>
}

function DigitalClock() {
  const stamp=useRef('')
  const map=useMemo(()=>{const c=document.createElement('canvas');c.width=256;c.height=80;const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t},[])
  useFrame(()=>{
    const date=new Date(),time=`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    if(time===stamp.current)return
    stamp.current=time;const c=(map.image as HTMLCanvasElement).getContext('2d')!;c.fillStyle='#09110d';c.fillRect(0,0,256,80);c.font='58px monospace';c.textAlign='center';c.fillStyle='#a2b98a';c.fillText(time,128,61);map.needsUpdate=true
  })
  return <group position={[4.5,0.805,3.26]} rotation={[0,-Math.PI/2,0]}>
    <FurnitureBox size={[0.19,0.065,0.055]} color="#343731" finish="plastic" radius={0.008} />
    <mesh position={[0,0,0.028]}><planeGeometry args={[0.17,0.05]} /><meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.3} roughness={0.5} /></mesh>
  </group>
}

function Outlet({position,rotation=0}:{position:[number,number,number];rotation?:number}) {
  return <group position={position} rotation={[0,rotation,0]}>
    <FurnitureBox size={[0.09,0.14,0.012]} color="#c7bda6" finish="plastic" radius={0.008} />
    {[-0.035,0.035].map(y=><group key={y}>
      <FurnitureBox size={[0.055,0.045,0.004]} position={[0,y,0.009]} color="#ded3b9" finish="plastic" radius={0.009} />
      {[-0.012,0.012].map(x=><FurnitureBox key={x} size={[0.003,0.012,0.002]} position={[x,y+0.004,0.012]} color="#464238" finish="plastic" radius={0.0005} />)}
    </group>)}
  </group>
}
export function HouseLife() {
  const {gl,camera}=useThree(),brightness=usePreferences(s=>s.brightness)
  const aimed=useRef<string|null>(null)
  useEffect(()=>{gl.toneMappingExposure=brightness},[gl,brightness])
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(useStation.getState().open)return
      if((e.target as Element|null)?.closest?.('input,textarea,select') || useStore.getState().arriving)return
      if(e.code==='KeyO'||e.key?.toLowerCase()==='o'){e.preventDefault();openDevice(useStore.getState().electronics==='room'?null:'room')}
      const s=useStore.getState()
      if(e.code==='KeyE'&&!e.repeat&&aimed.current&&!s.electronics&&!s.menuOpen&&!s.playingGame&&!s.heldMedia) {
        e.stopImmediatePropagation()
        if(aimed.current==='switch')s.setLightLevel(s.lightLevel>0?0:0.45)
        else openDevice(aimed.current as 'room'|'computer'|'cassette')
      }
    };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)
  },[])
  useFrame(()=>{
    const objects:[string,Vector3][]=[['switch',new Vector3(1.18,1.23,-4.93)],['room',new Vector3(1.43,1.23,-4.93)],['computer',new Vector3(4.45,0.99,3.8)],['cassette',new Vector3(2.3,0.15,-4.65)]]
    const dir=camera.getWorldDirection(new Vector3());let best=0.97;aimed.current=null
    objects.forEach(([name,pos])=>{const to=pos.sub(camera.position),distance=to.length(),dot=dir.dot(to.normalize());if(distance<2.1&&dot>best){best=dot;aimed.current=name}})
    useStore.getState().setHint('house',aimed.current?`E  ${aimed.current==='switch'?'toggle wall switch':`use ${aimed.current==='room'?'room settings':aimed.current}`}`:null)
  })
  const cable=useMemo(()=>new CatmullRomCurve3([new Vector3(0,0.7,-1.9),new Vector3(0.15,0.08,-2.02),new Vector3(0.5,0.025,-2.8),new Vector3(0.7,0.22,-4.95)]),[])
  return <>
    <RainGlass x={1.9} /><RainGlass x={3.65} />
    <WallSwitch /><WallClock /><DigitalClock />
    <Outlet position={[0.7,0.25,-4.94]} /><Outlet position={[4.94,0.25,3.8]} rotation={-Math.PI/2} /><Outlet position={[-4.94,0.25,-4.2]} rotation={Math.PI/2} />
    <mesh><tubeGeometry args={[cable,32,0.004,6,false]} /><meshStandardMaterial color="#36332e" roughness={0.8} /></mesh>
  </>
}
