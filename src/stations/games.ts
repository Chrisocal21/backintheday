import { W, H, type Game, type Keys, type Pal, clamp, clear, hitBox, rnd, text } from './engine'

// ---------------------------------------------------------------- Paddle Duel (paddle tennis vs CPU)
export function paddleDuel(p: Pal): Game {
  let py = H / 2, cy = H / 2, bx = W / 2, by = H / 2, vx = 110, vy = 60, me = 0, cpu = 0
  const PH = 32
  const serve = (dir: number) => { bx = W / 2; by = H / 2; vx = 110 * dir; vy = rnd(-70, 70) }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      py = clamp(py + ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * 170 * dt, PH / 2, H - PH / 2)
      cy += clamp(by - cy, -1, 1) * 120 * dt
      cy = clamp(cy, PH / 2, H - PH / 2)
      bx += vx * dt; by += vy * dt
      if (by < 4 || by > H - 4) { vy = -vy; by = clamp(by, 4, H - 4) }
      if (vx < 0 && bx < 16 && bx > 8 && Math.abs(by - py) < PH / 2 + 3) { vx = -vx * 1.06; vy += (by - py) * 4 }
      if (vx > 0 && bx > W - 16 && bx < W - 8 && Math.abs(by - cy) < PH / 2 + 3) { vx = -vx * 1.04; vy += (by - cy) * 4 }
      if (bx < 0) { cpu++; serve(1) }
      if (bx > W) { me++; game.score = me; serve(-1) }
      if (me >= 7 || cpu >= 7) game.over = true
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim
      for (let y = 0; y < H; y += 12) g.fillRect(W / 2 - 1, y, 2, 6)
      g.fillStyle = p.fg
      g.fillRect(8, py - PH / 2, 5, PH)
      g.fillStyle = p.a
      g.fillRect(W - 13, cy - PH / 2, 5, PH)
      g.fillStyle = p.c
      g.fillRect(bx - 3, by - 3, 6, 6)
      text(g, String(me), W / 2 - 24, 22, 16, p.fg, 'center')
      text(g, String(cpu), W / 2 + 24, 22, 16, p.a, 'center')
      if (game.over) text(g, me > cpu ? 'YOU WIN' : 'CPU WINS', W / 2, H / 2, 16, p.c, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Brick Bash (breakout genre)
export function brickBash(p: Pal): Game {
  let px = W / 2, bx = W / 2, by = H - 40, vx = 70, vy = -110, lives = 3, stuck = true
  const cols = [p.a, p.b, p.c, p.fg]
  let bricks = Array.from({ length: 4 * 10 }, (_, i) => ({ x: 8 + (i % 10) * 24, y: 30 + Math.floor(i / 10) * 10, alive: true, c: cols[Math.floor(i / 10)] }))
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      px = clamp(px + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 190 * dt, 18, W - 18)
      if (stuck) { bx = px; by = H - 22; if (k.hit('a') || k.hit('u')) stuck = false; return }
      bx += vx * dt; by += vy * dt
      if (bx < 3 || bx > W - 3) { vx = -vx; bx = clamp(bx, 3, W - 3) }
      if (by < 3) vy = Math.abs(vy)
      if (vy > 0 && by > H - 20 && by < H - 12 && Math.abs(bx - px) < 20) { vy = -Math.abs(vy) * 1.02; vx = (bx - px) * 6 }
      for (const b of bricks) if (b.alive && hitBox(bx - 2, by - 2, 4, 4, b.x, b.y, 22, 8)) { b.alive = false; vy = -vy; game.score += 10; break }
      if (by > H) { lives--; stuck = true; if (lives <= 0) game.over = true }
      if (bricks.every((b) => !b.alive)) { bricks = bricks.map((b) => ({ ...b, alive: true })); vy *= 1.1; stuck = true }
    },
    draw(g) {
      clear(g, p)
      for (const b of bricks) if (b.alive) { g.fillStyle = b.c; g.fillRect(b.x, b.y, 22, 8) }
      g.fillStyle = p.fg; g.fillRect(px - 18, H - 18, 36, 5)
      g.fillStyle = p.c; g.fillRect(bx - 2, by - 2, 4, 4)
      text(g, `SCORE ${game.score}`, 6, 14, 8, p.fg)
      text(g, `BALLS ${lives}`, W - 6, 14, 8, p.fg, 'right')
      if (stuck && !game.over) text(g, 'SPACE TO LAUNCH', W / 2, H / 2 + 30, 8, p.dim, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Rock Drift (asteroid-field shooter)
export function rockDrift(p: Pal): Game {
  let x = W / 2, y = H / 2, vx = 0, vy = 0, ang = -Math.PI / 2, cool = 0, lives = 3, inv = 2, wave = 0
  let shots: { x: number; y: number; vx: number; vy: number; t: number }[] = []
  let rocks: { x: number; y: number; vx: number; vy: number; r: number }[] = []
  const spawn = () => { wave++; for (let i = 0; i < 3 + wave; i++) { const a = rnd(0, 6.28); rocks.push({ x: W / 2 + Math.cos(a) * 120, y: H / 2 + Math.sin(a) * 110, vx: rnd(-30, 30), vy: rnd(-30, 30), r: 18 }) } }
  spawn()
  const wrap = (o: { x: number; y: number }) => { o.x = (o.x + W) % W; o.y = (o.y + H) % H }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      ang += ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 4 * dt
      if (k.u) { vx += Math.cos(ang) * 140 * dt; vy += Math.sin(ang) * 140 * dt }
      vx *= 0.99; vy *= 0.99
      const pos = { x: x + vx * dt, y: y + vy * dt }; wrap(pos); x = pos.x; y = pos.y
      cool -= dt; inv -= dt
      if (k.a && cool <= 0) { shots.push({ x, y, vx: Math.cos(ang) * 240, vy: Math.sin(ang) * 240, t: 0.9 }); cool = 0.2 }
      for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; wrap(s) }
      shots = shots.filter((s) => s.t > 0)
      for (const r of rocks) { r.x += r.vx * dt; r.y += r.vy * dt; wrap(r) }
      const next: typeof rocks = []
      for (const r of rocks) {
        const hit = shots.find((s) => Math.hypot(s.x - r.x, s.y - r.y) < r.r)
        if (hit) {
          hit.t = 0; game.score += r.r > 12 ? 20 : r.r > 7 ? 50 : 100
          if (r.r > 7) for (let i = 0; i < 2; i++) next.push({ x: r.x, y: r.y, vx: rnd(-60, 60), vy: rnd(-60, 60), r: r.r / 2 })
        } else next.push(r)
        if (inv <= 0 && Math.hypot(x - r.x, y - r.y) < r.r + 4) { lives--; inv = 2; x = W / 2; y = H / 2; vx = vy = 0; if (lives <= 0) game.over = true }
      }
      rocks = next
      if (!rocks.length) spawn()
    },
    draw(g) {
      clear(g, p)
      g.strokeStyle = p.dim; g.lineWidth = 1.5
      for (const r of rocks) { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = (i / 8) * 6.28, rr = r.r * (0.8 + ((i * 7) % 3) * 0.1); g.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr) } g.stroke() }
      if (inv <= 0 || Math.floor(inv * 10) % 2) {
        g.strokeStyle = p.fg; g.beginPath()
        g.moveTo(x + Math.cos(ang) * 9, y + Math.sin(ang) * 9)
        g.lineTo(x + Math.cos(ang + 2.5) * 7, y + Math.sin(ang + 2.5) * 7)
        g.lineTo(x + Math.cos(ang - 2.5) * 7, y + Math.sin(ang - 2.5) * 7)
        g.closePath(); g.stroke()
      }
      g.fillStyle = p.c
      for (const s of shots) g.fillRect(s.x - 1, s.y - 1, 2, 2)
      text(g, String(game.score), 6, 14, 8, p.fg)
      text(g, '▲'.repeat(Math.max(0, lives)), W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ---------------------------------------------------------------- Sky Siege (descending-formation shooter)
export function skySiege(p: Pal): Game {
  let px = W / 2, cool = 0, dir = 1, step = 0, lives = 3, level = 1
  let foes: { x: number; y: number; alive: boolean; row: number }[] = []
  let shots: { x: number; y: number }[] = [], bombs: { x: number; y: number }[] = []
  const build = () => { foes = Array.from({ length: 40 }, (_, i) => ({ x: 24 + (i % 10) * 20, y: 30 + Math.floor(i / 10) * 16, alive: true, row: Math.floor(i / 10) })) }
  build()
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      px = clamp(px + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 150 * dt, 8, W - 8)
      cool -= dt
      if (k.a && cool <= 0) { shots.push({ x: px, y: H - 24 }); cool = 0.35 }
      shots.forEach((s) => (s.y -= 220 * dt)); shots = shots.filter((s) => s.y > 0)
      bombs.forEach((b) => (b.y += 90 * dt)); bombs = bombs.filter((b) => b.y < H)
      const live = foes.filter((f) => f.alive)
      step += dt * (0.6 + level * 0.15 + (40 - live.length) * 0.05)
      if (step > 0.25) {
        step = 0
        const edge = live.some((f) => (dir > 0 ? f.x > W - 14 : f.x < 14))
        if (edge) { dir = -dir; live.forEach((f) => (f.y += 8)) } else live.forEach((f) => (f.x += dir * 4))
      }
      if (live.length && Math.random() < dt * (0.8 + level * 0.3)) { const f = live[Math.floor(Math.random() * live.length)]; bombs.push({ x: f.x, y: f.y }) }
      for (const s of shots) for (const f of live) if (f.alive && Math.abs(s.x - f.x) < 7 && Math.abs(s.y - f.y) < 6) { f.alive = false; s.y = -10; game.score += (4 - f.row) * 10 }
      for (const b of bombs) if (Math.abs(b.x - px) < 8 && b.y > H - 26 && b.y < H - 14) { b.y = H + 10; lives--; if (lives <= 0) game.over = true }
      if (live.some((f) => f.y > H - 34)) game.over = true
      if (!foes.some((f) => f.alive)) { level++; build() }
    },
    draw(g) {
      clear(g, p)
      const cols = [p.c, p.b, p.a, p.a]
      for (const f of foes) if (f.alive) {
        g.fillStyle = cols[f.row]
        g.fillRect(f.x - 6, f.y - 3, 12, 6); g.fillRect(f.x - 4, f.y - 6, 8, 3)
        g.fillRect(f.x - 6, f.y + 3, 2, 3); g.fillRect(f.x + 4, f.y + 3, 2, 3)
      }
      g.fillStyle = p.fg; g.fillRect(px - 8, H - 20, 16, 6); g.fillRect(px - 2, H - 24, 4, 4)
      g.fillStyle = p.c; shots.forEach((s) => g.fillRect(s.x - 1, s.y - 4, 2, 6))
      g.fillStyle = p.b; bombs.forEach((b) => g.fillRect(b.x - 1, b.y - 3, 3, 6))
      g.fillStyle = p.dim; g.fillRect(0, H - 10, W, 1)
      text(g, `SCORE ${game.score}`, 6, 14, 8, p.fg)
      text(g, `LIVES ${lives}  WAVE ${level}`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ---------------------------------------------------------------- Night Orbit (ring shooter, the cabinet's own game)
export function nightOrbit(p: Pal): Game {
  const cx = W / 2, cy = H / 2 + 6, R = 95
  let ang = Math.PI / 2, cool = 0, lives = 3, t = 0
  let shots: { a: number; r: number }[] = []
  let foes: { a: number; r: number; v: number }[] = []
  const stars = Array.from({ length: 40 }, () => [rnd(0, W), rnd(0, H)])
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      t += dt
      ang += ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 3 * dt
      cool -= dt
      if (k.a && cool <= 0) { shots.push({ a: ang, r: R - 8 }); cool = 0.18 }
      shots.forEach((s) => (s.r -= 200 * dt)); shots = shots.filter((s) => s.r > 4)
      if (Math.random() < dt * (1 + t / 20)) foes.push({ a: rnd(0, 6.28), r: 4, v: rnd(18, 30 + t) })
      foes.forEach((f) => { f.r += f.v * dt; f.a += 0.4 * dt })
      for (const f of foes) for (const s of shots) {
        const dx = Math.cos(f.a) * f.r - Math.cos(s.a) * s.r, dy = Math.sin(f.a) * f.r - Math.sin(s.a) * s.r
        if (Math.hypot(dx, dy) < 8) { f.r = 999; s.r = 0; game.score += 25 }
      }
      for (const f of foes) if (f.r >= R - 4 && f.r < 900) {
        const d = Math.abs(((f.a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
        if (d < 0.15) { lives--; if (lives <= 0) game.over = true }
        f.r = 999
      }
      foes = foes.filter((f) => f.r < 900)
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; stars.forEach(([x, y]) => g.fillRect(x, y, 1, 1))
      g.strokeStyle = p.dim; g.beginPath(); g.arc(cx, cy, R, 0, 6.28); g.stroke()
      g.fillStyle = p.b; g.beginPath(); g.arc(cx, cy, 6 + Math.sin(t * 4) * 2, 0, 6.28); g.fill()
      g.fillStyle = p.a
      for (const f of foes) { const x = cx + Math.cos(f.a) * f.r, y = cy + Math.sin(f.a) * f.r; g.fillRect(x - 3, y - 3, 6, 6) }
      g.fillStyle = p.c
      for (const s of shots) g.fillRect(cx + Math.cos(s.a) * s.r - 1, cy + Math.sin(s.a) * s.r - 1, 3, 3)
      const sx = cx + Math.cos(ang) * R, sy = cy + Math.sin(ang) * R
      g.fillStyle = p.fg; g.beginPath()
      g.moveTo(cx + Math.cos(ang) * (R - 10), cy + Math.sin(ang) * (R - 10))
      g.lineTo(sx + Math.cos(ang + 1.6) * 7, sy + Math.sin(ang + 1.6) * 7)
      g.lineTo(sx + Math.cos(ang - 1.6) * 7, sy + Math.sin(ang - 1.6) * 7)
      g.fill()
      text(g, String(game.score).padStart(6, '0'), 6, 14, 8, p.fg)
      text(g, `SHIPS ${lives}`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ---------------------------------------------------------------- Road Hopper (lane crossing)
export function roadHopper(p: Pal): Game {
  const T = 16
  let gx = 8, gy = 13, lives = 3, best = 13
  const lanes = Array.from({ length: 12 }, (_, i) => ({ y: i + 1, v: (i % 2 ? 1 : -1) * (30 + i * 6), cars: [0, 1, 2].map((j) => j * (W / 3) + rnd(0, 40)), safe: i === 5 || i === 6 }))
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.hit('u')) gy--
      if (k.hit('d')) gy = Math.min(13, gy + 1)
      if (k.hit('l')) gx = Math.max(0, gx - 1)
      if (k.hit('r')) gx = Math.min(15, gx + 1)
      if (gy < best) { best = gy; game.score += 10 }
      for (const l of lanes) {
        if (l.safe) continue
        l.cars = l.cars.map((c) => ((c + l.v * dt) % (W + 40) + W + 40) % (W + 40) - 20)
        if (gy === l.y) for (const c of l.cars) if (Math.abs(c + 12 - (gx * T + 8)) < 18) { lives--; gx = 8; gy = 13; best = 13; if (lives <= 0) game.over = true }
      }
      if (gy <= 0) { game.score += 100; gx = 8; gy = 13; best = 13; lanes.forEach((l) => (l.v *= 1.15)) }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.b; g.fillRect(0, 0, W, T)
      for (const l of lanes) {
        g.fillStyle = l.safe ? p.dim : p.bg; g.fillRect(0, l.y * T, W, T)
        if (!l.safe) { g.fillStyle = l.y % 3 ? p.a : p.c; for (const c of l.cars) g.fillRect(c, l.y * T + 3, 24, T - 6) }
      }
      g.fillStyle = p.b; g.fillRect(0, 13 * T, W, H - 13 * T)
      g.fillStyle = p.fg; g.fillRect(gx * T + 3, gy * T + 3, 10, 10)
      text(g, `SCORE ${game.score}  LIVES ${lives}`, 4, 11, 8, p.bg)
    },
  }
  return game
}

// ---------------------------------------------------------------- Moon Hopper (lander)
export function moonHopper(p: Pal): Game {
  let x = 40, y = 30, vx = 20, vy = 0, a = 0, fuel = 100, msg = '', round = 1
  let pad = rnd(60, W - 60)
  const ground = (gx: number) => (Math.abs(gx - pad) < 20 ? H - 30 : H - 30 - Math.abs(Math.sin(gx * 0.05 + round) * 30) - Math.abs(Math.sin(gx * 0.13)) * 14)
  const reset = () => { x = 40; y = 30; vx = 20; vy = 0; a = 0; fuel = 100; pad = rnd(60, W - 60); msg = '' }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (msg) { if (k.hit('a')) { if (msg === 'LANDED!') { round++; reset() } else game.over = true } return }
      a = clamp(a + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 2.5 * dt, -1.4, 1.4)
      if (k.u && fuel > 0) { vx += Math.sin(a) * 60 * dt; vy -= Math.cos(a) * 60 * dt; fuel -= 18 * dt }
      vy += 25 * dt
      x = (x + vx * dt + W) % W; y += vy * dt
      if (y + 6 >= ground(x)) {
        const ok = Math.abs(x - pad) < 18 && vy < 28 && Math.abs(vx) < 20 && Math.abs(a) < 0.3
        msg = ok ? 'LANDED!' : 'CRASHED'
        if (ok) game.score += Math.round(100 + fuel * 2)
        y = ground(x) - 6
      }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim
      g.beginPath(); g.moveTo(0, H)
      for (let gx = 0; gx <= W; gx += 4) g.lineTo(gx, ground(gx))
      g.lineTo(W, H); g.fill()
      g.fillStyle = p.c; g.fillRect(pad - 20, H - 31, 40, 3)
      g.save(); g.translate(x, y); g.rotate(a)
      g.fillStyle = p.fg; g.fillRect(-5, -6, 10, 9); g.fillRect(-7, 3, 2, 4); g.fillRect(5, 3, 2, 4)
      if (game && !msg) { /* flame */ }
      g.restore()
      text(g, `FUEL ${Math.max(0, Math.round(fuel))}`, 6, 14, 8, p.fg)
      text(g, `SPEED ${Math.round(Math.hypot(vx, vy))}`, W - 6, 14, 8, vy < 28 ? p.fg : p.a, 'right')
      text(g, `SCORE ${game.score}`, W / 2, 14, 8, p.fg, 'center')
      if (msg) { text(g, msg, W / 2, H / 2 - 10, 16, msg === 'LANDED!' ? p.c : p.a, 'center'); text(g, 'SPACE', W / 2, H / 2 + 8, 8, p.fg, 'center') }
    },
  }
  return game
}

// ---------------------------------------------------------------- Color Echo (repeat-the-pattern)
export function colorEcho(p: Pal, beep?: (i: number) => void): Game {
  const seq: number[] = [Math.floor(Math.random() * 4)]
  let show = 0, timer = 0.8, input = 0, lit = -1, litT = 0, mode: 'show' | 'play' = 'show'
  const keys = ['u', 'r', 'd', 'l'] as const
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      litT -= dt; if (litT <= 0) lit = -1
      if (mode === 'show') {
        timer -= dt
        if (timer <= 0) {
          if (show < seq.length) { lit = seq[show]; litT = 0.4; beep?.(lit); show++; timer = 0.6 } else { mode = 'play'; input = 0 }
        }
        return
      }
      keys.forEach((kk, i) => {
        if (!k.hit(kk)) return
        lit = i; litT = 0.25; beep?.(i)
        if (seq[input] !== i) { game.over = true; return }
        input++
        if (input === seq.length) { game.score = seq.length; seq.push(Math.floor(Math.random() * 4)); mode = 'show'; show = 0; timer = 1 }
      })
    },
    draw(g) {
      clear(g, p)
      const cols = [p.a, p.b, p.c, p.fg]
      const pos = [[W / 2, 52], [W / 2 + 56, H / 2 + 6], [W / 2, H - 40], [W / 2 - 56, H / 2 + 6]]
      pos.forEach(([x, y], i) => { g.globalAlpha = lit === i ? 1 : 0.28; g.fillStyle = cols[i]; g.beginPath(); g.arc(x, y, 26, 0, 6.28); g.fill() })
      g.globalAlpha = 1
      text(g, mode === 'show' ? 'WATCH...' : 'YOUR TURN (ARROWS)', W / 2, H / 2 + 9, 8, p.fg, 'center')
      text(g, `ROUND ${seq.length}`, 6, 14, 8, p.fg)
    },
  }
  return game
}

// ---------------------------------------------------------------- Stack Attack (falling blocks)
const SHAPES = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]]
export function stackAttack(p: Pal): Game {
  const CW = 10, CH = 20, S = 10
  const board: (string | null)[][] = Array.from({ length: CH }, () => Array(CW).fill(null))
  const cols = [p.a, p.b, p.c, p.fg]
  let piece = SHAPES[0], px = 3, py = 0, color = p.a, fall = 0, lines = 0, next = Math.floor(Math.random() * 7)
  const fits = (sh: number[][], ox: number, oy: number) => sh.every(([x, y]) => x + ox >= 0 && x + ox < CW && y + oy < CH && (y + oy < 0 || !board[y + oy][x + ox]))
  const spawn = () => { piece = SHAPES[next]; color = cols[next % 4]; next = Math.floor(Math.random() * 7); px = 3; py = 0; if (!fits(piece, px, py)) game.over = true }
  const lock = () => {
    piece.forEach(([x, y]) => { if (y + py >= 0) board[y + py][x + px] = color })
    let cleared = 0
    for (let r = CH - 1; r >= 0; r--) if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(CW).fill(null)); cleared++; r++ }
    lines += cleared; game.score += [0, 100, 300, 500, 800][cleared]
    spawn()
  }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.hit('l') && fits(piece, px - 1, py)) px--
      if (k.hit('r') && fits(piece, px + 1, py)) px++
      if (k.hit('u') || k.hit('b')) { const rot = piece.map(([x, y]) => [2 - y, x]); if (fits(rot, px, py)) piece = rot; else if (fits(rot, px - 1, py)) { piece = rot; px-- } }
      if (k.hit('a')) { while (fits(piece, px, py + 1)) py++; lock(); return }
      fall += dt * (k.d ? 12 : 1.5 + lines * 0.08)
      if (fall >= 1) { fall = 0; if (fits(piece, px, py + 1)) py++; else lock() }
    },
    draw(g) {
      clear(g, p)
      const ox = (W - CW * S) / 2, oy = 12
      g.fillStyle = p.dim; g.fillRect(ox - 2, oy - 2, CW * S + 4, CH * S + 4)
      g.fillStyle = p.bg; g.fillRect(ox, oy, CW * S, CH * S)
      board.forEach((row, y) => row.forEach((c, x) => { if (c) { g.fillStyle = c; g.fillRect(ox + x * S, oy + y * S, S - 1, S - 1) } }))
      g.fillStyle = color; piece.forEach(([x, y]) => g.fillRect(ox + (x + px) * S, oy + (y + py) * S, S - 1, S - 1))
      text(g, 'SCORE', 8, 24, 8, p.fg); text(g, String(game.score), 8, 36, 8, p.fg)
      text(g, 'LINES', 8, 56, 8, p.fg); text(g, String(lines), 8, 68, 8, p.fg)
      text(g, 'NEXT', W - 50, 24, 8, p.fg)
      g.fillStyle = cols[next % 4]; SHAPES[next].forEach(([x, y]) => g.fillRect(W - 50 + x * 8, 32 + y * 8, 7, 7))
    },
  }
  return game
}

// ---------------------------------------------------------------- Glow Worm (snake)
export function glowWorm(p: Pal): Game {
  const S = 8, CW = W / S, CH = H / S
  let body = [[10, 14], [9, 14], [8, 14]], dir = [1, 0], want = [1, 0], t = 0, food = [20, 14]
  const place = () => { do food = [Math.floor(rnd(1, CW - 1)), Math.floor(rnd(3, CH - 1))]; while (body.some(([x, y]) => x === food[0] && y === food[1])) }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.u && dir[1] === 0) want = [0, -1]
      if (k.d && dir[1] === 0) want = [0, 1]
      if (k.l && dir[0] === 0) want = [-1, 0]
      if (k.r && dir[0] === 0) want = [1, 0]
      t += dt
      if (t < Math.max(0.05, 0.12 - body.length * 0.002)) return
      t = 0; dir = want
      const h = [body[0][0] + dir[0], body[0][1] + dir[1]]
      if (h[0] < 0 || h[1] < 2 || h[0] >= CW || h[1] >= CH || body.some(([x, y]) => x === h[0] && y === h[1])) { game.over = true; return }
      body.unshift(h)
      if (h[0] === food[0] && h[1] === food[1]) { game.score += 10; place() } else body.pop()
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; g.fillRect(0, 2 * S - 1, W, 1)
      g.fillStyle = p.a; g.fillRect(food[0] * S + 1, food[1] * S + 1, S - 2, S - 2)
      body.forEach(([x, y], i) => { g.fillStyle = i ? p.fg : p.c; g.fillRect(x * S, y * S, S - 1, S - 1) })
      text(g, `LENGTH ${body.length}   SCORE ${game.score}`, 4, 11, 8, p.fg)
    },
  }
  return game
}

// ---------------------------------------------------------------- Pocket Racer (lane dodging)
export function pocketRacer(p: Pal): Game {
  const lanes = [W / 2 - 50, W / 2, W / 2 + 50]
  let lane = 1, x = lanes[1], speed = 90, road = 0, dist = 0
  let cars: { lane: number; y: number }[] = []
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.hit('l')) lane = Math.max(0, lane - 1)
      if (k.hit('r')) lane = Math.min(2, lane + 1)
      x += (lanes[lane] - x) * Math.min(1, dt * 14)
      speed += dt * 4; road = (road + speed * dt) % 24; dist += speed * dt
      game.score = Math.floor(dist / 10)
      if (Math.random() < dt * (0.9 + speed / 200)) { const l = Math.floor(Math.random() * 3); if (!cars.some((c) => c.lane === l && c.y < 40)) cars.push({ lane: l, y: -30 }) }
      cars.forEach((c) => (c.y += speed * 0.7 * dt)); cars = cars.filter((c) => c.y < H + 30)
      if (cars.some((c) => Math.abs(lanes[c.lane] - x) < 18 && Math.abs(c.y - (H - 40)) < 26)) game.over = true
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; g.fillRect(W / 2 - 78, 0, 156, H)
      g.fillStyle = p.bg
      for (let y = -24 + road; y < H; y += 24) { g.fillRect(W / 2 - 26, y, 3, 12); g.fillRect(W / 2 + 24, y, 3, 12) }
      g.fillStyle = p.a; for (const c of cars) { g.fillRect(lanes[c.lane] - 10, c.y - 14, 20, 28) }
      g.fillStyle = p.fg; g.fillRect(x - 10, H - 54, 20, 28); g.fillStyle = p.c; g.fillRect(x - 7, H - 50, 14, 6)
      text(g, `${game.score} m`, 6, 14, 8, p.fg)
      text(g, `${Math.round(speed)} km/h`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ---------------------------------------------------------------- Minefield (mouse or keys)
export function minefield(p: Pal): Game {
  const N = 10, MINES = 14, S = 18, ox = (W - N * S) / 2, oy = 20
  const mine: boolean[] = Array(N * N).fill(false), open: boolean[] = Array(N * N).fill(false), flag: boolean[] = Array(N * N).fill(false)
  let placed = false, cx = 5, cy = 5, won = false
  const nb = (i: number) => { const x = i % N, y = Math.floor(i / N), out: number[] = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(ny * N + nx) } return out }
  const count = (i: number) => nb(i).filter((j) => mine[j]).length
  const reveal = (i: number) => {
    if (game.over || flag[i] || open[i]) return
    if (!placed) { placed = true; let m = 0; while (m < MINES) { const j = Math.floor(Math.random() * N * N); if (!mine[j] && j !== i && !nb(i).includes(j)) { mine[j] = true; m++ } } }
    if (mine[i]) { open.fill(true); game.over = true; return }
    const stack = [i]
    while (stack.length) { const j = stack.pop()!; if (open[j]) continue; open[j] = true; game.score++; if (!count(j)) nb(j).forEach((n) => !open[n] && !flag[n] && stack.push(n)) }
    if (open.filter(Boolean).length === N * N - MINES) { won = true; game.over = true }
  }
  const game: Game = {
    over: false, score: 0,
    update(_, k) {
      if (k.hit('l')) cx = Math.max(0, cx - 1); if (k.hit('r')) cx = Math.min(N - 1, cx + 1)
      if (k.hit('u')) cy = Math.max(0, cy - 1); if (k.hit('d')) cy = Math.min(N - 1, cy + 1)
      if (k.hit('a')) reveal(cy * N + cx)
      if (k.hit('b')) flag[cy * N + cx] = !flag[cy * N + cx]
    },
    click(x, y, right) {
      const gx = Math.floor((x - ox) / S), gy = Math.floor((y - oy) / S)
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) return
      cx = gx; cy = gy
      const i = gy * N + gx
      if (right) flag[i] = !flag[i]; else reveal(i)
    },
    draw(g) {
      clear(g, p)
      const nums = ['', p.b, p.c, p.a, p.a, p.a, p.a, p.a, p.a]
      for (let i = 0; i < N * N; i++) {
        const x = ox + (i % N) * S, y = oy + Math.floor(i / N) * S
        g.fillStyle = open[i] ? p.bg : p.dim; g.fillRect(x, y, S - 1, S - 1)
        if (open[i] && mine[i]) { g.fillStyle = p.a; g.beginPath(); g.arc(x + S / 2, y + S / 2, 5, 0, 6.28); g.fill() }
        else if (open[i] && count(i)) text(g, String(count(i)), x + S / 2, y + 13, 10, nums[count(i)], 'center')
        else if (flag[i]) text(g, '⚑', x + S / 2, y + 13, 10, p.a, 'center')
      }
      g.strokeStyle = p.c; g.lineWidth = 2; g.strokeRect(ox + cx * S, oy + cy * S, S - 1, S - 1)
      text(g, won ? 'CLEARED!' : `MINES ${MINES - flag.filter(Boolean).length}`, 6, 13, 8, won ? p.c : p.fg)
      text(g, 'CLICK / SPACE open · RIGHT-CLICK / X flag', W / 2, H - 4, 7, p.fg, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Double Up (merge tiles)
export function doubleUp(p: Pal): Game {
  let b = Array(16).fill(0)
  const add = () => { const e = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) b[e[Math.floor(Math.random() * e.length)]] = Math.random() < 0.9 ? 2 : 4 }
  add(); add()
  const slide = (row: number[]) => { const r = row.filter(Boolean); for (let i = 0; i < r.length - 1; i++) if (r[i] === r[i + 1]) { r[i] *= 2; game.score += r[i]; r.splice(i + 1, 1) } while (r.length < 4) r.push(0); return r }
  const move = (dir: 'l' | 'r' | 'u' | 'd') => {
    const before = b.join()
    for (let n = 0; n < 4; n++) {
      const idx = [0, 1, 2, 3].map((m) => (dir === 'l' ? n * 4 + m : dir === 'r' ? n * 4 + 3 - m : dir === 'u' ? m * 4 + n : (3 - m) * 4 + n))
      const out = slide(idx.map((i) => b[i])); idx.forEach((i, m) => (b[i] = out[m]))
    }
    if (b.join() !== before) add()
    const stuck = b.every(Boolean) && [0, 1, 2, 3].every((r) => [0, 1, 2].every((c) => b[r * 4 + c] !== b[r * 4 + c + 1] && b[c * 4 + r] !== b[(c + 1) * 4 + r]))
    if (stuck) game.over = true
  }
  const game: Game = {
    over: false, score: 0,
    update(_, k) { (['l', 'r', 'u', 'd'] as const).forEach((d) => k.hit(d) && move(d)) },
    draw(g) {
      clear(g, p)
      const S = 44, ox = (W - S * 4) / 2, oy = 28
      const cols = [p.dim, p.fg, p.c, p.b, p.a]
      b.forEach((v, i) => {
        const x = ox + (i % 4) * S, y = oy + Math.floor(i / 4) * S
        g.fillStyle = v ? cols[Math.min(4, Math.floor(Math.log2(v) / 2.5) + 1)] : p.dim
        g.globalAlpha = v ? 1 : 0.4; g.fillRect(x + 2, y + 2, S - 4, S - 4); g.globalAlpha = 1
        if (v) text(g, String(v), x + S / 2, y + S / 2 + 5, v > 999 ? 10 : 14, p.bg, 'center')
      })
      text(g, `SCORE ${game.score}`, W / 2, 16, 8, p.fg, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Paper Plane (flap through gaps)
export function paperPlane(p: Pal): Game {
  let y = H / 2, vy = 0, started = false
  let walls: { x: number; gap: number; passed: boolean }[] = []
  let spawn = 0
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      const flap = k.hit('a') || k.hit('u')
      if (!started) { if (flap) started = true; else return }
      if (flap) vy = -150
      vy += 420 * dt; y += vy * dt
      spawn -= dt
      if (spawn <= 0) { walls.push({ x: W + 10, gap: rnd(50, H - 60), passed: false }); spawn = 1.5 }
      walls.forEach((w) => (w.x -= 80 * dt)); walls = walls.filter((w) => w.x > -30)
      for (const w of walls) {
        if (!w.passed && w.x < 50) { w.passed = true; game.score++ }
        if (w.x < 66 && w.x > 26 && (y < w.gap - 30 || y > w.gap + 30)) game.over = true
      }
      if (y > H || y < 0) game.over = true
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; for (const w of walls) { g.fillRect(w.x, 0, 24, w.gap - 30); g.fillRect(w.x, w.gap + 30, 24, H) }
      g.fillStyle = p.fg; g.beginPath(); g.moveTo(58, y); g.lineTo(40, y - 7); g.lineTo(44, y); g.lineTo(40, y + 5); g.closePath(); g.fill()
      text(g, String(game.score), W / 2, 26, 16, p.c, 'center')
      if (!started) text(g, 'SPACE TO FLY', W / 2, H / 2 + 30, 8, p.fg, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Rooftop Run (endless jumper)
export function rooftopRun(p: Pal): Game {
  const GY = H - 40
  let y = GY, vy = 0, speed = 120, dist = 0
  let obs: { x: number; w: number; h: number }[] = [], spawn = 1
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if ((k.hit('a') || k.hit('u')) && y >= GY) vy = -250
      vy += 700 * dt; y = Math.min(GY, y + vy * dt)
      speed += dt * 5; dist += speed * dt; game.score = Math.floor(dist / 10)
      spawn -= dt
      if (spawn <= 0) { obs.push({ x: W + 10, w: rnd(10, 22), h: rnd(12, 30) }); spawn = rnd(0.7, 1.6) * (140 / speed) + 0.4 }
      obs.forEach((o) => (o.x -= speed * dt)); obs = obs.filter((o) => o.x > -30)
      if (obs.some((o) => hitBox(30, y - 18, 12, 18, o.x, GY - o.h, o.w, o.h))) game.over = true
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; for (let i = 0; i < 6; i++) { const bx = ((i * 60 - dist * 0.3) % 360 + 360) % 360 - 40; g.fillRect(bx, GY - 70 - (i % 3) * 20, 40, 120) }
      g.fillStyle = p.b; g.fillRect(0, GY, W, H - GY)
      g.fillStyle = p.a; obs.forEach((o) => g.fillRect(o.x, GY - o.h, o.w, o.h))
      g.fillStyle = p.fg; g.fillRect(30, y - 18, 12, 18); g.fillStyle = p.c; g.fillRect(36, y - 16, 5, 4)
      text(g, `${game.score} m`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ---------------------------------------------------------------- Tank Maze (2-tank duel vs CPU)
export function tankMaze(p: Pal): Game {
  const walls = [[60, 50, 12, 60], [184, 114, 12, 60], [110, 100, 36, 12], [0, 0, W, 6], [0, H - 6, W, 6], [0, 0, 6, H], [W - 6, 0, 6, H]]
  const blocked = (x: number, y: number) => walls.some(([wx, wy, ww, wh]) => hitBox(x - 6, y - 6, 12, 12, wx, wy, ww, wh))
  const me = { x: 30, y: H / 2, a: 0, cool: 0 }, cpu = { x: W - 30, y: H / 2, a: Math.PI, cool: 1 }
  let shells: { x: number; y: number; vx: number; vy: number; t: number; mine: boolean }[] = []
  let mine = 0, theirs = 0
  const fire = (t: typeof me, isMe: boolean) => { shells.push({ x: t.x + Math.cos(t.a) * 9, y: t.y + Math.sin(t.a) * 9, vx: Math.cos(t.a) * 140, vy: Math.sin(t.a) * 140, t: 2.5, mine: isMe }); t.cool = 0.8 }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      me.a += ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 3 * dt
      const sp = ((k.u ? 1 : 0) - (k.d ? 1 : 0)) * 60 * dt
      const nx = me.x + Math.cos(me.a) * sp, ny = me.y + Math.sin(me.a) * sp
      if (!blocked(nx, ny)) { me.x = nx; me.y = ny }
      me.cool -= dt; cpu.cool -= dt
      if (k.a && me.cool <= 0) fire(me, true)
      const want = Math.atan2(me.y - cpu.y, me.x - cpu.x)
      const diff = ((want - cpu.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      cpu.a += clamp(diff, -2 * dt, 2 * dt)
      const cx = cpu.x + Math.cos(cpu.a) * 35 * dt, cy = cpu.y + Math.sin(cpu.a) * 35 * dt
      if (Math.hypot(me.x - cpu.x, me.y - cpu.y) > 60 && !blocked(cx, cy)) { cpu.x = cx; cpu.y = cy } else cpu.a += dt
      if (Math.abs(diff) < 0.15 && cpu.cool <= 0) fire(cpu, false)
      for (const s of shells) {
        s.t -= dt
        const nx2 = s.x + s.vx * dt, ny2 = s.y + s.vy * dt
        if (walls.some(([wx, wy, ww, wh]) => hitBox(nx2 - 1, s.y - 1, 2, 2, wx, wy, ww, wh))) s.vx = -s.vx
        if (walls.some(([wx, wy, ww, wh]) => hitBox(s.x - 1, ny2 - 1, 2, 2, wx, wy, ww, wh))) s.vy = -s.vy
        s.x += s.vx * dt; s.y += s.vy * dt
        if (s.mine && Math.hypot(s.x - cpu.x, s.y - cpu.y) < 8) { s.t = 0; mine++; game.score = mine; cpu.x = W - 30; cpu.y = rnd(30, H - 30) }
        if (!s.mine && Math.hypot(s.x - me.x, s.y - me.y) < 8) { s.t = 0; theirs++; me.x = 30; me.y = H / 2 }
      }
      shells = shells.filter((s) => s.t > 0)
      if (mine >= 5 || theirs >= 5) game.over = true
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; walls.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h))
      const tank = (t: typeof me, c: string) => { g.save(); g.translate(t.x, t.y); g.rotate(t.a); g.fillStyle = c; g.fillRect(-6, -5, 12, 10); g.fillRect(0, -1.5, 10, 3); g.restore() }
      tank(me, p.fg); tank(cpu, p.a)
      g.fillStyle = p.c; shells.forEach((s) => g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3))
      text(g, `YOU ${mine}`, 12, 18, 8, p.fg); text(g, `CPU ${theirs}`, W - 12, 18, 8, p.a, 'right')
      if (game.over) text(g, mine >= 5 ? 'YOU WIN' : 'CPU WINS', W / 2, H / 2, 16, p.c, 'center')
    },
  }
  return game
}

// ---------------------------------------------------------------- Keys helper for runners
export function makeKeys(): Keys & { press: (c: string, down: boolean) => void } {
  const map: Record<string, keyof Omit<Keys, 'hit'>> = {
    ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
    Space: 'a', KeyZ: 'a', Enter: 'a', KeyX: 'b', ShiftLeft: 'b', ShiftRight: 'b',
  }
  const edges = new Set<string>()
  const k = {
    l: false, r: false, u: false, d: false, a: false, b: false,
    hit: (n: string) => { const h = edges.has(n); edges.delete(n); return h },
    press(code: string, down: boolean) {
      const n = map[code]
      if (!n) return
      if (down && !k[n]) edges.add(n)
      k[n] = down
    },
  }
  return k as Keys & { press: (c: string, down: boolean) => void }
}
