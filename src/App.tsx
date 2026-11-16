import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { Room } from './scene/Room'
import { Player } from './scene/Player'
import { Seats } from './scene/Seats'
import { lockPointer, parseYouTubeId, useStore } from './store'
import './hangout.css'
import { CHANNELS } from './channels'
import { Arrival } from './scene/Arrival'
import { GameCloset } from './scene/GameCloset'
import { Stations } from './scene/Stations'
import { StationScreen } from './stations/StationScreen'
import { Tabletop } from './ui/ClosetMenu'
import { FILMS, GAMES } from './library'
import { SEATS, TV_SCREEN } from './scene/layout'
import { SeatedFocus } from './scene/SeatedFocus'
import { ListeningPlayback } from './listening/Playback'
import { HouseAudio } from './environmentAudio'
import { HouseLife } from './scene/HouseLife'
import { CassetteDeck, PersonalPrints } from './scene/RetroLife'
import { MediaRitual } from './scene/MediaRitual'
import { ConsoleControls, ExtraDevicePanels, TVControls } from './ui/RoomSettings'
import { usePreferences } from './preferences'
import { GuideKey } from './media/GuideKey'
import { TVRemote } from './media/TVRemote'
import { IPod } from './listening/IPod'
import { IPodDock } from './scene/IPodDock'
import { ProgramGuide } from './media/ProgramGuide'
import { TVPlayback, WatchTheater } from './media/Playback'
import { openMediaHub, playMedia } from './media/state'
import { resolveLink } from './media/links'
import { BUNDLED_MEDIA } from './media/catalog'

export default function App() {
  const locked = useStore((s) => s.locked)
  const arriving = useStore(s => s.arriving)
  const playingGame = useStore(s => s.playingGame)
  const menuOpen = useStore((s) => s.menuOpen)
  const electronics = useStore((s) => s.electronics)
  const hints = useStore((s) => s.hints)
  const hideHints = usePreferences(s=>s.hideHints)
  const heldMedia = useStore(s=>s.heldMedia)
  const hint = Object.values(hints).filter(Boolean).join('   ·   ')

  return (
    <>
      <HouseAudio />
      <ListeningPlayback />
      <Canvas shadows onCreated={({ gl }) => { gl.domElement.id = 'room-canvas'; gl.domElement.tabIndex = 0 }} camera={{ fov: 70, near: 0.05, far: 50, position: [0, 1.6, 3.5] }}>
        <color attach="background" args={['#1a1410']} />
        <Room />
        <Player />
        <Seats />
        <Arrival />
        <GameCloset />
        <Stations />
        <IPodDock />
        <GameSeat />
        <SeatedFocus />
        <HouseLife /><CassetteDeck /><PersonalPrints /><MediaRitual />
        {/* Mouse look + lock state live in Player (no drei PointerLockControls; it was dropping walk mode). */}
      </Canvas>

      {createPortal(<div className="room-ui">
      {/* No title card: you just walk down the stairs into the room. */}
      {playingGame && <div className="game-help">WASD / arrows play · Space restarts · Esc puts the controller down<button onClick={() => useStore.getState().stopGame()}>Put controller down</button></div>}
      {!menuOpen && <TVRemote />}
      {!menuOpen && <ExtraDevicePanels />}
      {!menuOpen && electronics==='media' && <aside className="room-remote" aria-label="Tape and cartridge shelf"><div className="remote-label">PICK SOMETHING FOR TONIGHT</div><MediaShelf /><button className="device-done" onClick={()=>useStore.getState().setElectronics(null)}>Done</button></aside>}
      {heldMedia && !electronics && <div className="carried-media">Holding {heldMedia.title}<small>{heldMedia.kind==='tape'?'Look at the VCR under the TV, then E to insert.':'Look at the console beside the TV, then E to insert.'}</small><button onClick={()=>useStore.setState({heldMedia:null})}>Put back</button></div>}
      {!menuOpen && electronics === 'lights' && <aside className="room-remote" aria-label="Lamp controls"><div className="remote-label">ROOM LIGHTING</div><LightingControls /><button className="device-done" onClick={() => useStore.getState().setElectronics(null)}>Done</button></aside>}
      <Tabletop />
      <StationScreen />
      <GuideKey />
      <IPod />
      <TVPlayback />
      <WatchTheater />
      <ProgramGuide />
      {menuOpen ? <InputMenu /> : <>
        {locked && !arriving && !hideHints && !electronics && <div style={styles.crosshair} />}
        {hint && !arriving && !hideHints && !electronics && <div style={styles.hint}>{hint}</div>}
      </>}
      </div>, document.body)}
    </>
  )
}

function RoomControlPanel() {
  const [shelfOpen, setShelfOpen] = useState(false)
  const [favoriteName,setFavoriteName]=useState('')
  const channel = useStore(s => s.channel)
  const input = useStore(s => s.input)
  const ch = CHANNELS[channel]
  const prefs=usePreferences()
  const customId=useStore(s=>s.customId)
  const currentId=channel>=0?`channel:${channel}`:customId
  return <aside className="room-remote" aria-label="TV and room controls">
    <div className="remote-label">YOUR ROOM · YOUR REMOTE</div>
    <div className="remote-station" aria-live="polite">{input === 'game' ? 'GAME INPUT' : ch ? `CH ${ch.number} · ${ch.era}` : 'YOUR VIDEO'}</div>
    <div className="remote-channel-buttons">
      <button onClick={() => useStore.getState().channelStep(-1)}>← Previous channel</button>
      <button onClick={() => useStore.getState().channelStep(1)}>Next channel →</button>
    </div>
    <div className="remote-eras">{CHANNELS.map((c, i) => <button key={c.number} aria-pressed={channel === i && input === 'tv'} onClick={() => { const s = useStore.getState(); useStore.setState({ channel: i, noSignal: false }); s.setInput('tv') }}>{c.era}</button>)}</div>
    <div className="remote-tools">
      <button onClick={() => setShelfOpen(v => !v)} aria-expanded={shelfOpen}>Movies & games</button>
      <button onClick={()=>useStore.getState().setElectronics('room')}>Room settings</button>
      <button onClick={()=>{if(currentId&&!prefs.favorites.some(f=>f.id===currentId))prefs.change('favorites',[...prefs.favorites,{id:currentId,name:favoriteName.trim()||(ch?`${ch.era} channel`:'My video')}])}}>Save favorite</button>
      <button onClick={() => useStore.getState().openMenu()}>Play a link / Input</button>
      <button onClick={() => useStore.getState().setElectronics(null)}>Done</button>
    </div>
    {!!prefs.favorites.length&&<div className="favorite-list">{prefs.favorites.map(f=><div key={f.id}><button onClick={()=>{if(f.id.startsWith('channel:')){useStore.setState({channel:Number(f.id.split(':')[1])});useStore.getState().setInput('tv')}else useStore.getState().playCustom(f.id)}}>{f.name}</button><button aria-label={`Remove ${f.name}`} onClick={()=>prefs.change('favorites',prefs.favorites.filter(x=>x.id!==f.id))}>×</button></div>)}</div>}
    <TVControls />
    <label className="favorite-name">Favorite name<input maxLength={48} value={favoriteName} onChange={e=>setFavoriteName(e.target.value)} placeholder="My late-night channel" /></label>
    {shelfOpen && <MediaShelf />}
    <p>Esc frees your mouse · [ and ] change channels · E uses the remote</p>
  </aside>
}

function MediaShelf() {
  const noSignal = useStore(s => s.noSignal)
  const filmId = useStore(s => s.filmId)
  const tape=useStore(s=>s.insertedTape),cartridge=useStore(s=>s.insertedCartridge)
  return <div className="media-shelf">
    <button className="guide-button" onClick={openMediaHub}>📺 Program guide · {BUNDLED_MEDIA.length} movies, shows & cartoons</button>
    <h3>TV & movie shelf</h3>
    {tape&&<button onClick={()=>useStore.setState({insertedTape:null,filmId:null,mediaPaused:false})}>Eject tape</button>}
    {noSignal && <p>This stream is unavailable. Try another title or its source below.</p>}
    {FILMS.map(f => <div className="media-title" key={f.id}>
      <button aria-pressed={filmId === f.id} onClick={() => useStore.getState().pickMedia('tape',f.id,f.title)}>{f.title}<small>Watch now - {f.year} · {f.category}</small></button>
      <a href={f.source} target="_blank" rel="noreferrer">Source & credits</a><small>{f.credit}</small>
    </div>)}
    <h3>Game cartridges</h3>
    <ConsoleControls />
    {cartridge&&<div className="remote-tools"><button onClick={()=>useStore.getState().playGame(cartridge)}>Play inserted game</button><button onClick={()=>useStore.setState({insertedCartridge:null,playingGame:false,input:'tv'})}>Eject cartridge</button></div>}
    {GAMES.map(g => <div className="media-title" key={g.id}><button onClick={() => useStore.getState().pickMedia('cartridge',g.id,g.title)}>{g.title}<small>Play now - {g.help}</small></button><small>Original game · Free to play here</small></div>)}
  </div>
}

function GameSeat() {
  const { camera } = useThree()
  const playing = useStore(s => s.playingGame)
  useEffect(() => {
    if (!playing) return
    useStore.getState().setSeated(1)
    useStore.getState().setSeatZoom(0.75)
    camera.position.set(...SEATS[1].eye)
    camera.lookAt(...TV_SCREEN)
  }, [playing, camera])
  return null
}

function LightingControls() {
  const p=usePreferences()
  const { lightLevel, lampLevel, tvGlow, setLightLevel, setLampLevel, setTvGlow, setMood } = useStore()
  return <div className="lighting-controls">
    <div className="remote-tools"><button onClick={()=>p.change('leftLamp',!p.leftLamp)}>Couch lamp: {p.leftLamp?'on':'off'}</button><button onClick={()=>p.change('nookLamp',!p.nookLamp)}>Record lamp: {p.nookLamp?'on':'off'}</button><button onClick={()=>useStore.getState().setElectronics('room')}>Sound & weather</button></div>
    <div className="mood-presets" aria-label="Room mood">
      <button onClick={() => setMood('late')}>Late night</button>
      <button onClick={() => setMood('movie')}>Movie night</button>
      <button onClick={() => setMood('bright')}>Lights up</button>
    </div>
    {([
      ['Overhead', lightLevel, setLightLevel],
      ['Warm lamps', lampLevel, setLampLevel],
      ['TV glow', tvGlow, setTvGlow],
    ] as const).map(([label, value, change]) => <label key={label} className="hangout-light">{label}<span>{Math.round(value * 100)}%</span>
      <input aria-label={label} type="range" min="0" max="1" step="0.01" value={value} onChange={e => change(Number(e.target.value))} />
    </label>)}
  </div>
}

function InputMenu() {
  const { input, setInput, playCustom, closeMenu } = useStore()
  const [link, setLink] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.code === 'Escape' && closeMenu()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMenu])

  // Any supported link: YouTube, Vimeo, Dailymotion, Twitch, archive.org, or a direct video/audio file.
  const submit = async () => {
    const id = parseYouTubeId(link)
    if (id && /youtu|^[\w-]{11}$/.test(link.trim())) { playCustom(id); closeMenu(); return }
    try { const item = await resolveLink(link); closeMenu(); playMedia(item) }
    catch (e) { setErr((e as Error).message) }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.menu}>
        <div style={styles.menuTitle}>INPUT</div>
        {(['tv', 'game'] as const).map((i) => (
          <button
            key={i}
            style={{ ...styles.menuBtn, ...(input === i ? styles.menuBtnOn : {}) }}
            onClick={() => {
              setInput(i)
              closeMenu()
            }}
          >
            {input === i ? 'â–¶ ' : '  '}
            {i === 'tv' ? 'TV' : 'GAME'}
          </button>
        ))}
        <div style={{ marginTop: 18, fontSize: 13, opacity: 0.8 }}>Paste a YouTube link</div>
        <input
          autoFocus
          value={link}
          onChange={(e) => {
            setLink(e.target.value)
            setErr('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="https://youtube.com/watch?v=..."
          style={styles.input}
        />
        {err && <div style={{ color: '#f66', fontSize: 12, marginTop: 6 }}>{err}</div>}
        <button style={{ ...styles.menuBtn, marginTop: 10 }} onClick={submit}>
          PLAY LINK
        </button>
        <button style={{ ...styles.menuBtn, opacity: 0.7 }} onClick={closeMenu}>
          BACK (Esc)
        </button>
      </div>
    </div>
  )
}

const mono = '"Courier New", monospace'
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    background: 'rgba(20,14,10,0.55)', color: '#f4e9d8',
    fontFamily: 'Georgia, serif', userSelect: 'none',
  },
  title: { fontSize: 56, fontWeight: 700, letterSpacing: 1, textShadow: '3px 3px 0 #000' },
  tag: { fontSize: 22, fontStyle: 'italic', marginTop: 4, opacity: 0.9 },
  help: { fontSize: 14, marginTop: 28, opacity: 0.7, fontFamily: 'monospace' },
  crosshair: {
    position: 'fixed', left: '50%', top: '50%', width: 6, height: 6,
    marginLeft: -3, marginTop: -3, borderRadius: '50%',
    background: '#f4e9d8', border: '1.5px solid #000', pointerEvents: 'none',
  },
  hint: {
    position: 'fixed', bottom: 32, left: 0, right: 0, textAlign: 'center',
    color: '#f4e9d8', fontFamily: mono, fontSize: 15, textShadow: '2px 2px 0 #000', pointerEvents: 'none',
  },
  menu: {
    background: '#0a1a3a', border: '3px solid #f4e9d8', padding: '22px 28px', width: 360,
    fontFamily: mono, color: '#f4e9d8', cursor: 'default', boxShadow: '6px 6px 0 #000',
  },
  menuTitle: { fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: 4 },
  menuBtn: {
    display: 'block', width: '100%', textAlign: 'left', background: 'transparent', color: '#f4e9d8',
    border: 0, fontFamily: mono, fontSize: 18, padding: '6px 4px', cursor: 'pointer', whiteSpace: 'pre',
  },
  menuBtnOn: { background: '#f4e9d8', color: '#0a1a3a' },
  input: {
    width: '100%', boxSizing: 'border-box', marginTop: 6, padding: 8, fontFamily: mono, fontSize: 14,
    background: '#000', color: '#3f6', border: '2px solid #f4e9d8',
  },
}
