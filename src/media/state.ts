import { create } from 'zustand'
import { useStore } from '../store'
import { usePreferences } from '../preferences'
import { useLibraryShelf } from '../libraryShelf'
import type { MediaItem } from './types'
import { CABLE, tuneCable } from './cable'
import { BUNDLED_MEDIA } from './catalog'
/** Show ended on a cable channel → the next scheduled show comes on. */
export function nextOnCable(){const w=useStore.getState().watchItem;if(w?.cable)playMedia({...w,url:'',playback:'video'},{keepView:true})}
export type WatchView='room'|'lounge'|'screen'
export const useMediaHub=create<{open:boolean;view:WatchView;time:number;duration:number;notice:string}>(()=>({open:false,view:'room',time:0,duration:0,notice:''}))
export function openMediaHub(){useMediaHub.setState({open:true});useStore.setState({electronics:null,menuOpen:false,locked:false});document.exitPointerLock()}
export function closeMediaHub(){useMediaHub.setState({open:false});if(useMediaHub.getState().view==='room')useStore.setState({locked:true})}
export function watchView(view:WatchView){
  useMediaHub.setState({view,notice:''});useStore.setState({locked:view==='room',electronics:null});document.exitPointerLock()
  if(view==='room'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})
}
export function playMedia(item:MediaItem,opts:{keepView?:boolean}={}){
  if(item.playback==='external')return
  // A Basement Cable channel card: tune to whatever is "on" right now, mid-show.
  if(item.cable&&!item.url){const c=CABLE.find(x=>x.id===item.cable);const on=c&&tuneCable(c,BUNDLED_MEDIA);if(!on)return;item=on}
  usePreferences.getState().change('tvPower',true)
  useStore.setState({watchItem:item,filmId:null,channel:-1,customId:null,input:'tv',playingGame:false,mediaPaused:false,noSignal:false,electronics:null,menuOpen:false,locked:false,osdAt:performance.now()})
  useLibraryShelf.getState().remember('watch:'+item.id)
  useMediaHub.setState({open:false,time:0,duration:0,notice:''})
  if(opts.keepView){if(useMediaHub.getState().view==='room')useStore.setState({locked:true})}
  else if(useMediaHub.getState().view==='room')watchView('lounge')
}
let host:HTMLDivElement|undefined
export function getPlaybackHost(){
  if(!host){host=document.createElement('div');host.className='shared-playback-host';Object.assign(host.style,{width:'100%',height:'100%',position:'relative',background:'#000'})}
  return host
}
