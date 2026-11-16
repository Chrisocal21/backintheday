import { PlaybackMount } from '../media/Playback'
import { useMediaHub } from '../media/state'
import { Html } from '@react-three/drei'
import { InkBox } from './Ink'
import { useStore } from '../store'
import { GameScreen } from './GameScreen'
import { FurnitureBox } from './Furniture'
import { usePreferences } from '../preferences'

// Screen size in meters, and the CSS pixel size of the embedded page.
// drei <Html transform> renders 1 CSS px as 1/40 m, so we scale the group to fit.
const SCREEN_W = 0.7
const SCREEN_H = 0.52
const PX_W = 640
const PX_H = Math.round((PX_W * SCREEN_H) / SCREEN_W)
const HTML_SCALE = SCREEN_W / (PX_W / 40)

export function TV({ position }: { position: [number, number, number] }) {
  const power=usePreferences(s=>s.tvPower)
  return (
    <group position={position} onClick={e => { e.stopPropagation(); useStore.getState().setElectronics('tv'); document.exitPointerLock() }}>
      {/* CRT body (inked); the screen itself stays unstyled */}
      <FurnitureBox size={[0.9, 0.7, 0.6]} position={[0, 0, 0]} color="#454449" finish="plastic" radius={0.045} />
      <FurnitureBox size={[0.78, 0.6, 0.02]} position={[0, 0.02, 0.3]} color="#17191c" finish="plastic" radius={0.008} />
      <FurnitureBox size={[0.043, 0.028, 0.019]} position={[0.36, -0.3, 0.31]} color="#666366" finish="plastic" radius={0.008} />
      <mesh position={[0.3,-0.3,0.321]}><sphereGeometry args={[0.004,8,8]} /><meshBasicMaterial color={power?'#afc76b':'#3c4031'} /></mesh>
      {Array.from({length:9},(_,i)=><InkBox key={i} size={[0.002,0.006,0.22]} position={[0.45,0.14-i*0.026,-0.04]} color="#242328" outline={0} />)}
      {Array.from({length:7},(_,i)=><FurnitureBox key={i} size={[0.003,0.34,0.003]} position={[0.38+i*0.007,0.025,0.302]} color="#202125" finish="plastic" radius={0.001} />)}
      <Html
        zIndexRange={[100, 0]}
        transform
        occlude="blending"
        position={[0, 0.02, 0.312]}
        scale={HTML_SCALE}
        style={{ width: PX_W, height: PX_H, pointerEvents: 'none' }}
      >
        <Screen />
      </Html>
    </group>
  )
}

function Screen() {
  const view=useMediaHub(s=>s.view),input=useStore(s=>s.input),gameId=useStore(s=>s.gameId)
  return <div style={{width:PX_W,height:PX_H,background:'#000',position:'relative'}}>
    {input==='game'?<GameScreen id={gameId}/>:view==='room'?<PlaybackMount mode="room"/>:<div style={{color:'#9cb79c',padding:80,font:'24px monospace',textAlign:'center'}}>PLAYING IN WATCH VIEW</div>}
  </div>
}
