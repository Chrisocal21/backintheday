import { useEffect, useRef } from 'react'
import { LISTENING,type ListeningKind } from './catalog'
import { useListening } from './state'
import { usePreferences } from '../preferences'

const players:Partial<Record<ListeningKind,HTMLAudioElement>>={}
let distance=1
export function setListeningDistance(value:number) {
  distance=value;const p=usePreferences.getState();if(players.record)players.record.volume=Math.max(0,Math.min(1,p.master*p.musicVolume*distance))
}
export function seekListening(kind:ListeningKind,time:number) {
  const audio=players[kind];if(audio&&Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(audio.duration,time))
}
function Player({kind}:{kind:ListeningKind}) {
  const ref=useRef<HTMLAudioElement>(null),id=useListening(s=>s[kind]?.id),playing=useListening(s=>s[kind]?.playing)
  const request=useListening(s=>s[kind]?.request)
  const master=usePreferences(s=>s.master),level=usePreferences(s=>kind==='tape'?s.cassetteVolume:s.musicVolume)
  const track=LISTENING.find(t=>t.id===id)
  useEffect(()=>{if(ref.current)players[kind]=ref.current;return()=>{delete players[kind]}},[kind])
  useEffect(()=>{if(ref.current)ref.current.volume=Math.max(0,Math.min(1,master*level*(kind==='record'?distance:1)))},[master,level,kind,id])
  useEffect(()=>{
    if(ref.current&&track)ref.current.currentTime=0
  },[id,request])
  useEffect(()=>{
    const element=ref.current;if(!element)return
    if(!track){element.pause();element.removeAttribute('src');element.load();return}
    if(playing)element.play().catch((error)=>{if(useListening.getState()[kind]?.id===id&&error?.name!=='AbortError')useListening.getState().update(kind,{playing:false,error:'Playback was blocked or the stream is unavailable. Press Play to retry.'})})
    else element.pause()
  },[id,playing,request,kind])
  return <audio ref={ref} src={track?.url} preload="metadata" onLoadedMetadata={()=>{const d=ref.current?.duration;if(d&&Number.isFinite(d))useListening.getState().update(kind,{duration:d})}} onTimeUpdate={()=>useListening.getState().update(kind,{time:ref.current?.currentTime??0})} onEnded={()=>useListening.getState().next(kind,1,true)} onError={()=>{if(id)useListening.getState().update(kind,{playing:false,error:'This source could not be loaded. Try another title or open its source link.'})}} />
}
export function ListeningPlayback(){return <><Player kind="record" /><Player kind="tape" /><Player kind="ipod" /></>}
