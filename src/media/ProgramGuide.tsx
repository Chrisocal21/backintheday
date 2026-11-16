import { useEffect, useMemo, useState } from 'react'
import { BUNDLED_MEDIA } from './catalog'
import { closeMediaHub, playMedia, useMediaHub } from './state'
import { groupRows, type GuideRow } from './series'
import { resolveLink } from './links'
import type { MediaItem } from './types'
import { CABLE, cableCard } from './cable'
import { channelNumberOf, tune } from './lineup'

// The TV program guide, organized three ways so big lists stay easy:
//   1. Tabs (Live TV, Movies, TV shows, Cartoons, Sports, Music videos, Shorts, Old commercials)
//   2. Filter chips inside each tab: genre (News, Sports, Reruns… / Westerns, Noir…) and decade
//   3. Series collapse into collections ("The Lucy Show · 26 episodes")
// Pick anything and it plays on the TV right away.
const tabOf = (i: MediaItem) =>
  i.kind === 'live' ? 'Live TV' : i.kind === 'music-video' ? 'Music videos'
  : /cartoon/i.test(i.genre) ? 'Cartoons' : /commercial/i.test(i.genre) ? 'Old commercials'
  : /sport/i.test(i.genre) ? 'Sports' : /tv|episode/i.test(i.genre) ? 'TV shows'
  : /short|newsreel/i.test(i.genre) ? 'Shorts' : 'Movies'
const TABS = ['Live TV', 'Movies', 'TV shows', 'Cartoons', 'Sports', 'Music videos', 'Shorts', 'Old commercials']
// Friendlier, merged genre names for the chips.
const genreOf = (i: MediaItem) =>
  i.cable ? 'Basement Cable'
  : /news/i.test(i.genre) && i.kind === 'live' ? 'News'
  : /chill|music|jazz/i.test(i.genre) && i.kind === 'live' ? 'Music & radio'
  : /space|nature/i.test(i.genre) ? 'Nature & space'
  : /feature film/i.test(i.genre) ? 'Classics'
  : /silent/i.test(i.genre) ? 'Silent' : i.genre
const decadeOf = (i: MediaItem) => { const y = parseInt(i.year, 10); return y > 1880 ? `${Math.floor(y / 10) * 10}s` : /^\d0s$/.test(i.era) ? (i.era.length === 3 ? '19' + i.era : i.era) : '' }
const byYear = (a: MediaItem, b: MediaItem) => (a.year || '9999').localeCompare(b.year || '9999') || a.title.localeCompare(b.title, undefined, { numeric: true })

export function ProgramGuide() {
  const open = useMediaHub((s) => s.open)
  const [tab, setTab] = useState('Live TV')
  const [genre, setGenre] = useState('All'), [decade, setDecade] = useState('All')
  const [q, setQ] = useState('')
  const [series, setSeries] = useState<string | null>(null)
  const [link, setLink] = useState(''), [linkMsg, setLinkMsg] = useState('')
  const items = useMemo(() => {
    const lib = BUNDLED_MEDIA.filter((i) => i.playback !== 'external')
    return [...CABLE.map((c) => cableCard(c, lib)), ...lib]
  }, [])
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, items.filter((i) => tabOf(i) === t).length])), [items])
  const inTab = useMemo(() => items.filter((i) => tabOf(i) === tab), [items, tab])
  const chips = (key: (i: MediaItem) => string, sort?: (a: string, b: string) => number) => {
    const m = new Map<string, number>()
    inTab.forEach((i) => { const k = key(i); if (k) m.set(k, (m.get(k) ?? 0) + 1) })
    return [...m].sort(sort ? (a, b) => sort(a[0], b[0]) : (a, b) => b[1] - a[1])
  }
  const genres = useMemo(() => chips(genreOf), [inTab])
  const decades = useMemo(() => chips(decadeOf, (a, b) => a.localeCompare(b)), [inTab])

  const rows: GuideRow[] = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = needle
      ? items.filter((i) => `${i.title} ${i.genre} ${i.year} ${i.credit}`.toLowerCase().includes(needle))
      : inTab.filter((i) => (genre === 'All' || genreOf(i) === genre) && (decade === 'All' || decadeOf(i) === decade))
    return groupRows(list.sort(byYear))
  }, [items, inTab, q, genre, decade])
  const openSeries = rows.find((r): r is Extract<GuideRow, { kind: 'series' }> => r.kind === 'series' && r.name === series)

  useEffect(() => { setSeries(null); setGenre('All'); setDecade('All') }, [tab])
  useEffect(() => { setSeries(null) }, [q, genre, decade])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      e.stopImmediatePropagation()
      if (series) setSeries(null); else closeMediaHub()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, series])

  const playLink = async () => {
    setLinkMsg('Looking up that link…')
    try { const item = await resolveLink(link); setLinkMsg(''); setLink(''); playMedia(item) }
    catch (e) { setLinkMsg((e as Error).message) }
  }

  if (!open) return null
  return (
    <div className="guide-backdrop" onPointerDown={(e) => e.stopPropagation()}>
      <section className="guide" aria-label="Program guide">
        <header className="guide-head">
          <div><b>PROGRAM GUIDE</b><small>{items.length.toLocaleString()} free things to watch · picks play on the TV right away</small></div>
          <input placeholder="Search everything…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={closeMediaHub}>Close (Esc)</button>
        </header>
        <form className="guide-link" onSubmit={(e) => { e.preventDefault(); if (link.trim()) playLink() }}>
          <input placeholder="Or paste any link: YouTube, Vimeo, Dailymotion, archive.org, Twitch, or a .mp4 / .webm / .mp3 / .m3u8 file" value={link} onChange={(e) => { setLink(e.target.value); setLinkMsg('') }} />
          <button disabled={!link.trim()}>Play on TV</button>
          {linkMsg && <small>{linkMsg}</small>}
        </form>
        {!q && !series && (
          <>
            <nav className="guide-tabs">
              {TABS.filter((t) => counts[t]).map((t) => (
                <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t} <span>{counts[t]}</span></button>
              ))}
            </nav>
            {genres.length > 1 && (
              <nav className="guide-chips" aria-label="Genre">
                <button aria-pressed={genre === 'All'} onClick={() => setGenre('All')}>All</button>
                {genres.map(([g, n]) => <button key={g} aria-pressed={genre === g} onClick={() => setGenre(g)}>{g} <span>{n}</span></button>)}
              </nav>
            )}
            {decades.length > 1 && (
              <nav className="guide-chips decades" aria-label="Decade">
                <button aria-pressed={decade === 'All'} onClick={() => setDecade('All')}>Any year</button>
                {decades.map(([d, n]) => <button key={d} aria-pressed={decade === d} onClick={() => setDecade(d)}>{d} <span>{n}</span></button>)}
              </nav>
            )}
          </>
        )}
        {openSeries ? (
          <>
            <div className="guide-series-head"><button onClick={() => setSeries(null)}>← Back</button><b>{openSeries.name}</b><span>{openSeries.items.length} {tab === 'Music videos' ? 'videos' : 'episodes'}</span></div>
            <ul className="guide-list">{openSeries.items.map((i) => <Row key={i.id} item={i} />)}</ul>
          </>
        ) : (
          <ul className="guide-list">
            {rows.map((r) => r.kind === 'series' ? (
              <li key={'s:' + r.name} className="guide-series">
                <button onClick={() => setSeries(r.name)}>
                  <span className="guide-year">▸ {r.items.length}</span>
                  <span className="guide-title">{r.name}</span>
                  <span className="guide-meta">{yearSpan(r.items)} · collection</span>
                </button>
              </li>
            ) : <Row key={r.item.id} item={r.item} />)}
            {!rows.length && <li className="guide-empty">Nothing here{q ? ` for “${q}”` : ''}.</li>}
          </ul>
        )}
        <footer className="guide-foot">Streams from the Internet Archive and official channels · needs an internet connection · credits on each source link</footer>
      </section>
    </div>
  )
}

function Row({ item: i }: { item: MediaItem }) {
  return (
    <li>
      <button onClick={() => { const n = channelNumberOf(i.id); if (n) tune(n, false); else playMedia(i) }}>
        <span className="guide-year">{channelNumberOf(i.id) ?? (i.year || i.era)}</span>
        <span className="guide-title">{i.title}</span>
        <span className="guide-meta">{i.kind === 'live' && !i.cable ? i.credit.split(' / ')[0] : genreOf(i)}</span>
      </button>
      {i.source && <a href={i.source} target="_blank" rel="noreferrer" title={i.credit}>source</a>}
    </li>
  )
}
function yearSpan(items: MediaItem[]) {
  const ys = items.map((i) => parseInt(i.year, 10)).filter(Boolean).sort()
  return ys.length ? (ys[0] === ys[ys.length - 1] ? String(ys[0]) : `${ys[0]}–${ys[ys.length - 1]}`) : items[0].era
}
