import { useState } from 'react'
import { LISTENING,type ListeningKind } from './catalog'
import { useListening } from './state'
import { useLibraryShelf } from '../libraryShelf'
import { seekListening } from './Playback'
import { usePreferences } from '../preferences'
import './listening.css'

const minutes=(time:number)=>`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`
export function ListeningLibrary({kind}:{kind:ListeningKind}) {
  const shelf=useLibraryShelf(),s=useListening(),p=usePreferences(),active=s[kind]
  const [query,setQuery]=useState(''),[genre,setGenre]=useState('all'),[era,setEra]=useState('all'),[view,setView]=useState('all')
  const all=LISTENING.filter(t=>t.format===kind),track=all.find(t=>t.id===active?.id),key=(id:string)=>`audio:${kind}:${id}`
  const found=all.filter(t=>(genre==='all'||t.genre===genre)&&(era==='all'||t.era===era)&&`${t.title} ${t.genre} ${t.creator}`.toLowerCase().includes(query.toLowerCase())&&(view==='all'||(view==='favorites'?shelf.favorites:shelf.recent).includes(key(t.id))))
  if(view==='recent')found.sort((a,b)=>shelf.recent.indexOf(key(a.id))-shelf.recent.indexOf(key(b.id)))
  return <div className="listening-library">
    <h3>{kind==='record'?'Record crate':'Tape drawer'}</h3>
    <p>{all.length} free recordings. {kind==='record'?'Era labels describe the mood, not the release year.':'Classic texts, modern public-domain narrations.'}</p>
    <label className="listen-search">Find something<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, artist or genre" /></label>
    <div className="listen-filters"><select aria-label="Listening genre" value={genre} onChange={e=>setGenre(e.target.value)}><option value="all">All genres</option>{[...new Set(all.map(t=>t.genre))].sort().map(g=><option key={g}>{g}</option>)}</select>{kind==='record'&&<select aria-label="Era mood" value={era} onChange={e=>setEra(e.target.value)}><option value="all">Every era mood</option>{['70s','80s','90s','2000s'].map(e=><option key={e}>{e}</option>)}</select>}</div>
    <div className="listen-tabs">{['all','favorites','recent'].map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='all'?'All':v==='favorites'?'Favorites':'Recent'}</button>)}<button disabled={!found.length} onClick={()=>s.play(kind,found[Math.floor(Math.random()*found.length)].id)}>Surprise me</button></div>
    {track&&active&&<section className="listen-now" aria-label="Now playing"><small>NOW ON THE {kind==='record'?'TURNTABLE':'CASSETTE DECK'}</small><b>{track.title}</b><span>{track.creator}</span>
      <div className="listen-transport"><button onClick={()=>s.next(kind,-1)} aria-label="Previous recording">Previous</button><button onClick={()=>s.toggle(kind)}>{active.playing?'Pause':'Play'}</button><button onClick={()=>s.next(kind)} aria-label="Next recording">Next</button><button onClick={()=>s.stop(kind)}>Stop</button></div>
      <label>Position {minutes(active.time)} / {minutes(active.duration)}<input aria-label="Playback position" type="range" min="0" max={active.duration||1} step="1" value={Math.min(active.time,active.duration||1)} onChange={e=>seekListening(kind,Number(e.target.value))} /></label>
      {active.error&&<p role="alert">{active.error}</p>}
      <small>{track.note}</small><a href={track.source} target="_blank" rel="noreferrer">Recording source</a> / <a href={track.licenseUrl} target="_blank" rel="noreferrer">{track.license}</a>
    </section>}
    <label className="listen-volume">{kind==='record'?'Records':'Cassette'} volume <span>{Math.round(p[kind==='record'?'musicVolume':'cassetteVolume']*100)}%</span><input aria-label={`${kind} volume`} type="range" min="0" max="1" step="0.01" value={p[kind==='record'?'musicVolume':'cassetteVolume']} onChange={e=>p.change(kind==='record'?'musicVolume':'cassetteVolume',Number(e.target.value))} /></label>
    <label className="listen-mode">After a recording<select aria-label="Playback order" value={s.mode} onChange={e=>useListening.setState({mode:e.target.value as typeof s.mode})}><option value="next">Play next</option><option value="repeat">Repeat</option><option value="shuffle">Shuffle</option></select></label>
    <div className="listen-results" aria-label="Recordings">{!found.length&&<p>No matches. Try another genre or clear the search.</p>}{found.map(t=><article key={t.id} className={t.id===active?.id?'selected':''}><button className="listen-title" onClick={()=>s.play(kind,t.id)}><b>{t.title}</b><small>{t.genre}{kind==='record'?` / ${t.era} mood`:t.duration?` / ${minutes(t.duration)}`:''}</small></button><button className="listen-star" aria-label={`${shelf.favorites.includes(key(t.id))?'Unfavorite':'Favorite'} ${t.title}`} aria-pressed={shelf.favorites.includes(key(t.id))} onClick={()=>shelf.toggle(key(t.id))}>{shelf.favorites.includes(key(t.id))?'★':'☆'}</button><small className="listen-credit">{t.creator} / <a href={t.licenseUrl} target="_blank" rel="noreferrer">{t.license}</a> / <a href={t.source} target="_blank" rel="noreferrer">Source</a></small></article>)}</div>
  </div>
}
