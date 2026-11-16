import { create } from 'zustand'
import { LISTENING,type ListeningKind } from './catalog'
import { useLibraryShelf } from '../libraryShelf'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
export type Playback={id:string;playing:boolean;time:number;duration:number;error:string;request:number}
type State={record:Playback|null;tape:Playback|null;mode:'next'|'repeat'|'shuffle';play:(kind:ListeningKind,id:string)=>void;toggle:(kind:ListeningKind)=>void;stop:(kind:ListeningKind)=>void;next:(kind:ListeningKind,direction?:1|-1,automatic?:boolean)=>void;update:(kind:ListeningKind,values:Partial<Playback>)=>void}
export const useListening=create<State>((set,get)=>({
  record:null,tape:null,mode:'next',
  play:(kind,id)=>{
    const track=LISTENING.find(t=>t.id===id&&t.format===kind);if(!track)return
    if(kind==='record')useStore.setState({recordPlaying:false})
    else usePreferences.getState().change('cassettePlaying',false)
    set({[kind]:{id,playing:true,time:0,duration:track.duration??0,error:'',request:(get()[kind]?.request??0)+1}})
    useLibraryShelf.getState().remember(`audio:${kind}:${id}`)
  },
  toggle:kind=>{const current=get()[kind];if(current)set({[kind]:{...current,playing:!current.playing,error:''}})},
  stop:kind=>set({[kind]:null}),
  next:(kind,direction=1,automatic=false)=>{
    const s=get(),tracks=LISTENING.filter(t=>t.format===kind),current=tracks.findIndex(t=>t.id===s[kind]?.id)
    let index=(current+direction+tracks.length)%tracks.length
    if(automatic&&s.mode==='repeat')index=Math.max(0,current)
    if(s.mode==='shuffle'&&tracks.length>1){const step=1+Math.floor(Math.random()*(tracks.length-1));index=(Math.max(0,current)+step)%tracks.length}
    s.play(kind,tracks[index].id)
  },
  update:(kind,values)=>{const current=get()[kind];if(current)set({[kind]:{...current,...values}})},
}))
