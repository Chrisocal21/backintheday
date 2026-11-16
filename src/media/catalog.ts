import seed from './catalog.json'
import { FILMS } from '../library'
import type { MediaItem } from './types'
export const BUNDLED_MEDIA:MediaItem[]=[...(seed as MediaItem[]),...FILMS.map(f=>({id:'vhs-'+f.id,title:f.title,kind:'movie' as const,genre:f.category,year:f.year,era:f.year.slice(0,3)+'0s',playback:'video' as const,url:f.url,source:f.source,credit:f.credit,note:'From the original VHS shelf. Source credits supplied with the recording.',verified:'2026-11-15'}))]
export async function fetchMediaCatalog(signal?:AbortSignal){
  const response=await fetch('/api/catalog?limit=200',{signal})
  if(!response.ok)throw new Error('Catalog service unavailable')
  const result=await response.json()
  if(!Array.isArray(result.items)||result.items.some((i:MediaItem)=>!i.id||!i.title||!['youtube','video','external'].includes(i.playback)))throw new Error('Invalid catalog')
  const known=new Set(result.items.map((i:MediaItem)=>i.id))
  return [...result.items,...BUNDLED_MEDIA.filter(i=>!known.has(i.id))] as MediaItem[]
}
