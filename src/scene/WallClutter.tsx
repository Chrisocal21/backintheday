import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { FurnitureBox } from './Furniture'
import { Poster } from './PosterArt'

function CassetteRack() {
  return <group position={[4.87,1.42,0.15]} rotation={[0,-Math.PI/2,0]}>
    <FurnitureBox size={[1.1,0.74,0.045]} color="#66462d" />
    {[-0.55,0.55].map(x=><FurnitureBox key={x} size={[0.035,0.79,0.15]} position={[x,0,0.06]} color="#936c43" />)}
    {[-0.38,-0.12,0.14,0.38].map(y=><FurnitureBox key={y} size={[1.12,0.025,0.15]} position={[0,y,0.06]} color="#9c744b" />)}
    {Array.from({length:21},(_,i)=><group key={i} position={[-0.45+(i%7)*0.15,-0.25+Math.floor(i/7)*0.25,0.07]}>
      <FurnitureBox size={[0.13,0.19,0.035]} color={['#8d5c50','#b4a276','#6c7d77','#77718a','#566576'][i%5]} finish="plastic" radius={0.003} />
      <FurnitureBox size={[0.105,0.06,0.002]} position={[0,0.03,0.019]} color="#d3c8a8" finish="plastic" radius={0.001} />
      {[-0.026,0.026].map(x=><mesh key={x} position={[x,-0.025,0.02]}><ringGeometry args={[0.012,0.016,16]} /><meshStandardMaterial color="#38372e" roughness={0.8} /></mesh>)}
    </group>)}
  </group>
}

function MemoryBoard() {
  const map=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512
    const c=canvas.getContext('2d')!
    c.fillStyle='#92734e';c.fillRect(0,0,768,512)
    for(let i=0;i<10000;i++){c.fillStyle=i%2?'#d1ae7d22':'#44322622';c.fillRect((i*73)%768,(i*113)%512,2,2)}
    const notes=[['MOVIE NIGHT','FRIDAY · BRING SNACKS'],['SUMMER 1998','LAKE WEEKEND'],['HIGH SCORE','ONE MORE TRY'],['BACK AT 10','SAVE ME A SEAT']]
    notes.forEach(([title,subtitle],i)=>{
      c.save();c.translate(35+(i%2)*360,32+Math.floor(i/2)*238);c.rotate((i%2?1:-1)*0.035)
      c.fillStyle='#241a1444';c.fillRect(5,5,315,204);c.fillStyle='#e6dac0';c.fillRect(0,0,315,204)
      c.fillStyle=['#4e686c','#8e7151','#596b51','#706878'][i];c.fillRect(12,12,291,120)
      c.fillStyle='#c4b284';c.beginPath();c.arc(240,42,16,0,Math.PI*2);c.fill()
      c.fillStyle='#293d3c';c.beginPath();c.moveTo(12,132);c.lineTo(92,45);c.lineTo(165,118);c.lineTo(210,76);c.lineTo(303,132);c.fill()
      c.fillStyle='#554331';c.font='bold 18px monospace';c.fillText(title,16,159);c.font='12px monospace';c.fillText(subtitle,16,184)
      c.fillStyle='#9c473c';c.beginPath();c.arc(158,5,5,0,Math.PI*2);c.fill();c.restore()
    })
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture
  },[])
  return <group position={[0,1.72,4.94]} rotation={[0,Math.PI,0]}>
    <FurnitureBox size={[1.64,1.1,0.035]} color="#745034" radius={0.008} />
    <mesh position={[0,0,0.02]}><planeGeometry args={[1.56,1.02]} /><meshStandardMaterial map={map} roughness={1} /></mesh>
  </group>
}

function DisplayShelf({position,rotation=0}:{position:[number,number,number];rotation?:number}) {
  return <group position={position} rotation={[0,rotation,0]}>
    <FurnitureBox size={[1.18,0.035,0.18]} color="#9b744a" />
    {[-0.4,0.4].map(x=><FurnitureBox key={x} size={[0.025,0.16,0.1]} position={[x,-0.08,-0.025]} color="#65513a" />)}
    {['#8f6155','#6d7c64','#b39a6a','#5b7183','#79607d','#9b7758'].map((c,i)=><group key={i} position={[-0.44+i*0.095,0.14,0]} rotation={[0,0,i>3?-0.08:0]}>
      <FurnitureBox size={[0.06,0.25+(i%2)*0.03,0.13]} color={c} finish="plastic" radius={0.003} />
      <FurnitureBox size={[0.044,0.008,0.002]} position={[0,0.07,0.067]} color="#d7c6a3" finish="plastic" radius={0.0005} />
    </group>)}
    <group position={[0.36,0.16,0]} rotation={[0,0,-0.06]}>
      <FurnitureBox size={[0.23,0.27,0.025]} color="#5f4631" />
      <FurnitureBox size={[0.19,0.23,0.004]} position={[0,0,0.016]} color="#b1a17b" finish="plastic" />
      <mesh position={[0,0,0.019]}><circleGeometry args={[0.06,24]} /><meshStandardMaterial color="#6b7a71" roughness={1} /></mesh>
    </group>
  </group>
}

export function WallClutter() {
  return <>
    <CassetteRack />
    <MemoryBoard />
    <DisplayShelf position={[-4.87,1.8,0.48]} rotation={Math.PI/2} />
    <DisplayShelf position={[1.65,1.26,4.87]} rotation={Math.PI} />
    <Poster position={[-4.96,1.65,-4.15]} rotation={Math.PI/2} tilt={0.025} title="SUNDAY SESSIONS" bg="#3d4a3b" fg="#d9bf82" shape="circle" size={[0.42,0.59]} />
    <Poster position={[-3.7,1.85,-4.96]} tilt={-0.025} title="GOLDEN HOUR" bg="#aa7147" fg="#ead5a2" shape="circle" size={[0.65,0.8]} />
    <Poster position={[-4.96,1.25,-0.85]} rotation={Math.PI/2} tilt={-0.03} title="LOCAL HEROES" bg="#62483c" fg="#d9c5a1" shape="stripes" size={[0.45,0.58]} />
    <Poster position={[4.96,1.3,-1.4]} rotation={-Math.PI/2} tilt={0.02} title="LASER LEAGUE" bg="#1b273c" fg="#b5a4d8" shape="grid" size={[0.42,0.6]} />
    <Poster position={[4.96,2.12,0.1]} rotation={-Math.PI/2} tilt={-0.02} title="MIXTAPE CLUB" bg="#66434c" fg="#dec295" shape="stripes" size={[0.82,0.42]} />
    <Poster position={[-4.96,1.83,3.65]} rotation={Math.PI/2} tilt={0.025} title="SATURDAY STATIC" bg="#364e65" fg="#d5ad74" shape="star" size={[0.55,0.74]} />
    <Poster position={[-1.8,1.55,4.96]} rotation={Math.PI} tilt={0.035} title="MIDNIGHT MIX" bg="#625173" fg="#d0be8e" shape="grid" size={[0.55,0.75]} />
    <Poster position={[-4.1,1.18,4.96]} rotation={Math.PI} tilt={-0.025} title="AFTER SCHOOL" bg="#9c6551" fg="#e1ce9e" shape="stripes" size={[0.52,0.58]} />
    <Poster position={[4.15,1.6,4.96]} rotation={Math.PI} tilt={-0.02} title="BURNED CD VOL. 1" bg="#506e74" fg="#d7caa5" shape="circle" size={[0.45,0.6]} />
    <Poster position={[1.7,2.04,4.96]} rotation={Math.PI} tilt={0.015} title="SUMMER OFFLINE" bg="#696a48" fg="#e2c99c" shape="star" size={[0.62,0.65]} />
  </>
}
