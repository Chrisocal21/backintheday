import { useEffect, useState } from 'react'
import { COMICS } from './comics'
import { closeTable, useTable, type TableTab } from './tableState'
import {
  C4H, C4W, c4AI, c4Drop, c4Winner, ckAI, ckApply, ckMoves, ckStart, tttAI, tttWinner,
  type C4, type CK, type Move, type TCell,
} from './games'
import './tabletop.css'

const TABS: [TableTab, string][] = [['comics', 'Comics'], ['ttt', 'Tic-Tac-Toe'], ['c4', 'Four in a Row'], ['checkers', 'Checkers']]

export function Tabletop() {
  const open = useTable((s) => s.open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') closeTable() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!open) return null
  return (
    <div className="tt-backdrop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="tt-box">
        <header className="tt-head">
          <span className="tt-title">GAME CLOSET</span>
          <nav>{TABS.map(([id, label]) => <button key={id} aria-pressed={open === id} onClick={() => useTable.setState({ open: id })}>{label}</button>)}</nav>
          <button className="tt-close" onClick={closeTable}>Close (Esc)</button>
        </header>
        <div className="tt-body">
          {open === 'comics' && <Comics />}
          {open === 'ttt' && <TicTacToe />}
          {open === 'c4' && <FourInARow />}
          {open === 'checkers' && <Checkers />}
        </div>
        <footer className="tt-foot">All comics and games here are original and free for anyone to use.</footer>
      </div>
    </div>
  )
}

// ---------------- Comics ----------------
function Comics() {
  const [id, setId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const comic = COMICS.find((c) => c.id === id)
  useEffect(() => {
    if (!comic) return
    const pages = Math.ceil(comic.panels.length / 3)
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setPage((p) => Math.min(pages - 1, p + 1))
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setPage((p) => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [comic])

  if (!comic)
    return (
      <div className="tt-covers">
        {COMICS.map((c) => (
          <button key={c.id} className="tt-cover" style={{ background: c.cover, color: c.accent }} onClick={() => { setId(c.id); setPage(0) }}>
            <span className="tt-cover-issue">{c.issue}</span>
            <span className="tt-cover-title">{c.title}</span>
            <span className="tt-cover-art">{c.panels[3].scene}</span>
            <span className="tt-cover-era">{c.era}</span>
          </button>
        ))}
      </div>
    )
  const pages = Math.ceil(comic.panels.length / 3)
  return (
    <div className="tt-reader">
      <div className="tt-reader-bar">
        <button onClick={() => setId(null)}>← Shelf</button>
        <b>{comic.title} {comic.issue}</b>
        <span>Page {page + 1} / {pages}</span>
      </div>
      <div className="tt-page">
        {comic.panels.slice(page * 3, page * 3 + 3).map((p, i) => (
          <div key={i} className="tt-panel" style={{ background: p.bg }}>
            {p.caption && <div className="tt-caption">{p.caption}</div>}
            <div className="tt-scene">{p.scene}</div>
            {p.fx && <div className="tt-fx">{p.fx}</div>}
            {p.bubbles?.map((b, j) => <div key={j} className="tt-bubble"><b>{b.who}:</b> {b.text}</div>)}
          </div>
        ))}
      </div>
      <div className="tt-reader-bar">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>← → to turn pages</span>
        <button disabled={page === pages - 1} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </div>
  )
}

// ---------------- Tic-tac-toe ----------------
function TicTacToe() {
  const [b, setB] = useState<TCell[]>(Array(9).fill(null))
  const [easy, setEasy] = useState(true)
  const w = tttWinner(b)
  const click = (i: number) => {
    if (b[i] || w) return
    const n = b.slice(); n[i] = 'X'
    if (!tttWinner(n)) n[tttAI(n, easy)] = 'O'
    setB(n)
  }
  return (
    <div className="tt-game">
      <Status text={w === 'X' ? 'You win!' : w === 'O' ? 'Computer wins.' : w === 'draw' ? "Cat's game." : 'You are X.'} />
      <div className="tt-ttt">{b.map((c, i) => <button key={i} onClick={() => click(i)} className={c === 'X' ? 'x' : 'o'}>{c}</button>)}</div>
      <Controls onNew={() => setB(Array(9).fill(null))} hard={!easy} setHard={(h) => setEasy(!h)} />
    </div>
  )
}

// ---------------- Four in a row ----------------
function FourInARow() {
  const empty = () => Array(C4W * C4H).fill(0) as C4
  const [b, setB] = useState<C4>(empty)
  const [hard, setHard] = useState(false)
  const [thinking, setThinking] = useState(false)
  const w = c4Winner(b)
  const drop = (col: number) => {
    if (w || thinking) return
    const n = c4Drop(b, col, 1)
    if (!n) return
    setB(n)
    if (c4Winner(n)) return
    setThinking(true)
    setTimeout(() => { setB(c4Drop(n, c4AI(n, hard ? 6 : 3), 2) ?? n); setThinking(false) }, 250)
  }
  return (
    <div className="tt-game">
      <Status text={w === 1 ? 'You win!' : w === 2 ? 'Computer wins.' : w === 'draw' ? 'Board full. Draw.' : thinking ? 'Computer is thinking...' : 'You are red. Click a column.'} />
      <div className="tt-c4" style={{ gridTemplateColumns: `repeat(${C4W}, 1fr)` }}>
        {b.map((v, i) => <button key={i} onClick={() => drop(i % C4W)} className={v === 1 ? 'red' : v === 2 ? 'yel' : ''} aria-label={`column ${(i % C4W) + 1}`} />)}
      </div>
      <Controls onNew={() => setB(empty())} hard={hard} setHard={setHard} />
    </div>
  )
}

// ---------------- Checkers ----------------
function Checkers() {
  const [b, setB] = useState<CK>(ckStart)
  const [sel, setSel] = useState<number | null>(null)
  const [hard, setHard] = useState(false)
  const [thinking, setThinking] = useState(false)
  const mine = ckMoves(b, 1)
  const theirs = ckMoves(b, -1)
  const over = !mine.length ? 'Computer wins.' : !theirs.length ? 'You win!' : null
  const fromSel = sel === null ? [] : mine.filter((m) => m.from === sel)
  const click = (i: number) => {
    if (over || thinking) return
    const m = fromSel.find((m: Move) => m.path[m.path.length - 1] === i)
    if (m) {
      const n = ckApply(b, m)
      setB(n); setSel(null); setThinking(true)
      setTimeout(() => { const ai = ckAI(n, hard ? 6 : 3); setB(ai ? ckApply(n, ai) : n); setThinking(false) }, 300)
      return
    }
    setSel(mine.some((m) => m.from === i) ? i : null)
  }
  return (
    <div className="tt-game">
      <Status text={over ?? (thinking ? 'Computer is thinking...' : mine[0]?.caps.length ? 'You must jump!' : 'You are red, moving up. Pick a piece.')} />
      <div className="tt-ck">
        {b.map((v, i) => {
          const dark = (Math.floor(i / 8) + (i % 8)) % 2 === 1
          const target = fromSel.some((m) => m.path[m.path.length - 1] === i)
          return (
            <button key={i} onClick={() => click(i)} className={`${dark ? 'd' : 'l'} ${sel === i ? 'sel' : ''} ${target ? 'tgt' : ''}`}>
              {v !== 0 && <span className={`pc ${v > 0 ? 'red' : 'blk'}`}>{Math.abs(v) === 2 ? 'â™›' : ''}</span>}
            </button>
          )
        })}
      </div>
      <Controls onNew={() => { setB(ckStart()); setSel(null) }} hard={hard} setHard={setHard} />
    </div>
  )
}

function Status({ text }: { text: string }) { return <div className="tt-status" aria-live="polite">{text}</div> }
function Controls({ onNew, hard, setHard }: { onNew: () => void; hard: boolean; setHard: (h: boolean) => void }) {
  return (
    <div className="tt-controls">
      <button onClick={onNew}>New game</button>
      <button aria-pressed={!hard} onClick={() => setHard(false)}>Easy</button>
      <button aria-pressed={hard} onClick={() => setHard(true)}>Hard</button>
    </div>
  )
}
