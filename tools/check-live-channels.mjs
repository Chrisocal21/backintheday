// Find the current live video for each official 24/7 YouTube channel and save it to src/media/live.json.
// Live streams get new video ids when a broadcaster restarts them, so re-run this now and then:
//   node tools/check-live-channels.mjs
// Channels that aren't live right now are skipped (and reported).
import { writeFile } from 'node:fs/promises'

const CHANNELS = [
  ['UCLA_DiR1FfKNvjuUpBHmylQ', 'NASA Live', 'Space'],
  ['UCSJ4gkVC6NrvII8umztf0Ow', 'Lofi Girl Radio', 'Chill radio'],
  ['UCoMdktPbSTixAyNGwb-UYkQ', 'Sky News', 'Live news'],
  ['UCBi2mrWuNuyYy4gbM6fU18Q', 'ABC News Live', 'Live news'],
  ['UCeY0bbntWzzVIaj2z3QigXg', 'NBC News NOW', 'Live news'],
  ['UC16niRr50-MSBwiO3YDb3RA', 'BBC News', 'Live news'],
  ['UCIALMKvObZNtJ6AmdCLP7Lg', 'Bloomberg TV', 'Business news'],
  ['UCvJJ_dzjViJCoLf5uKUTwoA', 'CNBC', 'Business news'],
  ['UCSrZ3UV4jOidv8ppoVuvW9Q', 'Euronews', 'World news'],
  ['UCNye-wNBqNL5ZzHSJj3l8Bg', 'Al Jazeera English', 'World news'],
  ['UCknLrEdhRCp1aegoMqRaCZg', 'DW News', 'World news'],
  ['UCQfwfsi5VrQ8yKZ-UWmAEFg', 'France 24 English', 'World news'],
  ['UCupvZG-5ko_eiXAupbDfxWw', 'CNN', 'Live news'],
  ['UC8p1vwvWtl6T73JiExfWs1g', 'CBS News 24/7', 'Live news'],
]
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'en' }
const today = new Date().toISOString().slice(0, 10)
const out = []
for (const [ch, name, genre] of CHANNELS) {
  try {
    const html = await fetch(`https://www.youtube.com/channel/${ch}/live`, { headers: UA, signal: AbortSignal.timeout(20000) }).then((r) => r.text())
    const id = (html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/) || [])[1]
    const live = /"isLiveNow":true/.test(html) || /"isLive":true/.test(html)
    if (!id || !live) { console.log('not live  ', name); continue }
    const oe = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id)).then((r) => (r.ok ? r.json() : null))
    if (!oe) { console.log('no embed  ', name, id); continue }
    out.push({ id: 'live-' + ch, title: name, kind: 'live', genre, era: 'Now', year: 'LIVE', playback: 'youtube', url: id, source: `https://www.youtube.com/channel/${ch}/live`, credit: `${oe.author_name} / official YouTube live stream`, note: oe.title, verified: today })
    console.log('LIVE      ', name, id, '-', oe.title.slice(0, 60))
  } catch (e) { console.log('error     ', name, String(e.message).slice(0, 60)) }
}
// ---- 24/7 marathons and live sports, found by search. Only VERIFIED channels (the rights holder),
// and only streams that are live now with "24/7"/"LIVE" in the title. Edit queries to taste.
const SEARCHES = [
  // [genre, query]
  ['Sports', 'sports live 24/7'], ['Sports', 'soccer live free 24/7'], ['Sports', 'NFL live 24/7'], ['Sports', 'NBA live stream 24/7'],
  ['Sports', 'MLB 24/7 live'], ['Sports', 'NHL 24/7 live'], ['Sports', 'wrestling 24/7 live'], ['Sports', 'MMA boxing 24/7 live'],
  ['Sports', 'motorsport racing 24/7 live'], ['Sports', 'golf tennis 24/7 live'], ['Sports', 'skate surf extreme sports 24/7 live'],
  ['Reruns', '24/7 classic tv show full episodes'], ['Reruns', '90s tv show full episodes live 24/7'], ['Reruns', '2000s tv show full episodes live 24/7'],
  ['Reruns', 'sitcom full episodes live 24/7'], ['Reruns', 'game show full episodes 24/7'], ['Reruns', 'reality tv full episodes 24/7 live'],
  ['Reruns', 'true crime full episodes 24/7 live'], ['Reruns', 'cooking show full episodes 24/7 live'], ['Reruns', 'bob ross 24/7'],
  ['Cartoons', '90s cartoons full episodes live 24/7'], ['Cartoons', '80s cartoons full episodes live 24/7'], ['Cartoons', '2000s cartoon full episodes live 24/7'],
  ['Cartoons', 'power rangers 24/7'], ['Cartoons', 'anime full episodes 24/7 live'], ['Cartoons', 'kids cartoon full episodes 24/7 live'],
  ['Retro games', 'retro video game longplay 24/7 live'],
  ['Music', 'music video channel 24/7 live'], ['Music', '80s music 24/7 live'], ['Music', '90s music 24/7 live'], ['Music', 'jazz radio 24/7 live'],
  ['Nature', 'nature live cam 24/7'], ['Nature', 'aquarium live cam'], ['Space', 'space live 24/7'],
]
const seen = new Set(out.map((o) => o.url))
for (const [genre, q] of SEARCHES) {
  try {
    await new Promise((r) => setTimeout(r, 2500)) // be polite; YouTube refuses rapid-fire searches
    let html = ''
    for (let i = 0; i < 3 && !html; i++) {
      try { html = await fetch('https://www.youtube.com/results?sp=EgJAAQ%253D%253D&search_query=' + encodeURIComponent(q), { headers: UA, signal: AbortSignal.timeout(20000) }).then((r) => r.text()) }
      catch { await new Promise((r) => setTimeout(r, 8000 * (i + 1))) }
    }
    const data = JSON.parse(html.match(/var ytInitialData = (\{.*?\});<\/script>/s)[1])
    const found = []
    const walk = (o) => { if (!o || typeof o !== 'object') return; if (o.videoRenderer) found.push(o.videoRenderer); for (const k in o) walk(o[k]) }
    walk(data)
    let kept = 0
    for (const v of found) {
      const title = v.title?.runs?.map((r) => r.text).join('') ?? '', ch = v.ownerText?.runs?.[0]?.text ?? '', chId = v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
      const verified = (v.ownerBadges || []).some((b) => /VERIFIED/.test(b.metadataBadgeRenderer?.style ?? ''))
      const isLive = (v.badges || []).some((b) => /LIVE/.test(JSON.stringify(b))) || /LIVE/i.test(JSON.stringify(v.thumbnailOverlays ?? ''))
      if (!verified || !isLive || seen.has(v.videoId) || !/24\/7|live|marathon|non-?stop|all day|24 hours/i.test(title)) continue
      seen.add(v.videoId); kept++
      const clean = title.replace(/[🔴⚡️✨🎄🦃🏕️🔮🌺🏝️🌊💙☀🏡🤠🚲🎖️🟢💥🕷️🕸️🤖🦖🚨🕹️🔥🎶]/gu, '').replace(/\s+/g, ' ').trim()
      out.push({ id: 'live-' + v.videoId, title: clean.slice(0, 90), kind: 'live', genre, era: 'Now', year: 'LIVE', playback: 'youtube', url: v.videoId, source: chId ? `https://www.youtube.com/channel/${chId}` : 'https://www.youtube.com/watch?v=' + v.videoId, credit: `${ch} / official YouTube live stream`, note: 'Verified channel live stream (24/7 marathon or live broadcast).', verified: today })
    }
    console.log(`search    ${genre.padEnd(11)} ${q} → ${kept}`)
  } catch (e) { console.log('search err', q, String(e.message).slice(0, 60)) }
}
await writeFile('src/media/live.json', JSON.stringify(out, null, 2) + '\n')
console.log(`\nSaved ${out.length} live channels to src/media/live.json`)
