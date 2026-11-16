import { useEffect,useRef,useState } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
import { CHANNELS } from '../channels'
import { FILMS } from '../library'
import { youtubeAPI,type YouTubePlayer } from '../youtube'
import { getPlaybackHost,nextOnCable,openMediaHub,useMediaHub,watchView,type WatchView } from './state'
import './media.css'
import { ChannelOSD } from './TVRemote'
import { leaveFullscreen, makePush, tryFullscreen, wheelAmount } from '../takeover'

let video:HTMLVideoElement|null=null,yt:YouTubePlayer|null=null
const ytResume={id:'',time:0} // where the YouTube picture was, so a view change picks up from there
const useMoves=create<{n:number}>(()=>({n:0})) // counts real moves of the picture between TVs
export function seekTV(time:number){if(video&&Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration,time));else yt?.seekTo?.(Math.max(0,time),true)}
export function currentProgram(){const s=useStore.getState(),film=FILMS.find(f=>f.id===s.filmId),channel=CHANNELS[s.channel];return s.watchItem?.title??film?.title??(channel?`${channel.era} music channel`:'Your video')}
export function PlaybackMount({mode}:{mode:WatchView}){
  const view=useMediaHub(s=>s.view),ref=useRef<HTMLDivElement>(null)
  // Moving the picture between the room TV and the close-up must not restart it:
  // a <video> keeps its time but pauses when moved, so resume it; YouTube re-creates at the saved time.
  useEffect(()=>{if(view===mode&&ref.current&&getPlaybackHost().parentElement!==ref.current){ref.current.appendChild(getPlaybackHost());useMoves.setState(s=>({n:s.n+1}));if(video&&!useStore.getState().mediaPaused)video.play().catch(()=>{})}},[view,mode])
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
    <ChannelOSD/>
    {!power?<div className="tv-empty">TV OFF</div>:input==='game'?<div className="tv-empty">GAME INPUT<br/>Return to the room to play.</div>:noSignal?<div className="tv-empty"><b>NO SIGNAL</b><p>The publisher may be offline, restricted in your region, or unavailable in this player.</p><button onClick={()=>useStore.getState().setNoSignal(false)}>Try again</button>{source&&<a href={source} target="_blank" rel="noreferrer">Open official source</a>}<button onClick={openMediaHub}>Choose something else</button></div>:watchItem?.playback==='iframe'?<iframe key={watchItem.url} className="official-youtube-player" src={watchItem.url} title={watchItem.title} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen/>:url?<WebVideo key={url} url={url} onError={fail}/>:id?<YouTubeVideo key={id} id={id} live={watchItem?.kind==='live'} onError={fail}/>:<div className="tv-empty"><b>READY WHEN YOU ARE</b><button onClick={openMediaHub}>Open the program guide</button></div>}
  </div>,getPlaybackHost())
}
function WebVideo({url,onError}:{url:string;onError:()=>void}){
  const ref=useRef<HTMLVideoElement>(null),[blocked,setBlocked]=useState(false),volume=usePreferences(s=>s.tvVolume*s.master),paused=useStore(s=>s.mediaPaused)
  useEffect(()=>{video=ref.current;return()=>{video=null}},[])
  // HLS live streams (.m3u8): native in Safari, hls.js everywhere else.
  useEffect(()=>{
    const el=ref.current;if(!el||!/\.m3u8(\?|$)/i.test(url)||el.canPlayType('application/vnd.apple.mpegurl'))return
    let hls:{destroy:()=>void}|undefined
    import('hls.js').then(({default:Hls})=>{if(!Hls.isSupported()){onError();return}const h=new Hls();h.loadSource(url);h.attachMedia(el);h.on(Hls.Events.ERROR,(_e,d)=>{if(d.fatal)onError()});hls=h}).catch(onError)
    return()=>hls?.destroy()
  },[url])
  useEffect(()=>{if(ref.current)ref.current.volume=volume},[volume])
  useEffect(()=>{const element=ref.current;if(!element)return;if(paused)element.pause();else element.play().then(()=>setBlocked(false)).catch(error=>{if(error.name!=='AbortError')setBlocked(true)})},[paused])
  return <><video ref={ref} src={/\.m3u8(\?|$)/i.test(url)&&!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')?undefined:url} playsInline autoPlay onError={onError} onPause={()=>useStore.setState({mediaPaused:true})} onPlay={()=>useStore.setState({mediaPaused:false})} onTimeUpdate={()=>useMediaHub.setState({time:ref.current?.currentTime??0})} onLoadedMetadata={()=>{const el=ref.current!,d=Number.isFinite(el.duration)?el.duration:0;useMediaHub.setState({duration:d});const at=useStore.getState().watchItem?.startAt;if(at&&d)el.currentTime=at%Math.max(d-5,1)}} onEnded={()=>{if(useStore.getState().watchItem?.cable)nextOnCable();else useStore.setState({mediaPaused:true})}}/>{blocked&&<button className="play-unblock" onClick={()=>ref.current?.play().then(()=>setBlocked(false)).catch(()=>onError())}>Press to play</button>}</>
}
function YouTubeVideo({id,live,onError}:{id:string;live?:boolean;onError:()=>void}){
  const host=useRef<HTMLDivElement>(null),player=useRef<YouTubePlayer|null>(null),error=useRef(onError),[blocked,setBlocked]=useState(false)
  error.current=onError
  const volume=usePreferences(s=>s.tvVolume*s.master),paused=useStore(s=>s.mediaPaused),view=useMoves(s=>s.n)
  useEffect(()=>{
    let cancelled=false,timer:ReturnType<typeof setInterval>|undefined
    const start=ytResume.id===id?ytResume.time:(useStore.getState().watchItem?.startAt??0)
    const element=document.createElement('div');host.current?.append(element)
    youtubeAPI().then(api=>{
      if(cancelled)return
      player.current=new api.Player(element,{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{autoplay:1,start:live?0:Math.floor(start),controls:0,disablekb:1,iv_load_policy:3,rel:0,playsinline:1,origin:location.origin},events:{onReady:({target})=>{yt=target;const p=usePreferences.getState();target.setVolume(p.master*p.tvVolume*100);if(useStore.getState().mediaPaused)target.pauseVideo();else target.playVideo();timer=setInterval(()=>{try{const t=target.getCurrentTime?.()??0;if(t>0){ytResume.id=id;ytResume.time=t}useMediaHub.setState({time:t,duration:live?0:target.getDuration?.()??0})}catch{}},500)},onStateChange:e=>{if(e.data===1)useStore.setState({mediaPaused:false});if(e.data===0&&useStore.getState().watchItem?.cable){nextOnCable();return}if(e.data===2||e.data===0)useStore.setState({mediaPaused:true})},onError:()=>error.current(),onAutoplayBlocked:()=>setBlocked(true)}})
    }).catch(()=>{if(!cancelled)error.current()})
    return()=>{cancelled=true;clearInterval(timer);if(yt===player.current)yt=null;player.current?.destroy();player.current=null;element.remove()}
  },[id,live,view])
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
    const key=(event:KeyboardEvent)=>{if(open||(event.target as Element|null)?.closest?.('input,textarea,select'))return;if(event.code==='Escape'){event.stopImmediatePropagation();leaveFullscreen();watchView('room')}}
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)
  },[view,open])
  // Scroll wheel: in → full screen; out → step back (screen → close-up → room).
  useEffect(()=>{
    if(view==='room')return
    const pushIn=makePush(180),pushOut=makePush(180)
    const wheel=(e:WheelEvent)=>{
      if(open)return
      e.preventDefault()
      const a=wheelAmount(e),v=useMediaHub.getState().view
      if(v==='lounge'&&pushIn(a,'in')){watchView('screen');tryFullscreen(document.querySelector('.watch-theater'))}
      else if(pushOut(a,'out')){leaveFullscreen();if(v==='screen')watchView('lounge');else{watchView('room');useStore.getState().setSeatZoom(0.85)}}
    }
    window.addEventListener('wheel',wheel,{passive:false});return()=>window.removeEventListener('wheel',wheel)
  },[view,open])
  // Keep the fullscreen request target mounted while changing views.
  return <section className={`watch-theater watch-${view}`} aria-label="TV viewing area" hidden={view==='room'}>
    {/* The remote is the only TV control; this view is just the picture. */}
    <div className="watch-tv-frame"><PlaybackMount mode={view==='room'?'lounge':view}/>{view==='lounge'&&<div className="watch-tv-trim"><span>BASEMENT VISION</span><i/><i/><small>STEREO</small></div>}</div>
    <div className="watch-hint">{notice||'Scroll in: full screen · Scroll out or Esc: back to the room'}</div>
  </section>
}
