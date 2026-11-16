import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CanvasTexture, Group, Mesh, SRGBColorSpace, Vector3 } from 'three'
import { FILMS, GAMES } from '../library'
import { openDevice, useStore } from '../store'
import { usePreferences } from '../preferences'
import { FurnitureBox } from './Furniture'

const VCR = new Vector3(0,0.19,-1.32),CONSOLE=new Vector3(-0.65,0.61,-1.6)
type Held=NonNullable<ReturnType<typeof useStore.getState>['heldMedia']>
export function MediaRitual() {
  const {camera}=useThree(),carried=useRef<Group>(null),inserting=useRef<{media:Held;from:Vector3;t:number}|null>(null)
  const held=useStore(s=>s.heldMedia),insertedTape=useStore(s=>s.insertedTape),insertedGame=useStore(s=>s.insertedCartridge)
  const power=usePreferences(s=>s.consolePower)
  const target=useRef<'tape'|'cartridge'|null>(null)
  const insert=()=>{
    const s=useStore.getState()
    if(inserting.current)return
    if(!s.heldMedia){openDevice('media');return}
    const desired=s.heldMedia.kind
    if(desired==='cartridge'&&!usePreferences.getState().consolePower){openDevice('media');return}
    const from=new Vector3(0.25,-0.2,-0.6).applyQuaternion(camera.quaternion).add(camera.position)
    inserting.current={media:s.heldMedia,from,t:0}
  }
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      const s=useStore.getState()
      if(e.code!=='KeyE'||e.repeat||!target.current||s.arriving||s.playingGame||s.menuOpen||s.electronics)return
      if(s.heldMedia&&s.heldMedia.kind!==target.current)return
      e.stopImmediatePropagation();insert()
    };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)
  },[camera])
  useFrame((_,dt)=>{
    const s=useStore.getState(),dir=camera.getWorldDirection(new Vector3())
    target.current=null
    for(const [kind,pos] of [['tape',VCR],['cartridge',CONSOLE]] as const) {
      const to=pos.clone().sub(camera.position)
      if(to.length()<2.1&&dir.dot(to.normalize())>0.96)target.current=kind
    }
    s.setHint('media',target.current?`E  ${s.heldMedia ? `insert ${s.heldMedia.kind}` : target.current==='tape'?'use VCR':'use console'}`:null)
    if(!carried.current)return
    const a=inserting.current
    if(a) {
      a.t+=dt;const t=usePreferences.getState().reducedMotion?1:Math.min(1,a.t/0.7),pos=a.media.kind==='tape'?VCR:CONSOLE
      carried.current.position.lerpVectors(a.from,pos,t);carried.current.rotation.set(0,0,0)
      if(t===1) {
        inserting.current=null;useStore.setState({heldMedia:null,mediaPaused:false})
        if(a.media.kind==='tape'){useStore.setState({insertedTape:a.media.id});usePreferences.getState().change('tvPower',true);s.playFilm(a.media.id)}
        else {const game=GAMES.find(g=>g.id===a.media.id);if(game){useStore.setState({insertedCartridge:game.id});usePreferences.getState().change('tvPower',true);s.playGame(game.id)}}
      }
    }else if(s.heldMedia) {
      carried.current.position.set(0.25,-0.2,-0.6).applyQuaternion(camera.quaternion).add(camera.position);carried.current.quaternion.copy(camera.quaternion)
    }
  })
  const label=useMemo(()=>{
    const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d')!;g.fillStyle='#d0c19c';g.fillRect(0,0,512,128);g.fillStyle='#3e342b';g.font='bold 28px monospace';g.textAlign='center';g.fillText((held?.title??'').slice(0,28),256,72,490);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t
  },[held?.title])
  return <>
    {/* The VCR lives in the existing cabinet bay. */}
    <group onClick={e=>{e.stopPropagation();held?.kind==='tape'?insert():openDevice('media')}}>
      <FurnitureBox size={[0.23,0.01,0.012]} position={[0,0.19,-1.366]} color="#080d10" finish="plastic" radius={0.002} />
      <mesh position={[0.22,0.19,-1.36]}><sphereGeometry args={[0.004,8,8]} /><meshBasicMaterial color={insertedTape?'#9cba77':'#383c31'} /></mesh>
    </group>
    <group position={[-0.65,0.545,-1.6]} onClick={e=>{e.stopPropagation();held?.kind==='cartridge'?insert():openDevice('media')}}>
      <FurnitureBox size={[0.35,0.08,0.26]} color="#b4afa0" finish="plastic" radius={0.012} />
      <FurnitureBox size={[0.16,0.009,0.025]} position={[0,0.043,0]} color="#353735" finish="plastic" radius={0.002} />
      <mesh position={[0.13,0,0.132]}><sphereGeometry args={[0.004,8,8]} /><meshBasicMaterial color={power?'#c6a178':'#3c3329'} /></mesh>
      {insertedGame&&<FurnitureBox size={[0.16,0.075,0.025]} position={[0,0.067,0]} color="#77776a" finish="plastic" radius={0.004} />}
    </group>
    <group position={[0.65,0.51,-1.61]} onClick={e=>{e.stopPropagation();openDevice('media')}}>
      {FILMS.map((f,i)=><group key={f.id} position={[-0.1+i*0.04,0.12,0]} onClick={e=>{e.stopPropagation();useStore.getState().pickMedia('tape',f.id,f.title)}}>
        <FurnitureBox size={[0.034,0.24,0.14]} color={['#6b7568','#ad9770','#725f70'][i%3]} finish="plastic" radius={0.003} />
        <FurnitureBox size={[0.025,0.15,0.002]} position={[0,0.02,0.072]} color="#c9b994" finish="plastic" radius={0.001} />
      </group>)}
    </group>
    <group position={[0.12,0.16,0.06]}>
      {GAMES.map((game,i)=><group key={game.id} position={[i*0.18,0.052,0]} onClick={e=>{e.stopPropagation();useStore.getState().pickMedia('cartridge',game.id,game.title)}}>
        <FurnitureBox size={[0.14,0.1,0.028]} color={i?'#6c6e58':'#7d776e'} finish="plastic" radius={0.004} />
        <FurnitureBox size={[0.1,0.04,0.002]} position={[0,0.012,0.016]} color={i?'#c1b276':'#b79473'} finish="plastic" radius={0.001} />
      </group>)}
    </group>
    {held&&<group ref={carried}>
      <FurnitureBox size={held.kind==='tape'?[0.24,0.13,0.035]:[0.16,0.15,0.035]} color="#57594f" finish="plastic" radius={0.006} />
      <mesh position={[0,0,0.019]}><planeGeometry args={[held.kind==='tape'?0.21:0.14,0.055]} /><meshStandardMaterial map={label} roughness={1} /></mesh>
    </group>}
  </>
}
