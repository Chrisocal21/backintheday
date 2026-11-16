import { useEffect,useRef,useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
import { CHANNELS } from '../channels'
import { FILMS } from '../library'
import { youtubeAPI,type YouTubePlayer } from '../youtube'
import { getPlaybackHost,openMediaHub,useMediaHub,watchView,type WatchView } from './state'
import './media.css'

let video:HTMLVideoElement|null=null,yt:YouTubePlayer|null=null
export function seekTV(time:number){if(video&&Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration,time));else yt?.seekTo?.(Math.max(0,time),true)}
export function currentProgram(){const s=useStore.getState(),film=FILMS.find(f=>f.id===s.filmId),channel=CHANNELS[s.channel];return s.watchItem?.title??film?.title??(channel?`${channel.era} music channel`:'Your video')}
export function PlaybackMount({mode}:{mode:WatchView}){
  const view=useMediaHub(s=>s.view),ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(view===mode&&ref.current)ref.current.appendChild(getPlaybackHost())},[view,mode])
  return <div ref={ref} className="playback-mount" />
}
export function TVPlayback(){
  const {watchItem,filmId,channel,customId,input,noSignal}=useStore(),power=usePreferences(s=>s.tvPower)
  const film=FILMS.find(f=>f.id===filmId),ch=CHANNELS[channel]
  const id=watchItem?.playback==='youtube'?watchItem.url:ch?.videos[Math.floor(Date.now()/600000)%ch.videos.length]??customId
  const url=watchItem?.playback==='video'?watchItem.url:film?.url
  const source=watchItem?.source??film?.source??(id?'https://www.youtube.com/watch?v='+id:'')
  const fail=()=>useStore.getState().setNoSignal(true)
  return createPortal(<div className="tv-playback">
    {!power?<div className="tv-empty">TV OFF</div>:input==='game'?<div className="tv-empty">GAME INPUT<br/>Return to the room to play.</div>:noSignal?<div className="tv-empty"><b>NO SIGNAL</b><p>The publisher may be offline, restricted in your region, or unavailable in this player.</p><button onClick={()=>useStore.getState().setNoSignal(false)}>Try again</button>{source&&<a href={source} target="_blank" rel="noreferrer">Open official source</a>}<button onClick={openMediaHub}>Choose something else</button></div>:url?<WebVideo key={url} url={url} onError={fail}/>:id?<YouTubeVideo key={id} id={id} live={watchItem?.kind==='live'} onError={fail}/>:<div className="tv-empty"><b>READY WHEN YOU ARE</b><button onClick={openMediaHub}>Open the program guide</button></div>}
  </div>,getPlaybackHost())
}
function WebVideo({url,onError}:{url:string;onError:()=>void}){
  const ref=useRef<HTMLVideoElement>(null),[blocked,setBlocked]=useState(false),volume=usePreferences(s=>s.tvVolume*s.master),paused=useStore(s=>s.mediaPaused)
  useEffect(()=>{video=ref.current;return()=>{video=null}},[])
  useEffect(()=>{if(ref.current)ref.current.volume=volume},[volume])
  useEffect(()=>{const element=ref.current;if(!element)return;if(paused)element.pause();else element.play().then(()=>setBlocked(false)).catch(error=>{if(error.name!=='AbortError')setBlocked(true)})},[paused])
  return <><video ref={ref} src={url} playsInline controls onError={onError} onPause={()=>useStore.setState({mediaPaused:true})} onPlay={()=>useStore.setState({mediaPaused:false})} onTimeUpdate={()=>useMediaHub.setState({time:ref.current?.currentTime??0})} onLoadedMetadata={()=>useMediaHub.setState({duration:Number.isFinite(ref.current?.duration)?ref.current!.duration:0})} onEnded={()=>useStore.setState({mediaPaused:true})}/>{blocked&&<button className="play-unblock" onClick={()=>ref.current?.play().then(()=>setBlocked(false)).catch(()=>onError())}>Press to play</button>}</>
}
function YouTubeVideo({id,live,onError}:{id:string;live?:boolean;onError:()=>void}){
  const host=useRef<HTMLDivElement>(null),player=useRef<YouTubePlayer|null>(null),error=useRef(onError),[blocked,setBlocked]=useState(false)
  error.current=onError
  const volume=usePreferences(s=>s.tvVolume*s.master),paused=useStore(s=>s.mediaPaused)
  useEffect(()=>{
    let cancelled=false,timer:ReturnType<typeof setInterval>|undefined
    const element=document.createElement('div');host.current?.append(element)
    youtubeAPI().then(api=>{
      if(cancelled)return
      player.current=new api.Player(element,{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{autoplay:1,controls:1,rel:0,playsinline:1,origin:location.origin},events:{onReady:({target})=>{yt=target;const p=usePreferences.getState();target.setVolume(p.master*p.tvVolume*100);if(useStore.getState().mediaPaused)target.pauseVideo();else target.playVideo();timer=setInterval(()=>{try{useMediaHub.setState({time:target.getCurrentTime?.()??0,duration:live?0:target.getDuration?.()??0})}catch{}},1000)},onStateChange:e=>{if(e.data===1)useStore.setState({mediaPaused:false});if(e.data===2||e.data===0)useStore.setState({mediaPaused:true})},onError:()=>error.current(),onAutoplayBlocked:()=>setBlocked(true)}})
    }).catch(()=>{if(!cancelled)error.current()})
    return()=>{cancelled=true;clearInterval(timer);if(yt===player.current)yt=null;player.current?.destroy();player.current=null;element.remove()}
  },[id,live])
  useEffect(()=>{try{player.current?.setVolume(volume*100);if(paused)player.current?.pauseVideo();else player.current?.playVideo()}catch{}},[volume,paused])
  return <><div className="official-youtube-player" ref={host}/>{blocked&&<button className="play-unblock" onClick={()=>{player.current?.playVideo();setBlocked(false)}}>Press to play</button>}</>
}
export function WatchControls(){
  const view=useMediaHub(s=>s.view)
  const fullscreen=async()=>{watchView('screen');try{await document.querySelector<HTMLElement>('.watch-theater')?.requestFullscreen()}catch{useMediaHub.setState({notice:'Screen view is ready. Browser fullscreen was unavailable.'})}}
  return <div className="watch-views" aria-label="Screen view">{(['room','lounge','screen'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>watchView(v)}>{v==='room'?'Room':v==='lounge'?'TV close-up':'Screen only'}</button>)}<button onClick={fullscreen}>Fullscreen</button></div>
}
export function WatchTheater(){
  const view=useMediaHub(s=>s.view),notice=useMediaHub(s=>s.notice),open=useMediaHub(s=>s.open),paused=useStore(s=>s.mediaPaused),p=usePreferences()
  useEffect(()=>{
    if(view==='room')return
    const key=(event:KeyboardEvent)=>{if(open||(event.target as Element|null)?.closest?.('input,textarea,select'))return;if(event.code==='Escape'){event.stopImmediatePropagation();watchView('room')}if(event.code==='Space'&&!(event.target as Element|null)?.closest?.('button')){event.preventDefault();useStore.setState({mediaPaused:!useStore.getState().mediaPaused})}}
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)
  },[view,open])
  // Keep the fullscreen request target mounted while changing views.
  return <section className={`watch-theater watch-${view}`} aria-label="TV viewing area" hidden={view==='room'}>
    <header className="watch-toolbar"><b>{currentProgram()}</b><WatchControls/><button onClick={openMediaHub}>Program guide</button></header>
    <div className="watch-tv-frame"><PlaybackMount mode={view==='room'?'lounge':view}/>{view==='lounge'&&<div className="watch-tv-trim"><span>BASEMENT VISION</span><i/><i/><small>STEREO</small></div>}</div>
    <footer className="watch-footer"><button onClick={()=>useStore.setState({mediaPaused:!paused})}>{paused?'Play':'Pause'}</button><label>Volume<input aria-label="TV volume" type="range" min="0" max="1" step="0.01" value={p.tvVolume} onChange={e=>p.change('tvVolume',Number(e.target.value))}/></label><span>{notice||'Space: play / pause · Esc: back to room'}</span><button onClick={()=>watchView('room')}>Back to room</button></footer>
  </section>
}
