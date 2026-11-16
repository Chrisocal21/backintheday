// Board game rules + computer opponents. All original code, free to use.

// ---------- Tic-tac-toe (perfect play via minimax) ----------
export type TCell = 'X' | 'O' | null
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
export function tttWinner(b: TCell[]): TCell | 'draw' | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]
  return b.every(Boolean) ? 'draw' : null
}
function tttScore(b: TCell[], turn: 'X' | 'O', depth: number): number {
  const w = tttWinner(b)
  if (w === 'O') return 10 - depth
  if (w === 'X') return depth - 10
  if (w === 'draw') return 0
  const scores = b.map((c, i) => {
    if (c) return null
    const n = b.slice()
    n[i] = turn
    return tttScore(n, turn === 'X' ? 'O' : 'X', depth + 1)
  }).filter((s): s is number => s !== null)
  return turn === 'O' ? Math.max(...scores) : Math.min(...scores)
}
/** Computer plays O. `easy` makes it miss sometimes so kids can win. */
export function tttAI(b: TCell[], easy: boolean): number {
  const open = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0)
  if (easy && Math.random() < 0.35) return open[Math.floor(Math.random() * open.length)]
  let best = open[0], bestS = -Infinity
  for (const i of open) {
    const n = b.slice()
    n[i] = 'O'
    const s = tttScore(n, 'X', 1)
    if (s > bestS) { bestS = s; best = i }
  }
  return best
}

// ---------- Connect Four (minimax with alpha-beta) ----------
export const C4W = 7, C4H = 6
export type C4 = (0 | 1 | 2)[] // row-major, row 0 = top; 1 = you, 2 = computer
export function c4Drop(b: C4, col: number, p: 1 | 2): C4 | null {
  for (let r = C4H - 1; r >= 0; r--) if (!b[r * C4W + col]) { const n = b.slice() as C4; n[r * C4W + col] = p; return n }
  return null
}
export function c4Winner(b: C4): 0 | 1 | 2 | 'draw' {
  const at = (r: number, c: number) => (r >= 0 && r < C4H && c >= 0 && c < C4W ? b[r * C4W + c] : 0)
  for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) {
    const p = at(r, c)
    if (!p) continue
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]])
      if (at(r + dr, c + dc) === p && at(r + 2 * dr, c + 2 * dc) === p && at(r + 3 * dr, c + 3 * dc) === p) return p
  }
  return b.every(Boolean) ? 'draw' : 0
}
function c4Eval(b: C4): number {
  let s = 0
  const at = (r: number, c: number) => b[r * C4W + c]
  for (let r = 0; r < C4H; r++) if (at(r, 3) === 2) s += 3; else if (at(r, 3) === 1) s -= 3
  for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++)
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const er = r + 3 * dr, ec = c + 3 * dc
      if (er < 0 || er >= C4H || ec < 0 || ec >= C4W) continue
      let me = 0, you = 0
      for (let k = 0; k < 4; k++) { const v = at(r + k * dr, c + k * dc); if (v === 2) me++; else if (v === 1) you++ }
      if (me && !you) s += me === 3 ? 6 : me === 2 ? 2 : 0
      if (you && !me) s -= you === 3 ? 8 : you === 2 ? 2 : 0
    }
  return s
}
function c4Search(b: C4, depth: number, a: number, beta: number, max: boolean): number {
  const w = c4Winner(b)
  if (w === 2) return 100000 + depth
  if (w === 1) return -100000 - depth
  if (w === 'draw') return 0
  if (depth === 0) return c4Eval(b)
  const order = [3, 2, 4, 1, 5, 0, 6]
  if (max) {
    let v = -Infinity
    for (const c of order) { const n = c4Drop(b, c, 2); if (!n) continue; v = Math.max(v, c4Search(n, depth - 1, a, beta, false)); a = Math.max(a, v); if (a >= beta) break }
    return v
  }
  let v = Infinity
  for (const c of order) { const n = c4Drop(b, c, 1); if (!n) continue; v = Math.min(v, c4Search(n, depth - 1, a, beta, true)); beta = Math.min(beta, v); if (a >= beta) break }
  return v
}
export function c4AI(b: C4, depth: number): number {
  let best = 3, bestS = -Infinity
  for (const c of [3, 2, 4, 1, 5, 0, 6]) {
    const n = c4Drop(b, c, 2)
    if (!n) continue
    const s = c4Search(n, depth - 1, -Infinity, Infinity, false) + Math.random() * 0.5
    if (s > bestS) { bestS = s; best = c }
  }
  return best
}

// ---------- Checkers (forced captures, multi-jumps, kings) ----------
// 8x8, index r*8+c. 1/2 = your man/king (red, moving up), -1/-2 = computer (black, moving down).
export type CK = number[]
export type Move = { from: number; path: number[]; caps: number[] }
export function ckStart(): CK {
  const b = Array(64).fill(0)
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) {
    if (r < 3) b[r * 8 + c] = -1
    else if (r > 4) b[r * 8 + c] = 1
  }
  return b
}
const side = (v: number) => Math.sign(v)
function dirs(v: number) {
  const k = Math.abs(v) === 2
  if (k) return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  return v > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
}
function jumps(b: CK, at: number, piece: number, caps: number[], path: number[], from: number, out: Move[]) {
  const r = Math.floor(at / 8), c = at % 8
  let found = false
  for (const [dr, dc] of dirs(piece)) {
    const mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc
    if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue
    const mid = mr * 8 + mc, to = tr * 8 + tc
    if (side(b[mid]) === -side(piece) && !caps.includes(mid) && (b[to] === 0 || to === from)) {
      found = true
      jumps(b, to, piece, [...caps, mid], [...path, to], from, out)
    }
  }
  if (!found && caps.length) out.push({ from, path, caps })
}
export function ckMoves(b: CK, who: 1 | -1): Move[] {
  const caps: Move[] = [], steps: Move[] = []
  for (let i = 0; i < 64; i++) {
    if (side(b[i]) !== who) continue
    jumps(b, i, b[i], [], [], i, caps)
    const r = Math.floor(i / 8), c = i % 8
    for (const [dr, dc] of dirs(b[i])) {
      const tr = r + dr, tc = c + dc
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && b[tr * 8 + tc] === 0) steps.push({ from: i, path: [tr * 8 + tc], caps: [] })
    }
  }
  return caps.length ? caps : steps
}
export function ckApply(b: CK, m: Move): CK {
  const n = b.slice()
  const to = m.path[m.path.length - 1]
  let p = n[m.from]
  n[m.from] = 0
  for (const x of m.caps) n[x] = 0
  const row = Math.floor(to / 8)
  if (p === 1 && row === 0) p = 2
  if (p === -1 && row === 7) p = -2
  n[to] = p
  return n
}
function ckEval(b: CK) {
  let s = 0
  b.forEach((v, i) => {
    if (!v) return
    const val = Math.abs(v) === 2 ? 3 : 1 + (v < 0 ? Math.floor(i / 8) : 7 - Math.floor(i / 8)) * 0.05
    s += v < 0 ? val : -val
  })
  return s
}
function ckSearch(b: CK, depth: number, who: 1 | -1, a: number, beta: number): number {
  const ms = ckMoves(b, who)
  if (!ms.length) return who === -1 ? -1000 : 1000
  if (depth === 0) return ckEval(b)
  if (who === -1) {
    let v = -Infinity
    for (const m of ms) { v = Math.max(v, ckSearch(ckApply(b, m), depth - 1, 1, a, beta)); a = Math.max(a, v); if (a >= beta) break }
    return v
  }
  let v = Infinity
  for (const m of ms) { v = Math.min(v, ckSearch(ckApply(b, m), depth - 1, -1, a, beta)); beta = Math.min(beta, v); if (a >= beta) break }
  return v
}
export function ckAI(b: CK, depth: number): Move | null {
  const ms = ckMoves(b, -1)
  let best: Move | null = null, bestS = -Infinity
  for (const m of ms) {
    const s = ckSearch(ckApply(b, m), depth - 1, 1, -Infinity, Infinity) + Math.random() * 0.1
    if (s > bestS) { bestS = s; best = m }
  }
  return best
}
