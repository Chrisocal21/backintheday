// Development-only component review. Open /tools/review-library.html in Vite.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { StationScreen } from '../src/stations/StationScreen'
import { openStation } from '../src/stations/state'
import { ListeningLibrary } from '../src/listening/ListeningLibrary'
import { ListeningPlayback } from '../src/listening/Playback'
import '../src/hangout.css'
const device=new URLSearchParams(location.search).get('device')||'computer'
const audio=device==='record'||device==='tape'
if(!audio)openStation(device as 'computer')
document.body.style.background='#161310'
createRoot(document.getElementById('root')!).render(<React.StrictMode>{audio?<><aside className="room-remote settings-panel listening-panel" style={{position:'relative',margin:'20px auto',top:0,right:'auto',maxHeight:'90vh'}}><ListeningLibrary kind={device}/></aside><ListeningPlayback/></>:<StationScreen/>}<a href="/" style={{position:'fixed',bottom:8,left:12,zIndex:1000,color:'#eadbb9',font:'12px monospace'}}>Return to room</a></React.StrictMode>)
