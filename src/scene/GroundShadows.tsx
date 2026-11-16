import { useMemo } from 'react'
import { CanvasTexture } from 'three'

// Soft, static contact shading supplements the room's dynamic shadow map.
export function GroundShadows() {
  const map=useMemo(()=>{
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!,gradient=g.createRadialGradient(64,64,12,64,64,64)
    gradient.addColorStop(0,'rgba(0,0,0,0.75)');gradient.addColorStop(0.6,'rgba(0,0,0,0.3)');gradient.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);return new CanvasTexture(c)
  },[])
  const shades=[
    {x:0,z:2.1,y:0.028,w:2.65,h:1.15},{x:0,z:0,y:0.027,w:1.3,h:0.8},{x:0,z:-1.6,y:0.002,w:2,h:0.85},
    {x:-4.05,z:-1.75,y:0.027,w:1.25,h:1.25},{x:-3.6,z:-4.72,y:0.002,w:1.4,h:0.7},{x:3.8,z:3.8,y:0.027,w:0.65,h:0.65},
  ]
  return <>{shades.map((s,i)=><mesh key={i} position={[s.x,s.y,s.z]} rotation={[-Math.PI/2,0,0]} renderOrder={1}><planeGeometry args={[s.w,s.h]} /><meshBasicMaterial map={map} transparent opacity={0.3} depthWrite={false} /></mesh>)}</>
}
