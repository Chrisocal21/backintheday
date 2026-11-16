import { useState } from 'react'
import { usePreferences } from '../preferences'
import { useStore } from '../store'
import { RECORDS } from '../audio'
import { ListeningLibrary } from '../listening/ListeningLibrary'
import { useListening } from '../listening/state'
import { openStation } from '../stations/state'

export function Range({label,value,onChange,min=0,max=1}:{label:string;value:number;onChange:(v:number)=>void;min?:number;max?:number}) {
  return <label className="setting-range">{label}<span>{Math.round(value*100)}%</span><input aria-label={label} type="range" min={min} max={max} step="0.01" value={value} onChange={e=>onChange(Number(e.target.value))} /></label>
}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}) {
  return <label className="setting-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} /></label>
}
export function TVControls() {
  const p=usePreferences()
  const paused=useStore(s=>s.mediaPaused)
  return <div className="device-section">
    <Toggle label="TV power" checked={p.tvPower} onChange={v=>{p.change('tvPower',v);if(!v)useStore.setState({playingGame:false})}} />
    <Range label="TV volume" value={p.tvVolume} onChange={v=>p.change('tvVolume',v)} />
    <button onClick={()=>useStore.setState({mediaPaused:!paused})}>{paused?'Resume video':'Pause video'}</button>
  </div>
}
export function ConsoleControls() {
  const p=usePreferences()
  return <Toggle label="Console / arcade power" checked={p.consolePower} onChange={v=>{p.change('consolePower',v);if(!v)useStore.setState({playingGame:false})}} />
}
export function RoomOptions() {
  const p=usePreferences()
  return <>
    <h3>Outside tonight</h3>
    <div className="mood-presets">{(['clear','rain','storm'] as const).map(w=><button key={w} aria-pressed={p.weather===w} onClick={()=>p.change('weather',w)}>{w==='clear'?'Dry night':w==='rain'?'Rain':'Distant storm'}</button>)}</div>
    <h3>Sound in the house</h3>
    {([
      ['master','Master'],['tvVolume','TV'],['musicVolume','Records & iPod'],['cassetteVolume','Cassette'],
    ] as const).map(([key,label])=><Range key={key} label={label} value={p[key]} onChange={v=>p.change(key,v)} />)}
    <h3>Comfort</h3>
    <Range label="Room brightness" value={p.brightness} min={0.65} max={1.4} onChange={v=>p.change('brightness',v)} />
    <Toggle label="Hide interaction hints" checked={p.hideHints} onChange={v=>p.change('hideHints',v)} />
    <Toggle label="Reduce motion" checked={p.reducedMotion} onChange={v=>p.change('reducedMotion',v)} />
    <Toggle label="Remember my seat & zoom" checked={p.rememberSeat} onChange={v=>p.change('rememberSeat',v)} />
    <p>Settings save on this browser. O opens this panel; Esc closes it.</p>
  </>
}
function PersonalOptions() {
  const p=usePreferences(),[error,setError]=useState('')
  const upload=(key:'photoData'|'posterData',file?:File)=>{
    if(!file)return
    if(!file.type.startsWith('image/')||file.size>12*1024*1024){setError('Choose an image under 12 MB.');return}
    const reader=new FileReader()
    reader.onload=()=>{
      const img=new Image();img.onload=()=>{
        const c=document.createElement('canvas'),scale=Math.min(1,900/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale)
        c.getContext('2d')!.drawImage(img,0,0,c.width,c.height)
        try{p.change(key,c.toDataURL('image/jpeg',0.82));setError('')}catch{setError('Browser storage is full. Remove an image and try again.')}
      };img.onerror=()=>setError('That image could not be opened.');img.src=String(reader.result)
    };reader.readAsDataURL(file)
  }
  return <>
    <h3>Your photos & posters</h3><p>Images stay in this browser. Click the personal frame or print to change it.</p>
    <label className="image-upload">Framed photo<input type="file" accept="image/*" onChange={e=>upload('photoData',e.target.files?.[0])} /></label>
    {p.photoData&&<button onClick={()=>p.change('photoData','')}>Remove photo</button>}
    <label className="image-upload">Personal poster<input type="file" accept="image/*" onChange={e=>upload('posterData',e.target.files?.[0])} /></label>
    {p.posterData&&<button onClick={()=>p.change('posterData','')}>Remove personal poster</button>}
    {error&&<p role="alert">{error}</p>}
    <h3>Printed poster palette</h3>
    <div className="mood-presets">{(['original','warm','neon'] as const).map(v=><button key={v} aria-pressed={p.posterStyle===v} onClick={()=>p.change('posterStyle',v)}>{v}</button>)}</div>
  </>
}
export function ExtraDevicePanels() {
  const [recordView,setRecordView]=useState<'library'|'original'>('library')
  const [recordQuery,setRecordQuery]=useState('')
  const [recordEra,setRecordEra]=useState('all')
  const device=useStore(s=>s.electronics), p=usePreferences()
  const idx=useStore(s=>s.recordIndex),playing=useStore(s=>s.recordPlaying)
  const playOriginal=(index:number)=>{useListening.getState().stop('record');useStore.setState({recordIndex:index,recordPlaying:true})}
  if(!['room','personal','record','computer','cassette'].includes(device??''))return null
  return <aside className={`room-remote settings-panel ${device==='record'||device==='cassette'?'listening-panel':''}`} aria-label={`${device} controls`}>
    <div className="remote-label">{device==='room'?'MAKE YOURSELF AT HOME':device==='personal'?'MAKE IT YOURS':device?.toUpperCase()}</div>
    {device==='room'&&<><RoomOptions /><button onClick={()=>useStore.getState().setElectronics('personal')}>My photos & posters</button></>}
    {device==='personal'&&<PersonalOptions />}
    {device==='record'&&<>
      <div className="record-mode"><button aria-pressed={recordView==='library'} onClick={()=>setRecordView('library')}>Free recordings</button><button aria-pressed={recordView==='original'} onClick={()=>setRecordView('original')}>Original records ({RECORDS.length})</button></div>
      {recordView==='library'?<ListeningLibrary kind="record" />:<>
        <h3>{RECORDS[idx].title}</h3><p>{RECORDS[idx].era} mood / Original synthesized music</p>
        <button onClick={()=>{useListening.getState().stop('record');useStore.setState({recordPlaying:!playing})}}>{playing?'Lift needle':'Drop needle'}</button>
        <div className="remote-tools"><button onClick={()=>playOriginal((idx+RECORDS.length-1)%RECORDS.length)}>Previous</button><button onClick={()=>playOriginal((idx+1)%RECORDS.length)}>Next</button></div>
        <Range label="Record volume" value={p.musicVolume} onChange={v=>p.change('musicVolume',v)} />
        <label className="listen-search">Find an original<input value={recordQuery} onChange={e=>setRecordQuery(e.target.value)} placeholder="Search the crate" /></label>
        <div className="mood-presets">{['all','70s','80s','90s','2000s'].map(era=><button key={era} aria-pressed={recordEra===era} onClick={()=>setRecordEra(era)}>{era}</button>)}</div>
        <div className="synth-list">{RECORDS.map((r,i)=>({r,i})).filter(({r})=>(recordEra==='all'||r.era===recordEra)&&r.title.toLowerCase().includes(recordQuery.toLowerCase())).map(({r,i})=><button key={r.title} onClick={()=>playOriginal(i)}>{r.title}<small> / {r.era} / {r.bpm} BPM</small></button>)}</div>
      </>}
    </>}
    {device==='computer'&&<><h3>Family computer</h3><Toggle label="Computer power" checked={p.computerPower} onChange={v=>p.change('computerPower',v)} /><p>An original starfield screensaver. The wooden chair faces this monitor.</p><button onClick={()=>openStation('computer')}>Play computer games (17)</button></>}
    {device==='cassette'&&<><ListeningLibrary kind="tape" /><details><summary>Original after-hours mixtape</summary><button onClick={()=>{useListening.getState().stop('tape');p.change('cassettePlaying',!p.cassettePlaying)}}>{p.cassettePlaying?'Stop original mixtape':'Play original mixtape'}</button></details></>}
    <button className="device-done" onClick={()=>useStore.getState().setElectronics(null)}>Done</button>
  </aside>
}
