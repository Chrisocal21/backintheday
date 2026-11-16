import { useEffect } from 'react'
import { audio, noise, tone } from './audio'
import { usePreferences } from './preferences'

export function startHouseAudio() {
  const c=audio(),nodes:AudioScheduledSourceNode[]=[],out=c.createGain(),rain=c.createGain(),hum=c.createGain(),cassette=c.createGain()
  out.connect(c.destination);rain.connect(out);hum.connect(out);cassette.connect(out)
  const source=c.createBufferSource();source.buffer=noise(c);source.loop=true
  const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;source.connect(filter).connect(rain);source.start();nodes.push(source)
  for(const frequency of [60,120]) {const o=c.createOscillator();o.frequency.value=frequency;o.type='sine';o.connect(hum);o.start();nodes.push(o)}
  const update=()=>{
    const p=usePreferences.getState(),t=c.currentTime
    out.gain.setTargetAtTime(p.master,t,0.1)
    rain.gain.setTargetAtTime(p.weather==='clear'?0:p.weatherVolume*0.12,t,0.4)
    hum.gain.setTargetAtTime(p.hum*0.012,t,0.3)
    cassette.gain.setTargetAtTime(p.cassettePlaying?p.cassetteVolume:0,t,0.1)
  }
  update();const unsub=usePreferences.subscribe(update)
  const burst=(vol:number,freq:number,duration:number)=>{
    const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=noise(c);f.type='lowpass';f.frequency.value=freq
    g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(vol,c.currentTime+0.08);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+duration)
    s.connect(f).connect(g).connect(out);s.start();s.stop(c.currentTime+duration)
    s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()}
  }
  let beat=0
  const timer=window.setInterval(()=>{
    if(c.state!=='running')return
    const p=usePreferences.getState(),t=c.currentTime;beat++
    if(p.clock)tone(c,out,t,beat%2?1100:850,0.026,p.clock*0.015,'sine')
    if(p.pipes && Math.random()<1/70)burst(p.pipes*0.018,500,0.45)
    if(p.upstairs && Math.random()<1/65)for(let i=0;i<5;i++)tone(c,out,t+i*0.55,47,0.2,p.upstairs*0.06,'sine')
    if(p.weather==='storm' && Math.random()<1/75)burst(p.weatherVolume*0.1,100,2)
    if(p.cassettePlaying) {
      const chord=[130.81,174.61,164.81,146.83][Math.floor(beat/4)%4]
      tone(c,cassette,t,chord,1.8,0.035,'triangle');tone(c,cassette,t,chord*1.5,1.4,0.018,'sine')
    }
  },1000)
  return ()=>{unsub();clearInterval(timer);nodes.forEach(n=>n.stop());out.disconnect()}
}

export function HouseAudio() {
  useEffect(()=>{
    let stop:(()=>void)|undefined
    const start=()=>{if(!stop)stop=startHouseAudio();else void audio().resume()}
    window.addEventListener('pointerdown',start,{capture:true});window.addEventListener('keydown',start,{capture:true})
    return ()=>{window.removeEventListener('pointerdown',start,true);window.removeEventListener('keydown',start,true);stop?.()}
  },[])
  return null
}
