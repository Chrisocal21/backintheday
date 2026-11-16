import seed from './catalog.json'
import harvest from './harvest.json' // node tools/harvest-free-media.mjs
import { FILMS } from '../library'
import type { MediaItem } from './types'
import { LIVE_CHANNELS } from './cable'
// Same film/show often arrives from several sources (curated seed, harvest, VHS shelf).
// Keep the first one per normalized title (and per URL) so the guide never lists duplicates.
export const titleKey=(t:string)=>t.toLowerCase().replace(/\(.*?\)|\[.*?\]/g,'').replace(/\b(the|a|an|public domain|full movie|episodes?|hd|1080p|720p)\b/g,'').replace(/\b(19|20)\d\d\b/g,'').replace(/[^a-z0-9]+/g,'')
function dedupe(items:MediaItem[]){
  const seen=new Set<string>()
  return items.filter(i=>{const keys=[titleKey(i.title)||i.id,i.url];if(keys.some(k=>seen.has(k)))return false;keys.forEach(k=>seen.add(k));return true})
}
export const BUNDLED_MEDIA:MediaItem[]=dedupe([...LIVE_CHANNELS,...(seed as MediaItem[]),...FILMS.map(f=>({id:'vhs-'+f.id,title:f.title,kind:'movie' as const,genre:f.category,year:f.year,era:f.year.slice(0,3)+'0s',playback:'video' as const,url:f.url,source:f.source,credit:f.credit,note:'From the original VHS shelf. Source credits supplied with the recording.',verified:'2026-11-15'})),...(harvest as MediaItem[])])
export async function fetchMediaCatalog(signal?:AbortSignal){
  const response=await fetch('/api/catalog?limit=200',{signal})
  if(!response.ok)throw new Error('Catalog service unavailable')
  const result=await response.json()
  if(!Array.isArray(result.items)||result.items.some((i:MediaItem)=>!i.id||!i.title||!['youtube','video','external'].includes(i.playback)))throw new Error('Invalid catalog')
  const known=new Set(result.items.map((i:MediaItem)=>i.id))
  return dedupe([...result.items,...BUNDLED_MEDIA.filter(i=>!known.has(i.id))] as MediaItem[])
}
