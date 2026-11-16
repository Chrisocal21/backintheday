import { useEffect, useMemo, useState } from 'react'
import { create } from 'zustand'
import { tracksFor, useListening } from './state'
import { useStore } from '../store'
import type { Track } from './catalog'
import './ipod.css'

// A click-wheel music player docked on the sound system. Plays every music track in the house.
// Mouse wheel = spin the click wheel · Enter/click = select · Esc/MENU = back · Space = play/pause.
export const useIPod = create<{ open: boolean }>(() => ({ open: false }))
export function openIPod() { document.exitPointerLock(); useStore.setState({ locked: false }); useIPod.setState({ open: true }) }
export function closeIPod() { useIPod.setState({ open: false }); useStore.setState({ locked: true }) }

type Screen = { title: string; items: { label: string; sub?: string; go: () => Screen | void }[] }
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function IPod() {
  const open = useIPod((s) => s.open)
  const tracks = useMemo(() => tracksFor('ipod'), [])
  const play = (t: Track, queue: Track[]) => { useListening.getState().play('ipod', t.id, queue.map((q) => q.id)); return nowPlaying() }
  const songList = (title: string, list: Track[]): Screen => ({ title, items: list.map((t) => ({ label: t.title, sub: t.creator, go: () => play(t, list) })) })
  const byAlbum = useMemo(() => {
    const m = new Map<string, Track[]>()
    tracks.forEach((t) => { const k = `${t.album ?? t.genre}|${t.creator}`; m.set(k, [...(m.get(k) ?? []), t]) })
    return [...m.values()].map((l) => l.sort((a, b) => (a.track ?? 0) - (b.track ?? 0))).sort((a, b) => (a[0].album ?? a[0].genre).localeCompare(b[0].album ?? b[0].genre))
  }, [tracks])
  const byArtist = useMemo(() => {
    const m = new Map<string, Track[]>()
    tracks.forEach((t) => m.set(t.creator, [...(m.get(t.creator) ?? []), t]))
    return [...m].sort((a, b) => a[0].localeCompare(b[0]))
  }, [tracks])
  const byGenre = useMemo(() => {
    const m = new Map<string, Track[]>()
    tracks.forEach((t) => m.set(t.genre, [...(m.get(t.genre) ?? []), t]))
    return [...m].sort((a, b) => a[0].localeCompare(b[0]))
  }, [tracks])
  const nowPlaying = (): Screen => ({ title: 'Now Playing', items: [] })
  const albumsScreen = (): Screen => ({ title: 'Albums', items: byAlbum.map((l) => ({ label: l[0].album ?? l[0].genre, sub: `${l[0].creator} · ${l.length}`, go: () => songList(l[0].album ?? l[0].genre, l) })) })
  const root: Screen = {
    title: 'iPod',
    items: [
      { label: 'Now Playing', go: nowPlaying },
      { label: 'Shuffle Songs', go: () => { const q = [...tracks].sort(() => Math.random() - 0.5); return play(q[0], q) } },
      { label: 'Albums', sub: String(byAlbum.length), go: albumsScreen },
      { label: 'Artists', sub: String(byArtist.length), go: () => ({ title: 'Artists', items: byArtist.map(([a, l]) => ({ label: a, sub: String(l.length), go: () => songList(a, l) })) }) },
      { label: 'Genres', sub: String(byGenre.length), go: () => ({ title: 'Genres', items: byGenre.map(([g, l]) => ({ label: g, sub: String(l.length), go: () => songList(g, l) })) }) },
      { label: 'Songs', sub: String(tracks.length), go: () => songList('Songs', [...tracks].sort((a, b) => a.title.localeCompare(b.title))) },
    ],
  }
  const [stack, setStack] = useState<{ s: Screen; sel: number }[]>([{ s: root, sel: 0 }])
  const top = stack[stack.length - 1]
  const setSel = (sel: number) => setStack((st) => [...st.slice(0, -1), { ...st[st.length - 1], sel }])
  const select = () => { const it = top.s.items[top.sel]; const next = it?.go(); if (next) setStack((st) => [...st, { s: next, sel: 0 }]) }
  const back = () => (stack.length > 1 ? setStack((st) => st.slice(0, -1)) : closeIPod())
  const p = useListening((s) => s.ipod), track = tracks.find((t) => t.id === p?.id)

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      const k = e.code
      if (k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft') back()
      else if (k === 'ArrowDown' || k === 'KeyS') setSel(Math.min(top.s.items.length - 1, top.sel + 1))
      else if (k === 'ArrowUp' || k === 'KeyW') setSel(Math.max(0, top.sel - 1))
      else if (k === 'Enter' || k === 'ArrowRight') select()
      else if (k === 'Space') useListening.getState().toggle('ipod')
      else return
      e.preventDefault(); e.stopImmediatePropagation()
    }
    let acc = 0
    const wheel = (e: WheelEvent) => { e.preventDefault(); acc += e.deltaY; if (Math.abs(acc) > 40) { setSel(Math.max(0, Math.min(top.s.items.length - 1, top.sel + Math.sign(acc)))); acc = 0 } }
    window.addEventListener('keydown', key, true); window.addEventListener('wheel', wheel, { passive: false })
    return () => { window.removeEventListener('keydown', key, true); window.removeEventListener('wheel', wheel) }
  }, [open, stack])
  useEffect(() => { document.querySelector('.ipod-list .on')?.scrollIntoView({ block: 'nearest' }) }, [top.sel, top.s])

  if (!open) return null
  const showNow = top.s.title === 'Now Playing'
  return (
    <div className="ipod-backdrop" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { if (e.target === e.currentTarget) closeIPod() }}>
      <div className="ipod">
        <div className="ipod-screen">
          <div className="ipod-bar"><span>{top.s.title}</span><span>{p?.playing ? '▶' : p ? '❚❚' : ''} ▮▮▮</span></div>
          {showNow ? (
            track && p ? (
              <div className="ipod-now">
                {track.cover && <img src={track.cover} alt="" />}
                <div><b>{track.title}</b><span>{track.creator}</span><small>{track.album ?? track.genre}</small></div>
                <div className="ipod-progress"><i style={{ width: `${p.duration ? (p.time / p.duration) * 100 : 0}%` }} /></div>
                <div className="ipod-times"><span>{fmt(p.time)}</span><span>-{fmt(Math.max(0, p.duration - p.time))}</span></div>
                {p.error && <small className="ipod-err">{p.error}</small>}
              </div>
            ) : <div className="ipod-empty">Nothing playing.<br />Pick Shuffle Songs.</div>
          ) : (
            <ul className="ipod-list">
              {top.s.items.map((it, i) => (
                <li key={i} className={i === top.sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => { setSel(i); const next = it.go(); if (next) setStack((st) => [...st, { s: next, sel: 0 }]) }}>
                  <span>{it.label}</span>{it.sub && <small>{it.sub}</small>}<em>›</em>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ipod-wheel">
          <button className="w-menu" onClick={back}>MENU</button>
          <button className="w-prev" onClick={() => useListening.getState().next('ipod', -1)}>⏮</button>
          <button className="w-next" onClick={() => useListening.getState().next('ipod', 1)}>⏭</button>
          <button className="w-play" onClick={() => useListening.getState().toggle('ipod')}>⏯</button>
          <button className="w-center" onClick={select} aria-label="Select" />
        </div>
        <small className="ipod-help">Scroll = click wheel · Enter select · Esc back</small>
      </div>
    </div>
  )
}
