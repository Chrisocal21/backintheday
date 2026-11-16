import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { usePreferences } from '../preferences'

type PosterProps = {position:[number,number,number]; rotation?:number; tilt?:number; title?:string; bg:string; fg:string; shape:'circle'|'grid'|'stripes'|'star'; size?:[number,number]}
export function Poster({position,rotation=0,tilt=0,title:customTitle,bg,fg,shape,size=[0.6,0.85]}:PosterProps) {
  const style=usePreferences(s=>s.posterStyle)
  if(style==='warm'){bg='#624536';fg='#debe8d'}
  else if(style==='neon'){bg='#25213c';fg=shape==='grid'?'#d795c1':'#9fc7bc'}
  const map = useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.round(512*size[1]/size[0])
    const c=canvas.getContext('2d')!,w=canvas.width,h=canvas.height
    c.fillStyle=bg;c.fillRect(0,0,w,h)
    c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(22,22,w-44,h-44)
    c.save();c.beginPath();c.rect(35,100,w-70,h-230);c.clip()
    c.fillStyle=fg
    if(shape==='grid') {
      const glow=c.createLinearGradient(0,h*0.2,0,h*0.58);glow.addColorStop(0,'#edc07c');glow.addColorStop(1,'#ad5963')
      c.fillStyle=glow;c.beginPath();c.arc(w/2,h*0.42,w*0.2,Math.PI,0);c.fill()
      c.strokeStyle=fg;c.lineWidth=2
      for(let i=0;i<13;i++){c.beginPath();c.moveTo(w/2,h*0.46);c.lineTo((i-6)*160+w/2,h*0.85);c.stroke()}
      for(let i=0;i<8;i++){const y=h*0.49+i*i*3;c.beginPath();c.moveTo(35,y);c.lineTo(w-35,y);c.stroke()}
    } else if(shape==='circle') {
      c.globalAlpha=0.9;c.beginPath();c.arc(w/2,h*0.42,w*0.25,0,Math.PI*2);c.fill()
      c.fillStyle=bg
      for(let i=0;i<7;i++){c.fillRect(50,h*0.45+i*18,w-100,5+i*2)}
      c.strokeStyle=fg;c.lineWidth=4;c.beginPath();c.arc(w/2,h*0.42,w*0.31,0,Math.PI*2);c.stroke()
    } else if(shape==='star') {
      c.strokeStyle=fg;c.lineWidth=3
      for(let i=0;i<4;i++){c.beginPath();c.ellipse(w/2,h*0.43,170-i*27,60+i*13,-0.55,0,Math.PI*2);c.stroke()}
      c.beginPath();c.arc(w/2,h*0.43,42,0,Math.PI*2);c.fill()
      for(let i=0;i<28;i++){c.globalAlpha=0.4+(i%3)*0.2;c.fillRect(50+(i*97)%410,110+(i*73)%Math.max(1,h-360),2+i%3,2+i%3)}
    } else {
      c.translate(w/2,h*0.4);c.rotate(-0.22)
      for(let i=0;i<7;i++){c.globalAlpha=0.35+i*0.09;c.fillRect(-160,-135+i*38,320,20)}
    }
    c.restore();c.globalAlpha=1;c.fillStyle=fg;c.textAlign='center'
    c.font='bold 15px monospace';c.fillText('BASEMENT PRINT SERIES',w/2,62)
    const title=customTitle ?? {grid:'NIGHT DRIVE',circle:'SUNSET SOCIAL',star:'ORBIT CLUB',stripes:'SIDE A / SIDE B'}[shape]
    c.font='bold 43px sans-serif';c.fillText(title,w/2,h-105,440)
    c.font='14px monospace';c.fillText('AFTER HOURS · ALL WELCOME',w/2,h-68)
    // Restrained paper grain, printed once rather than animated screen noise.
    for(let i=0;i<6500;i++){c.fillStyle=i%2?'#ffffff09':'#0000000a';c.fillRect((i*97)%w,(i*193)%h,1,1)}
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture
  },[bg,fg,shape,customTitle,size[0],size[1]])
  return <group position={position} rotation={[0,rotation,tilt]}>
    <mesh receiveShadow><boxGeometry args={[size[0],size[1],0.005]} /><meshStandardMaterial color="#a8997c" roughness={1} /></mesh>
    <mesh position={[0,0,0.003]}><planeGeometry args={size} /><meshStandardMaterial map={map} roughness={0.93} /></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*size[0]*0.33,size[1]*0.47,0.005]} rotation={[0,0,s*0.15]}><planeGeometry args={[0.075,0.027]} /><meshStandardMaterial color="#bcae87" transparent opacity={0.58} roughness={1} depthWrite={false} /></mesh>)}
  </group>
}
