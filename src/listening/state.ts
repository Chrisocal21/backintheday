import { create } from 'zustand'
import { LISTENING,type ListeningKind,type Track } from './catalog'
import { useLibraryShelf } from '../libraryShelf'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
export type Playback={id:string;playing:boolean;time:number;duration:number;error:string;request:number}
/** Which tracks a player can play: the iPod holds every music track; record/tape their own shelves. */
export const tracksFor=(kind:ListeningKind):Track[]=>LISTENING.filter(t=>kind==='ipod'?t.format==='record':t.format===kind)
type State={record:Playback|null;tape:Playback|null;ipod:Playback|null;mode:'next'|'repeat'|'shuffle'
  /** Optional play queue (an album, an artist, shuffle) per player; falls back to the whole shelf. */
  queue:Partial<Record<ListeningKind,string[]>>
  play:(kind:ListeningKind,id:string,queue?:string[])=>void;toggle:(kind:ListeningKind)=>void;stop:(kind:ListeningKind)=>void;next:(kind:ListeningKind,direction?:1|-1,automatic?:boolean)=>void;update:(kind:ListeningKind,values:Partial<Playback>)=>void}
export const useListening=create<State>((set,get)=>({
  record:null,tape:null,ipod:null,mode:'next',queue:{},
  play:(kind,id,queue)=>{
    const track=tracksFor(kind).find(t=>t.id===id);if(!track)return
    if(kind==='record')useStore.setState({recordPlaying:false})
    else if(kind==='tape')usePreferences.getState().change('cassettePlaying',false)
    set({[kind]:{id,playing:true,time:0,duration:track.duration??0,error:'',request:(get()[kind]?.request??0)+1},...(queue?{queue:{...get().queue,[kind]:queue}}:{})} as Partial<State>)
    useLibraryShelf.getState().remember(`audio:${kind}:${id}`)
  },
  toggle:kind=>{const current=get()[kind];if(current)set({[kind]:{...current,playing:!current.playing,error:''}} as Partial<State>)},
  stop:kind=>set({[kind]:null} as Partial<State>),
  next:(kind,direction=1,automatic=false)=>{
    const s=get(),ids=s.queue[kind]?.length?s.queue[kind]!:tracksFor(kind).map(t=>t.id),current=ids.indexOf(s[kind]?.id??'')
    if(!ids.length)return
    let index=(current+direction+ids.length)%ids.length
    if(automatic&&s.mode==='repeat')index=Math.max(0,current)
    if(s.mode==='shuffle'&&ids.length>1){const step=1+Math.floor(Math.random()*(ids.length-1));index=(Math.max(0,current)+step)%ids.length}
    s.play(kind,ids[index])
  },
  update:(kind,values)=>{const current=get()[kind];if(current)set({[kind]:{...current,...values}} as Partial<State>)},
}))
