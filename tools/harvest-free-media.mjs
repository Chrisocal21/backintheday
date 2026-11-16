#!/usr/bin/env node
// Harvest free-to-use media from the Internet Archive into the project's catalogs.
//
// Only items whose archive metadata carries an explicit license mark are accepted:
//   public domain (publicdomain/mark or zero) or Creative Commons BY / BY-SA.
// NonCommercial (NC) and NoDerivatives (ND) are skipped unless --allow-nc / --allow-nd.
// Review the output before publishing. "Marked public domain on archive.org" is the
// uploader's claim; rights can differ outside the USA.
//
// Usage:
//   node tools/harvest-free-media.mjs                    # all categories, 40 items each
//   node tools/harvest-free-media.mjs --per 100 --only movies,cartoons
//   node tools/harvest-free-media.mjs --download         # also save files for offline use (large!)
//
// Writes:  src/media/harvest.json      (movies, TV, cartoons, shorts → TV program guide)
//          src/listening/harvest.json  (music → records, old radio → tapes)
import { writeFile, mkdir, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const opt = (name, def) => { const i = args.indexOf('--' + name); return i < 0 ? def : args[i + 1] }
const has = (name) => args.includes('--' + name)
const PER = Number(opt('per', 40))
const ONLY = opt('only', '')?.split(',').filter(Boolean)
const DOWNLOAD = has('download')
const ALLOW_NC = has('allow-nc'), ALLOW_ND = has('allow-nd')
const TODAY = new Date().toISOString().slice(0, 10)
const UA = { 'User-Agent': 'BackInTheDay-MediaHarvest/1.0 (catalog of public-domain and CC media)' }

const CATEGORIES = {
  movies:   { q: 'collection:feature_films AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Feature film' },
  scifi:    { q: 'collection:SciFi_Horror AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Sci-fi & horror' },
  noir:     { q: 'collection:film_noir AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Film noir' },
  silent:   { q: 'collection:silent_films AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Silent film' },
  comedy:   { q: 'collection:Comedy_Films AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Comedy' },
  tv:       { q: 'collection:classic_tv AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Classic TV' },
  ads:      { q: 'collection:classic_tv_commercials AND mediatype:movies', target: 'video', kind: 'movie', genre: 'TV commercials' },
  cartoons: { q: 'collection:classic_cartoons AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Cartoons' },
  shorts:   { q: 'collection:prelinger AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Archive short' },
  news:     { q: 'collection:newsandpublicaffairs AND mediatype:movies', target: 'video', kind: 'movie', genre: 'Newsreel' },
  noir2:    { q: 'mediatype:movies AND subject:"film noir"', target: 'video', kind: 'movie', genre: 'Film noir' },
  western:  { q: 'mediatype:movies AND (subject:western OR subject:westerns OR subject:cowboy)', target: 'video', kind: 'movie', genre: 'Westerns' },
  sports:   { q: 'mediatype:movies AND (subject:baseball OR subject:football OR subject:boxing OR subject:sports OR subject:olympics OR subject:basketball)', target: 'video', kind: 'movie', genre: 'Vintage sports' },
  sitcom:   { q: 'mediatype:movies AND (subject:sitcom OR subject:"situation comedy" OR subject:"tv comedy")', target: 'video', kind: 'movie', genre: 'Classic TV' },
  tvshows:  { q: 'mediatype:movies AND (subject:"tv series" OR subject:"television series" OR subject:"old tv")', target: 'video', kind: 'movie', genre: 'Classic TV' },
  musicals: { q: 'mediatype:movies AND (subject:musical OR subject:musicals)', target: 'video', kind: 'movie', genre: 'Musicals' },
  kids:     { q: 'mediatype:movies AND (subject:"children\'s films" OR subject:"kids tv" OR subject:"children")', target: 'video', kind: 'movie', genre: 'Cartoons' },
  music:    { q: 'collection:netlabels AND mediatype:audio', target: 'audio', format: 'record', genre: 'Netlabel music' },
  radio:    { q: 'collection:oldtimeradio AND mediatype:audio', target: 'audio', format: 'tape', genre: 'Old-time radio' },
  books:    { q: 'collection:librivoxaudio AND mediatype:audio', target: 'audio', format: 'tape', genre: 'Audiobook' },
  music2:   { q: 'collection:opensource_audio AND mediatype:audio AND (subject:music OR subject:rock OR subject:jazz OR subject:electronic)', target: 'audio', format: 'record', genre: 'Free music' },
  // Full albums (tracks: up to 30 per album). nc: music licensed CC BY-NC is allowed for this
  // non-commercial hangout; switch to false (or drop these) if the project ever becomes commercial.
  fma:      { q: 'collection:freemusicarchive AND mediatype:audio', target: 'audio', format: 'record', genre: 'Free Music Archive', tracks: 30, nc: true, per: 60 },
  jamendo:  { q: 'collection:jamendo-albums AND mediatype:audio', target: 'audio', format: 'record', genre: 'Jamendo', tracks: 30, nc: true, per: 60 },
  netalbums:{ q: 'collection:netlabels AND mediatype:audio', target: 'audio', format: 'record', genre: 'Netlabel', tracks: 30, nc: true, per: 60 },
  jazz:     { q: 'mediatype:audio AND collection:opensource_audio AND (subject:jazz OR subject:blues OR subject:soul OR subject:funk)', target: 'audio', format: 'record', genre: 'Jazz & soul', tracks: 30, nc: true, per: 60 },
  rock:     { q: 'mediatype:audio AND collection:opensource_audio AND (subject:rock OR subject:punk OR subject:indie OR subject:metal)', target: 'audio', format: 'record', genre: 'Rock & indie', tracks: 30, nc: true, per: 60 },
  electro:  { q: 'mediatype:audio AND collection:opensource_audio AND (subject:electronic OR subject:techno OR subject:ambient OR subject:"hip hop")', target: 'audio', format: 'record', genre: 'Electronic & hip hop', tracks: 30, nc: true, per: 60 },
}

// Server-side: "has any license". The strict allow-list is applied per item in licenseOk().
const LICENSE_Q = 'licenseurl:*'
function licenseOk(url, nc = false) {
  const r = licenseCheck(url, nc); return r
}
function licenseCheck(url, nc) {
  const u = String(url || '').toLowerCase()
  if (!u) return null
  if (u.includes('publicdomain')) return { name: u.includes('zero') ? 'CC0' : 'Public domain', url: u }
  const m = u.match(/licenses\/(by(?:-sa|-nc|-nd|-nc-sa|-nc-nd)?)\/([\d.]+)/)
  if (!m) return null
  if (m[1].includes('nc') && !ALLOW_NC && !nc) return null
  if (m[1].includes('nd') && !ALLOW_ND) return null
  return { name: `CC ${m[1].toUpperCase()} ${m[2]}`, url: u }
}

async function getJSON(url, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (i >= tries - 1) throw e; await new Promise((res) => setTimeout(res, 1500 * (i + 1))) }
  }
}

async function pool(items, n, fn) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const j = i++; out[j] = await fn(items[j]).catch((e) => { console.log('  skip', items[j], String(e.message).slice(0, 80)); return null }) } }))
  return out.filter(Boolean)
}

// Keep the room cozy: skip titles/descriptions matching these words. Edit to taste.
const SKIP = /\b(sex|nude|nudity|erotic|burlesque|stripper|adults? only|exploitation|marihuana|marijuana|reefer|cocaine|propaganda)\b/i
const yearOf = (md) => (String(md.year || md.date || '').match(/\b(1[89]\d\d|20\d\d)\b/) || [''])[0]
const eraOf = (y) => { const n = parseInt(y, 10); return n ? `${String(n).slice(0, 3)}0s` : 'Classic' }
const f0 = (s) => (Array.isArray(s) ? s[0] : s)
const clean = (s, max = 200) => String(Array.isArray(s) ? s[0] : s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

async function search(cat) {
  const q = `${cat.q} AND ${LICENSE_Q}`
  const url = 'https://archive.org/advancedsearch.php?' + new URLSearchParams({ q, rows: String(PER * 2), output: 'json', 'sort[]': 'downloads desc' }).toString() + '&fl[]=identifier'
  const res = await getJSON(url)
  if (!res.response) throw new Error('search failed: ' + JSON.stringify(res).slice(0, 200))
  return res.response.docs.map((d) => d.identifier)
}

async function videoItem(id, cat) {
  const meta = await getJSON('https://archive.org/metadata/' + id)
  const md = meta.metadata || {}
  const lic = licenseOk(md.licenseurl)
  if (!lic) return null
  if (SKIP.test(clean(md.title) + ' ' + clean(md.description, 600) + ' ' + clean(md.subject))) return null
  const files = (meta.files || []).filter((f) => /\.mp4$/i.test(f.name) && Number(f.size || 0) > 500000 && !/trailer|sample/i.test(f.name))
  if (!files.length) return null
  files.sort((a, b) => (/512kb/i.test(a.name) ? 0 : 1) - (/512kb/i.test(b.name) ? 0 : 1) || Number(a.size) - Number(b.size))
  const f = files[0]
  const year = yearOf(md)
  return {
    id: 'ia-' + slug(id), title: clean(md.title, 120) || id, kind: cat.kind, genre: cat.genre, year, era: eraOf(year),
    playback: 'video', url: `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`,
    source: `https://archive.org/details/${id}`, credit: `${clean(md.creator, 80) || 'Original creators'} · ${lic.name}`,
    note: `Harvested from the Internet Archive; item marked ${lic.name} (${lic.url}). Verify before public release.`,
    verified: TODAY, _bytes: Number(f.size || 0),
  }
}

async function audioItems(id, cat) {
  const meta = await getJSON('https://archive.org/metadata/' + id)
  const md = meta.metadata || {}
  const lic = licenseOk(md.licenseurl, cat.nc)
  if (!lic) return []
  if (SKIP.test(clean(md.title) + ' ' + clean(md.description, 600))) return []
  // Prefer the uploader's own mp3s; fall back to archive-made copies. Up to 3 tracks per album/show.
  const mp3 = (meta.files || []).filter((f) => /\.mp3$/i.test(f.name))
  const orig = mp3.filter((f) => f.source === 'original')
  const tracks = (orig.length ? orig : mp3).sort((a, b) => (Number(a.track) || 0) - (Number(b.track) || 0) || a.name.localeCompare(b.name)).slice(0, cat.tracks ?? 3)
  const year = yearOf(md)
  const album = clean(f0(md.title), 100)
  const img = (meta.files || []).find((f) => /\.(jpe?g|png)$/i.test(f.name) && !/thumb/i.test(f.name))
  return tracks.map((f, i) => ({
    id: `ia-${slug(id)}-${i}`, title: clean(f.title || md.title, 120) || f.name, creator: clean(f.artist || md.creator, 80) || 'Unknown artist',
    album, cover: img ? `https://archive.org/download/${id}/${encodeURIComponent(img.name)}` : `https://archive.org/services/img/${id}`, track: i + 1,
    genre: cat.genre, era: eraOf(year), format: cat.format,
    url: `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`, source: `https://archive.org/details/${id}`,
    license: lic.name, licenseUrl: lic.url, verified: TODAY,
    note: `Harvested from the Internet Archive (${clean(md.title, 80)}). Credit the creator; license ${lic.name}.`,
    _bytes: Number(f.size || 0),
  }))
}

async function download(item, folder) {
  const name = decodeURIComponent(item.url.split('/').pop())
  const dir = path.join('public', 'offline', folder)
  await mkdir(dir, { recursive: true })
  const dest = path.join(dir, `${item.id}${path.extname(name)}`)
  try { await stat(dest); } catch {
    const r = await fetch(item.url, { headers: UA })
    if (!r.ok || !r.body) throw new Error('download HTTP ' + r.status)
    await pipeline(Readable.fromWeb(r.body), createWriteStream(dest))
  }
  item.remoteUrl = item.url
  item.url = '/' + path.posix.join('offline', folder, path.basename(dest))
}

const video = [], audio = []
for (const [name, cat] of Object.entries(CATEGORIES)) {
  if (ONLY?.length && !ONLY.includes(name)) continue
  console.log(`\n== ${name}: searching ==`)
  const ids = await search(cat)
  if (cat.target === 'video') {
    const items = (await pool(ids, 6, (id) => videoItem(id, cat))).slice(0, PER)
    video.push(...items); console.log(`  kept ${items.length}`)
  } else {
    const items = (await pool(ids.slice(0, cat.per ?? PER), 6, (id) => audioItems(id, cat))).flat()
    audio.push(...items); console.log(`  kept ${items.length} tracks`)
  }
}

// ---- Music videos: official uploads played through YouTube's own embed (publisher-controlled).
// Not free-licensed media; it plays because the publisher allows embedding. Each id is checked
// with YouTube oEmbed and dropped if missing or not embeddable. Add ids here: [id, era].
const MUSIC_VIDEOS = [
  // 70s
  ['fJ9rUzIMcZQ', '70s'], ['Gs069dndIYk', '70s'], ['fNFzfwLM72c', '70s'], ['btPJPFnesV4', '80s'], ['I_izvAbhExY', '70s'], ['HgzGwKwLmgM', '70s'], ['xFrGuyw1V8s', '70s'], ['ZbZSe6N_BXs', '70s'], ['UelDrZ1aFeY', '70s'], ['QYEC4TZsy-Y', '70s'],
  // 80s
  ['djV11Xbc914', '80s'], ['dQw4w9WgXcQ', '80s'], ['FTQbiNvZqaY', '80s'], ['sOnqjkJTMaA', '80s'], ['lDK9QqIzhwk', '80s'], ['Zi_XLOBDo_Y', '80s'], ['1w7OgIMMRc4', '80s'], ['CdqoNKCCt7A', '80s'], ['9jK-NcRmVcw', '80s'], ['OMOGaugKpzs', '80s'], ['PIb6AZdTr-A', '80s'], ['aGCdLKXNF3w', '80s'], ['rY0WxgSXdEE', '80s'], ['Rbm6GXllBiw', '80s'], ['YR5ApYxkU-U', '80s'], ['5NV6Rdv1a3I', '2010s'],
  // 90s
  ['hTWKbfoikeg', '90s'], ['4fndeDfaWCg', '90s'], ['vabnZ9-ex7o', '90s'], ['3JWTaaS7LdU', '90s'], ['fPO76Jlnz6c', '90s'], ['bx1Bh8ZvH84', '90s'], ['XFkzRNyygfk', '90s'], ['xwtdhWltSIg', '90s'], ['4aeETEoNfOg', '90s'], ['ks_qOI0lzho', '90s'], ['1lyu1KKwC74', '90s'], ['CD-E-LDc384', '90s'], ['v2AC41dglnM', '90s'], ['C-u5WLJ9Yk4', '90s'], ['6Ejga4kJUts', '90s'], ['Ju8Hr50Ckwk', '90s'], ['n4RjJKxsamQ', '90s'], ['gJLIiF15wjQ', '90s'], ['8SbUC-UaAxE', '90s'], ['Kd3YqJgmUYo', '90s'],
  // 2000s
  ['04mfKJWDSzI', '2000s'], ['PWgvGjAhvIw', '2000s'], ['eVTXPUF4Oz4', '2000s'], ['K7l5ZeVVoCA', '2000s'], ['kXYiU_JCYtU', '2000s'], ['YVkUvmDQ3HY', '2000s'], ['_Yhyp-_hX2s', '2000s'], ['1lWJXDG2i0A', '2000s'], ['gGdGFtwCNBE', '2000s'], ['uelHwf8o7_U', '2000s'], ['8UVNT4wvIGY', '2010s'], ['rYEDA3JcQqw', '2010s'], ['OPf0YbXqDm0', '2010s'], ['JGwWNGJdvx8', '2010s'], ['RgKAFK5djSk', '2010s'], ['hT_nvWreIhg', '2010s'], ['ktvTqknDobU', '2010s'], ['7wtfhZwyrcc', '2010s'], ['e-ORhEE9VVg', '2010s'], ['nfWlot6h_JM', '2010s'], ['09R8_2nJtjg', '2010s'], ['CevxZvSJLk8', '2010s'], ['YQHsXMglC9A', '2010s'], ['kJQP7kiw5Fk', '2010s'], ['9bZkp7q19f0', '2010s'], ['pRpeEdMmmQ0', '2010s'], ['QK8mJJJvaes', '2010s'], ['2Vv-BfVoq4g', '2010s'], ['60ItHLz5WEA', '2010s'],
]
async function musicVideo([id, era]) {
  const url = 'https://www.youtube.com/watch?v=' + id
  const meta = await getJSON('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url), 1)
  return { id: 'yt-' + id, title: clean(meta.title, 120), kind: 'music-video', genre: 'Music videos', year: '', era, playback: 'youtube', url: id, source: url, credit: clean(meta.author_name, 80) + ' / official YouTube player', note: 'Publisher-hosted video in the official YouTube player. Availability is controlled by YouTube and the publisher.', verified: TODAY }
}
if (!ONLY?.length || ONLY.includes('musicvideos')) {
  console.log('\n== music videos: checking ==')
  const mv = await pool(MUSIC_VIDEOS, 6, musicVideo)
  video.push(...mv); console.log(`  kept ${mv.length} of ${MUSIC_VIDEOS.length}`)
}

// Drop duplicates (same id, same file, or same normalized title from different uploads).
const titleKey = (t) => t.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/\b(the|a|an|public domain|full movie|episodes?|hd|1080p|720p)\b/g, '').replace(/\b(19|20)\d\d\b/g, '').replace(/[^a-z0-9]+/g, '')
const dedupe = (arr) => { const seen = new Set(); return arr.filter((x) => { const keys = [x.id, x.url, (x.format ?? '') + titleKey(x.title) + (x.creator ?? '')]; if (keys.some((k) => seen.has(k))) return false; keys.forEach((k) => seen.add(k)); return true }) }
const vids = dedupe(video), auds = dedupe(audio)
if (DOWNLOAD) {
  const gb = (vids.concat(auds).reduce((s, x) => s + (x._bytes || 0), 0) / 1e9).toFixed(1)
  console.log(`\nDownloading ${vids.length + auds.length} files (~${gb} GB) to public/offline/ ...`)
  await pool(vids, 3, (x) => download(x, 'video'))
  await pool(auds, 4, (x) => download(x, 'audio'))
}
for (const x of [...vids, ...auds]) delete x._bytes
await writeFile('src/media/harvest.json', JSON.stringify(vids, null, 2) + '\n')
await writeFile('src/listening/harvest.json', JSON.stringify(auds, null, 2) + '\n')
const count = (arr, key) => arr.reduce((m, x) => ((m[x[key]] = (m[x[key]] || 0) + 1), m), {})
console.log('\nSaved src/media/harvest.json:', vids.length, count(vids, 'genre'))
console.log('Saved src/listening/harvest.json:', auds.length, count(auds, 'genre'))
