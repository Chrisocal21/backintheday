export type YouTubePlayer = {setVolume:(v:number)=>void;playVideo:()=>void;pauseVideo:()=>void;destroy:()=>void;seekTo?:(time:number,allowSeekAhead:boolean)=>void;getCurrentTime?:()=>number;getDuration?:()=>number}
type Options={host:string;videoId:string;playerVars:Record<string,string|number>;events:{onReady:(e:{target:YouTubePlayer})=>void;onStateChange?:(e:{data:number})=>void;onError:()=>void;onAutoplayBlocked:()=>void}}
type API={Player:new(element:HTMLDivElement,options:Options)=>YouTubePlayer}
declare global {interface Window { YT?:API;onYouTubeIframeAPIReady?:()=>void }}
let pending:Promise<API>|undefined
export function youtubeAPI():Promise<API> {
  if(window.YT?.Player)return Promise.resolve(window.YT)
  if(pending)return pending
  pending=new Promise<API>((resolve,reject)=>{
    const old=window.onYouTubeIframeAPIReady
    const timer=setTimeout(()=>reject(new Error('TV player did not load')),15000)
    window.onYouTubeIframeAPIReady=()=>{old?.();clearTimeout(timer);if(window.YT)resolve(window.YT);else reject(new Error('TV player unavailable'))}
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>{clearTimeout(timer);reject(new Error('TV player unavailable'))};document.head.append(script)
  }).catch(error=>{pending=undefined;throw error})
  return pending!
}
