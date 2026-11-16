import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Ink, InkBox } from './Ink'
import { openDevice, useStore } from '../store'
import { usePreferences } from '../preferences'
import { useListening } from '../listening/state'
import { LISTENING } from '../listening/catalog'
import { setListeningDistance } from '../listening/Playback'
import { RECORDS, playRecord, stopRecord, setRecordVolume } from '../audio'

const POS = new THREE.Vector3(-3.78, 0.71, -4.72)
const RANGE = 2.0

// V1 interaction 3: E (looking at it) drops the needle, E again lifts it.
// R swaps to the next record in the crate (sorted by era).
export function RecordPlayer() {
  const { camera } = useThree()
  const platter = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  const synthPlaying = useStore(s => s.recordPlaying)
  const streamPlaying = useListening(s=>s.record?.playing??false)
  const streamId = useListening(s=>s.record?.id)
  const playing=synthPlaying||streamPlaying
  const setPlaying = (v:boolean) => useStore.setState({recordPlaying:v})
  const idx = useStore(s => s.recordIndex)
  const setIdx = (v:number) => useStore.setState({recordIndex:v})
  const state = useRef({ playing: false, idx: 0, aimed: false })
  state.current.playing = playing
  state.current.idx = idx

  useEffect(() => {
    if (synthPlaying) playRecord(RECORDS[idx])
    else stopRecord()
    return stopRecord
  }, [synthPlaying,idx])
  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      const s=useStore.getState()
      if(s.arriving || s.playingGame || !s.locked || s.menuOpen || s.electronics || !state.current.aimed || e.repeat)return
      if(e.code==='KeyE'){if(useListening.getState().record)useListening.getState().toggle('record');else setPlaying(!state.current.playing)}
      if(e.code==='KeyR'){useListening.getState().stop('record');setIdx((state.current.idx+1)%RECORDS.length);if(state.current.playing)setPlaying(true)}
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  }, [])

  const dir = new THREE.Vector3()
  const to = new THREE.Vector3()
  useFrame((_, dt) => {
    const st = state.current
    if (platter.current && st.playing && !usePreferences.getState().reducedMotion) platter.current.rotation.y -= dt * (33.3 / 60) * Math.PI * 2
    if (arm.current) {
      const target = st.playing ? 0.55 : 0
      arm.current.rotation.y += (target - arm.current.rotation.y) * (usePreferences.getState().reducedMotion ? 1 : Math.min(1, dt * 4))
    }
    const d = camera.position.distanceTo(POS)
    setRecordVolume(Math.max(0.15, Math.min(1, 1.8 / Math.max(d, 0.1))) * 0.9)
    setListeningDistance(Math.max(0.15,Math.min(1,1.8/Math.max(d,0.1))))

    camera.getWorldDirection(dir)
    to.copy(POS).sub(camera.position).normalize()
    const s = useStore.getState()
    st.aimed = d < RANGE && dir.dot(to) > 0.9 && !s.holdingRemote
    const rec = RECORDS[st.idx],stream=LISTENING.find(t=>t.id===streamId),title=stream?.title??rec.title
    s.setHint(
      'record',
      st.aimed
        ? `E  ${st.playing ? 'lift needle' : 'drop needle'}   R  original records / click to browse — "${title}"`
        : st.playing
          ? `♪ ${title}`
          : null,
    )
  })

  const rec = RECORDS[idx]
  return (
    <group onClick={e=>{e.stopPropagation();openDevice('record')}}>
      <InkBox size={[0.46, 0.1, 0.38]} position={[-3.75, 0.65, -4.72]} color="#2b211b" roughness={0.4} />
      <group ref={platter} position={POS.toArray()}>
        <Ink color="#111" roughness={0.25}>
          <cylinderGeometry args={[0.15, 0.15, 0.015, 40]} />
        </Ink>
        <mesh position={[0, 0.009, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.002, 24]} />
          <meshStandardMaterial color={rec.label} />
        </mesh>
        {/* off-center stripe on the label so you can see it spin */}
        <mesh position={[0.025, 0.0105, 0]}>
          <boxGeometry args={[0.03, 0.001, 0.008]} />
          <meshStandardMaterial color="#f4ead2" />
        </mesh>
      </group>
      {/* Tonearm: pivot at back right, swings over the record */}
      <group ref={arm} position={[-3.58, 0.73, -4.6]}>
        <InkBox size={[0.03, 0.03, 0.03]} position={[0, 0, 0]} color="#888" outline={0.002} />
        <InkBox size={[0.012, 0.012, 0.2]} position={[0, 0.01, -0.1]} color="#ccc" outline={0.002} />
        <InkBox size={[0.025, 0.012, 0.035]} position={[0, 0.005, -0.21]} color="#333" outline={0.002} />
      </group>
      {/* little power light */}
      <mesh position={[-3.95, 0.66, -4.52]}>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshBasicMaterial color={playing ? '#ff4a2a' : '#331a14'} />
      </mesh>
    </group>
  )
}
