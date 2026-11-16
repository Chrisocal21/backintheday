import { SPOKEN_TAPES } from './spoken'
import harvest from './harvest.json' // node tools/harvest-free-media.mjs
export type ListeningKind='record'|'tape'|'ipod' // ipod plays every music track (format 'record')
export type Track={id:string;title:string;creator:string;genre:string;era:string;format:ListeningKind;url:string;source:string;license:string;licenseUrl:string;verified:string;duration?:number;note:string;album?:string;cover?:string;track?:number}
const songs:[string,string,string][]=[
  ['Local Forecast','Lounge','90s'],['Airport Lounge','Lounge','70s'],['Bossa Antigua','Bossa nova','70s'],
  ['George Street Shuffle','Jazz','70s'],['Lobby Time','Lounge','90s'],['AcidJazz','Jazz','90s'],
  ['Night on the Docks','Jazz','70s'],['Easy Lemon','Easy listening','2000s'],['Dream Culture','Ambient','80s'],
  ['Carefree','Acoustic','2000s'],['Night on the Docks - Sax','Jazz','70s'],
]
export const LISTENING:Track[]=[
  ...songs.map(([title,genre,era],i)=>({
    id:`km-${i+1}`,title,genre,era,creator:'Kevin MacLeod',format:'record' as const,
    url:`https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(title)}.mp3`,
    source:`https://incompetech.com/music/royalty-free/index.html?Search=Search&title=${encodeURIComponent(title)}`,
    license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',verified:'2026-11-15',
    note:'Modern recording selected for its era mood. Credit: '+title+' by Kevin MacLeod (incompetech.com), licensed CC BY 4.0. Unmodified recording.',
  })),
  ...SPOKEN_TAPES,
  ...(harvest as Track[]),
]
