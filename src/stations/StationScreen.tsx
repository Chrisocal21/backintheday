import { useEffect, useRef, useState } from 'react'
import { STATIONS, type Cart } from './catalog'
import { closeStation, useStation } from './state'
import { leaveFullscreen, makePush, tryFullscreen, wheelAmount } from '../takeover'
import { H, W, text, type Game } from './engine'
import { makeKeys } from './games'
import { useLibraryShelf } from '../libraryShelf'
import './stations.css'

// One device at a time: its own frame, its own game list, its own screen.
export function StationScreen() {
  const id = useStation((s) => s.open)
  if (!id) return null
  return <Device key={id} id={id} />
}

function Device({id}:{id:keyof typeof STATIONS}) {
  const st=STATIONS[id], shelf=useLibraryShelf()
  const [sel,setSel]=useState(0),[playing,setPlaying]=useState<Cart|null>(null)
  const [query,setQuery]=useState(''),[genre,setGenre]=useState('all'),[view,setView]=useState('all')
  const selected=useRef<HTMLButtonElement>(null)
  const [best,setBest]=useState<Record<string,number>>(()=>{try{return JSON.parse(localStorage.getItem('bitd-best')||'{}')}catch{return {}}})
  const key=(g:Cart)=>`game:${id}:${g.id}`
  const filtered=st.games.filter(g=>(genre==='all'||g.genre===genre)&&`${g.title} ${g.genre} ${g.blurb}`.toLowerCase().includes(query.toLowerCase())&&(view==='all'||(view==='favorites'?shelf.favorites:shelf.recent).includes(key(g))))
  if(view==='recent')filtered.sort((a,b)=>shelf.recent.indexOf(key(a))-shelf.recent.indexOf(key(b)))
  const index=Math.min(sel,Math.max(0,filtered.length-1)),cart=playing??filtered[index]
  const launch=(game:Cart)=>{shelf.remember(key(game));setPlaying(game)}
  useEffect(()=>{setSel(0)},[query,genre,view])
  useEffect(()=>{selected.current?.scrollIntoView({block:'nearest'})},[index,query,genre,view])
  useEffect(()=>{
    if(playing)return
    const onKey=(e:KeyboardEvent)=>{
      if(e.code==='Escape'){e.stopImmediatePropagation();closeStation();return}
      if((e.target as Element|null)?.closest?.('input,select,textarea'))return
      if((e.target as Element|null)?.closest?.('button')&&['Enter','Space'].includes(e.code))return
      e.stopImmediatePropagation()
      if(!filtered.length)return
      if(e.code==='ArrowDown'||e.code==='KeyS'){e.preventDefault();setSel((index+1)%filtered.length)}
      if(e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();setSel((index-1+filtered.length)%filtered.length)}
      if(e.code==='Enter'||e.code==='Space'){e.preventDefault();launch(filtered[index])}
    }
    window.addEventListener('keydown',onKey,true);return()=>window.removeEventListener('keydown',onKey,true)
  },[playing,index,query,genre,view,filtered.map(g=>g.id).join(',')])
  // Scroll wheel: keep scrolling in → this device's screen takes over the window; scroll out → back.
  const big=useStation(s=>s.big)
  useEffect(()=>{
    const pushIn=makePush(180),pushOut=makePush(180)
    const wheel=(e:WheelEvent)=>{
      // Over the game list: scroll the list first; once it's at the top, scrolling in takes over.
      const list=(e.target as Element|null)?.closest?.('.st-menu') as HTMLElement|null
      if(!useStation.getState().big&&list&&(e.deltaY>0||list.scrollTop>0))return
      const a=wheelAmount(e),isBig=useStation.getState().big
      if(!isBig&&pushIn(a,'in')){e.preventDefault();useStation.setState({big:true});tryFullscreen()}
      else if(isBig){e.preventDefault();if(pushOut(a,'out')){useStation.setState({big:false});leaveFullscreen()}}
    }
    window.addEventListener('wheel',wheel,{passive:false});return()=>window.removeEventListener('wheel',wheel)
  },[])
  const saveBest=(game:Cart,score:number)=>{
    const k=`${id}:${game.id}`;if(!Number.isFinite(score)||score<=(best[k]??0))return
    const next={...best,[k]:score};setBest(next);try{localStorage.setItem('bitd-best',JSON.stringify(next))}catch{}
  }
  return <div className={`st-backdrop${big?' st-big':''}`}><div className={`st-device ${st.frame}`}>
    {big&&<button className="st-shrink" onClick={()=>{useStation.setState({big:false});leaveFullscreen()}}>Exit full screen (scroll out)</button>}
    <div className="st-brand"><span>{st.name}</span><small>{st.kind} / {st.era}</small></div>
    {!playing&&<div className="st-discovery">
      <label>Find a game<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, genre or description" /></label>
      <label>Genre<select value={genre} onChange={e=>setGenre(e.target.value)}><option value="all">All genres</option>{[...new Set(st.games.map(g=>g.genre))].sort().map(g=><option key={g}>{g}</option>)}</select></label>
      <div className="st-tabs">{['all','favorites','recent'].map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='all'?`All ${st.games.length}`:v==='favorites'?'Favorites':'Recently played'}</button>)}<button disabled={!filtered.length} onClick={()=>launch(filtered[Math.floor(Math.random()*filtered.length)])}>Pick for me</button></div>
    </div>}
    <div className="st-screen">{playing?<Player cart={playing} pal={st.pal} onExit={()=>setPlaying(null)} onScore={s=>saveBest(playing,s)} />:<ul className="st-menu" style={{background:st.pal.bg,color:st.pal.fg}}>
      <li className="st-menu-head">{filtered.length} GAME{filtered.length===1?'':'S'} ON THIS DEVICE</li>
      {!filtered.length&&<li className="st-empty">Nothing on this shelf yet.<button onClick={()=>{setQuery('');setGenre('all');setView('all')}}>Show all games</button></li>}
      {filtered.map((g,i)=><li className="st-row" key={g.id}>
        <button ref={i===index?selected:undefined} className={i===index?'on':''} style={i===index?{background:st.pal.fg,color:st.pal.bg}:{color:st.pal.fg}} onMouseEnter={()=>setSel(i)} onClick={()=>launch(g)}><span>{i===index?'>':' '} {g.title}</span><em>{best[`${id}:${g.id}`]?`BEST ${best[`${id}:${g.id}`]}`:g.genre}</em></button>
        <button className="st-star" aria-label={`${shelf.favorites.includes(key(g))?'Unfavorite':'Favorite'} ${g.title}`} aria-pressed={shelf.favorites.includes(key(g))} onClick={()=>shelf.toggle(key(g))}>{shelf.favorites.includes(key(g))?'\u2605':'\u2606'}</button>
      </li>)}
      <li className="st-menu-foot">UP/DOWN choose / ENTER play / ESC leave</li>
    </ul>}</div>
    <div className="st-info">{cart?<><b>{cart.title}</b> <span className="st-genre">{cart.genre}</span><p>{cart.blurb}</p><p className="st-controls">{cart.controls}{playing?' / Esc returns to library':''}</p><small>Original game / visual style circa {cart.styleYear}. Not a historical commercial release.</small></>:<p>Search or change the shelf to find something to play.</p>}</div>
    <button className="st-leave" onClick={closeStation}>Leave {st.kind.toLowerCase()}</button>
  </div></div>
}

function Player({ cart, pal, onExit, onScore }: { cart: Cart; pal: typeof STATIONS.arcade.pal; onExit: () => void; onScore: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [round, setRound] = useState(0)
  const [paused,setPaused]=useState(false)
  const pause=useRef(false)
  pause.current=paused
  const cb = useRef({ onExit, onScore })
  cb.current = { onExit, onScore }

  useEffect(() => {
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    const keys = makeKeys()
    let game: Game = cart.make(pal)
    let reported = false
    let raf = 0, last = performance.now()
    const down = (e: KeyboardEvent) => {
      if((e.target as Element|null)?.closest?.('button')&&['Enter','Space'].includes(e.code))return
      e.stopImmediatePropagation()
      if (e.code === 'Escape') { cb.current.onExit(); return }
      if(e.code==='Pause'||e.code==='KeyP'&&cart.genre!=='Typing'){e.preventDefault();setPaused(v=>!v);return}
      if (/^(Arrow|Space)/.test(e.code)) e.preventDefault()
      if (game.over && (e.code === 'Enter' || e.code === 'Space')) { setRound((r) => r + 1); return }
      if(pause.current)return
      if (!game.over) game.key?.(e.key)
      keys.press(e.code, true)
    }
    const up = (e: KeyboardEvent) => { e.stopImmediatePropagation(); keys.press(e.code, false) }
    const click = (e: MouseEvent) => {
      e.preventDefault()
      if(pause.current)return
      const r = cv.getBoundingClientRect()
      const scale=Math.min(r.width/W,r.height/H)
      const x=(e.clientX-r.left-(r.width-W*scale)/2)/scale,y=(e.clientY-r.top-(r.height-H*scale)/2)/scale
      if(!game.over&&x>=0&&x<W&&y>=0&&y<H)game.click?.(x,y,e.button===2)
    }
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (!game.over && !pause.current) game.update(dt, keys)
      game.draw(g)
      if (game.over) {
        if (!reported) { reported = true; cb.current.onScore(game.score) }
        g.fillStyle = pal.bg + 'cc'; g.fillRect(0, H / 2 - 30, W, 60)
        text(g, 'GAME OVER', W / 2, H / 2 - 6, 16, pal.c, 'center')
        text(g, `SCORE ${game.score} · ENTER to retry · ESC menu`, W / 2, H / 2 + 14, 8, pal.fg, 'center')
      }
      if(pause.current){g.fillStyle=pal.bg+'dd';g.fillRect(0,H/2-20,W,40);text(g,'PAUSED',W/2,H/2+4,15,pal.fg,'center')}
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    cv.addEventListener('mousedown', click)
    const context=(e:Event)=>e.preventDefault()
    const blur=()=>{['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space','KeyX','KeyZ','Enter','ShiftLeft','ShiftRight'].forEach(k=>keys.press(k,false));setPaused(true)}
    cv.addEventListener('contextmenu', context)
    window.addEventListener('blur',blur)
    cv.focus()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      cv.removeEventListener('mousedown', click)
      cv.removeEventListener('contextmenu',context)
      window.removeEventListener('blur',blur)
    }
  }, [cart, pal, round])

  return <div className="st-player"><canvas ref={canvas} width={W} height={H} tabIndex={-1} className="st-canvas" /><div className="st-game-actions"><button onClick={()=>setPaused(v=>!v)}>{paused?'Resume':'Pause'}</button><button onClick={()=>{setPaused(false);setRound(v=>v+1)}}>Restart</button><button onClick={onExit}>Library</button></div></div>
}
