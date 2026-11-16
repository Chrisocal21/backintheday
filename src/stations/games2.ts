import { W, H, type Game, type Pal, clamp, clear, rnd, text } from './engine'

// ======================= ARCADE =======================

// City Shield: fire interceptors at falling missiles to protect six cities.
export function cityShield(p: Pal): Game {
  let cx = W / 2, cy = H / 2, ammo = 30, wave = 1, spawnT = 0, left = 10
  const cities = [30, 70, 110, 146, 186, 226].map((x) => ({ x, alive: true }))
  let falls: { x: number; y: number; tx: number; v: number }[] = []
  let booms: { x: number; y: number; r: number; t: number }[] = []
  let shots: { x: number; y: number; tx: number; ty: number }[] = []
  const fire = (x: number, y: number) => { if (ammo <= 0) return; ammo--; shots.push({ x: W / 2, y: H - 14, tx: x, ty: Math.min(y, H - 30) }) }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      cx = clamp(cx + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 160 * dt, 0, W)
      cy = clamp(cy + ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * 160 * dt, 10, H - 30)
      if (k.hit('a')) fire(cx, cy)
      spawnT -= dt
      if (left > 0 && spawnT <= 0) { const t = cities[Math.floor(Math.random() * 6)]; falls.push({ x: rnd(0, W), y: 0, tx: t.x, v: 18 + wave * 5 }); left--; spawnT = rnd(0.5, 1.6) }
      for (const s of shots) { const d = Math.hypot(s.tx - s.x, s.ty - s.y), st = 220 * dt; if (d < st) { booms.push({ x: s.tx, y: s.ty, r: 0, t: 0 }); s.y = -99 } else { s.x += ((s.tx - s.x) / d) * st; s.y += ((s.ty - s.y) / d) * st } }
      shots = shots.filter((s) => s.y > -50)
      booms.forEach((b) => { b.t += dt; b.r = Math.sin(Math.min(1, b.t / 1.2) * Math.PI) * 22 })
      booms = booms.filter((b) => b.t < 1.2)
      for (const f of falls) {
        const dx = f.tx - f.x, dy = H - 14 - f.y, d = Math.hypot(dx, dy)
        f.x += (dx / d) * f.v * dt; f.y += (dy / d) * f.v * dt
        if (booms.some((b) => Math.hypot(b.x - f.x, b.y - f.y) < b.r)) { f.y = 999; game.score += 25 }
        else if (f.y >= H - 16) { const c = cities.find((c) => Math.abs(c.x - f.x) < 12); if (c) c.alive = false; f.y = 999 }
      }
      falls = falls.filter((f) => f.y < 900)
      if (!cities.some((c) => c.alive)) game.over = true
      if (left <= 0 && !falls.length) { game.score += cities.filter((c) => c.alive).length * 100 + ammo * 5; wave++; left = 8 + wave * 2; ammo = 30 }
    },
    click(x, y) { cx = x; cy = y; fire(x, y) },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; g.fillRect(0, H - 10, W, 10)
      g.fillStyle = p.b; g.fillRect(W / 2 - 8, H - 18, 16, 8)
      cities.forEach((c) => { if (c.alive) { g.fillStyle = p.c; g.fillRect(c.x - 9, H - 18, 18, 8); g.fillRect(c.x - 4, H - 23, 6, 5) } })
      g.strokeStyle = p.a; g.lineWidth = 1
      falls.forEach((f) => { g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - (f.tx - f.x) * 0.06, f.y - 12); g.stroke(); g.fillStyle = p.fg; g.fillRect(f.x - 1, f.y - 1, 3, 3) })
      g.fillStyle = p.fg; shots.forEach((s) => g.fillRect(s.x - 1, s.y - 1, 2, 2))
      booms.forEach((b) => { g.fillStyle = Math.floor(b.t * 20) % 2 ? p.c : p.fg; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.28); g.fill() })
      g.strokeStyle = p.fg; g.strokeRect(cx - 4, cy - 4, 8, 8)
      text(g, `SCORE ${game.score}`, 6, 14, 8, p.fg); text(g, `AMMO ${ammo}  WAVE ${wave}`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// Maze Muncher: eat every dot, dodge the chasers, grab a big dot to turn the tables.
const MAZE = [
  '###############',
  '#o....#.#....o#',
  '#.##..#.#..##.#',
  '#.............#',
  '#.##.#####.##.#',
  '#....#   #....#',
  '####.# # #.####',
  '#......#......#',
  '#.##.#####.##.#',
  '#o...........o#',
  '###############',
]
export function mazeMuncher(p: Pal): Game {
  const T = 16, ox = (W - 15 * T) / 2, oy = 30
  let grid = MAZE.map((r) => r.split(''))
  const open = (x: number, y: number) => grid[y]?.[x] !== undefined && grid[y][x] !== '#'
  const me = { x: 7, y: 9, dx: 0, dy: 0, want: [0, 0], t: 0 }
  const ghosts = [{ x: 6, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 7 }].map((g, i) => ({ ...g, hx: g.x, hy: g.y, t: i * 0.1, c: i }))
  let scared = 0, lives = 3
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.l) me.want = [-1, 0]; if (k.r) me.want = [1, 0]; if (k.u) me.want = [0, -1]; if (k.d) me.want = [0, 1]
      scared -= dt
      me.t += dt
      if (me.t > 0.14) {
        me.t = 0
        if (open(me.x + me.want[0], me.y + me.want[1])) { me.dx = me.want[0]; me.dy = me.want[1] }
        if (open(me.x + me.dx, me.y + me.dy)) { me.x += me.dx; me.y += me.dy }
        const c = grid[me.y][me.x]
        if (c === '.') { grid[me.y][me.x] = ' '; game.score += 10 }
        if (c === 'o') { grid[me.y][me.x] = ' '; game.score += 50; scared = 6 }
        if (!grid.some((r) => r.includes('.') || r.includes('o'))) { grid = MAZE.map((r) => r.split('')); me.x = 7; me.y = 9 }
      }
      for (const g of ghosts) {
        g.t += dt
        if (g.t < (scared > 0 ? 0.3 : 0.2)) continue
        g.t = 0
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => open(g.x + dx, g.y + dy))
        opts.sort((a, b) => {
          const da = Math.hypot(g.x + a[0] - me.x, g.y + a[1] - me.y), db = Math.hypot(g.x + b[0] - me.x, g.y + b[1] - me.y)
          return scared > 0 ? db - da : da - db
        })
        const pick = Math.random() < 0.7 ? opts[0] : opts[Math.floor(Math.random() * opts.length)]
        if (pick) { g.x += pick[0]; g.y += pick[1] }
      }
      for (const g of ghosts) if (g.x === me.x && g.y === me.y) {
        if (scared > 0) { g.x = g.hx; g.y = g.hy; game.score += 200 }
        else { lives--; me.x = 7; me.y = 9; me.dx = me.dy = 0; ghosts.forEach((q) => { q.x = q.hx; q.y = q.hy }); if (lives <= 0) game.over = true }
      }
    },
    draw(g) {
      clear(g, p)
      grid.forEach((row, y) => row.forEach((c, x) => {
        const px = ox + x * T, py = oy + y * T
        if (c === '#') { g.fillStyle = p.dim; g.fillRect(px + 1, py + 1, T - 2, T - 2) }
        if (c === '.') { g.fillStyle = p.fg; g.fillRect(px + 7, py + 7, 2, 2) }
        if (c === 'o') { g.fillStyle = p.c; g.beginPath(); g.arc(px + 8, py + 8, 4, 0, 6.28); g.fill() }
      }))
      const mouth = Math.abs(Math.sin(performance.now() / 90)) * 0.7
      const ang = Math.atan2(me.dy, me.dx || (me.dy ? 0 : 1))
      g.fillStyle = p.c; g.beginPath(); g.moveTo(ox + me.x * T + 8, oy + me.y * T + 8)
      g.arc(ox + me.x * T + 8, oy + me.y * T + 8, 7, ang + mouth / 2, ang + 6.28 - mouth / 2); g.fill()
      const gc = [p.a, p.b, p.fg]
      for (const q of ghosts) {
        g.fillStyle = scared > 0 ? (scared < 2 && Math.floor(scared * 6) % 2 ? p.fg : p.dim) : gc[q.c]
        const x = ox + q.x * T, y = oy + q.y * T
        g.beginPath(); g.arc(x + 8, y + 7, 6, Math.PI, 0); g.lineTo(x + 14, y + 14); g.lineTo(x + 2, y + 14); g.fill()
        g.fillStyle = p.bg; g.fillRect(x + 5, y + 6, 2, 2); g.fillRect(x + 10, y + 6, 2, 2)
      }
      text(g, `SCORE ${game.score}`, 6, 16, 8, p.fg); text(g, `LIVES ${lives}`, W - 6, 16, 8, p.fg, 'right')
    },
  }
  return game
}

// Skyline Strike: vertical scrolling shooter with waves and power-ups.
export function skylineStrike(p: Pal): Game {
  let x = W / 2, y = H - 30, cool = 0, lives = 3, power = 1, t = 0, inv = 0
  let bullets: { x: number; y: number; vx: number }[] = [], foes: { x: number; y: number; hp: number; vx: number; kind: number }[] = []
  let ebul: { x: number; y: number; vx: number; vy: number }[] = [], pickups: { x: number; y: number }[] = []
  const stars = Array.from({ length: 50 }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(20, 80) }))
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      t += dt; inv -= dt
      x = clamp(x + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 150 * dt, 8, W - 8)
      y = clamp(y + ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * 150 * dt, 30, H - 10)
      stars.forEach((s) => { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = rnd(0, W) } })
      cool -= dt
      if (k.a && cool <= 0) { cool = 0.16; for (let i = 0; i < power; i++) bullets.push({ x, y: y - 8, vx: (i - (power - 1) / 2) * 40 }) }
      bullets.forEach((b) => { b.y -= 260 * dt; b.x += b.vx * dt }); bullets = bullets.filter((b) => b.y > -5)
      if (Math.random() < dt * (1.2 + t / 30)) foes.push({ x: rnd(16, W - 16), y: -10, hp: Math.random() < 0.15 ? 5 : 1, vx: rnd(-30, 30), kind: Math.random() < 0.15 ? 1 : 0 })
      for (const f of foes) {
        f.y += (f.kind ? 25 : 55) * dt; f.x += Math.sin(t * 2 + f.y / 30) * f.vx * dt
        if (Math.random() < dt * (f.kind ? 1.5 : 0.4)) { const a = Math.atan2(y - f.y, x - f.x); ebul.push({ x: f.x, y: f.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 }) }
        for (const b of bullets) if (Math.abs(b.x - f.x) < 9 && Math.abs(b.y - f.y) < 8) { b.y = -99; f.hp-- }
        if (f.hp <= 0) { game.score += f.kind ? 250 : 50; if (Math.random() < 0.12) pickups.push({ x: f.x, y: f.y }); f.y = 999 }
      }
      foes = foes.filter((f) => f.y < H + 10)
      ebul.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt }); ebul = ebul.filter((b) => b.y < H && b.y > 0 && b.x > 0 && b.x < W)
      pickups.forEach((q) => (q.y += 40 * dt))
      pickups = pickups.filter((q) => { if (Math.hypot(q.x - x, q.y - y) < 12) { power = Math.min(4, power + 1); return false } return q.y < H })
      const hit = ebul.some((b) => Math.hypot(b.x - x, b.y - y) < 5) || foes.some((f) => Math.hypot(f.x - x, f.y - y) < 10)
      if (hit && inv <= 0) { lives--; inv = 2; power = Math.max(1, power - 1); ebul = []; if (lives <= 0) game.over = true }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; stars.forEach((s) => g.fillRect(s.x, s.y, 1, s.s > 60 ? 2 : 1))
      for (const f of foes) { g.fillStyle = f.kind ? p.b : p.a; if (f.kind) g.fillRect(f.x - 10, f.y - 7, 20, 14); else { g.beginPath(); g.moveTo(f.x, f.y + 7); g.lineTo(f.x - 8, f.y - 6); g.lineTo(f.x + 8, f.y - 6); g.fill() } }
      g.fillStyle = p.c; bullets.forEach((b) => g.fillRect(b.x - 1, b.y - 4, 2, 6))
      g.fillStyle = p.a; ebul.forEach((b) => g.fillRect(b.x - 2, b.y - 2, 4, 4))
      g.fillStyle = p.b; pickups.forEach((q) => { g.fillRect(q.x - 5, q.y - 5, 10, 10); text(g, 'P', q.x, q.y + 3, 8, p.bg, 'center') })
      if (inv <= 0 || Math.floor(inv * 10) % 2) { g.fillStyle = p.fg; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x - 8, y + 7); g.lineTo(x + 8, y + 7); g.fill() }
      text(g, String(game.score).padStart(7, '0'), 6, 14, 8, p.fg); text(g, `LIVES ${lives} PWR ${power}`, W - 6, 14, 8, p.fg, 'right')
    },
  }
  return game
}

// ======================= CONSOLE =======================

// Bowl-O-Rama: aim with a swinging arrow, set power, knock down pins. 10 frames.
export function bowlORama(p: Pal): Game {
  let frame = 1, ball = 1, phase: 'aim' | 'power' | 'roll' | 'result' = 'aim', aim = 0, power = 0, t = 0
  let bx = W / 2, by = H - 24, vx = 0, vy = 0, timer = 0, msg = ''
  const rack = () => [[0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2], [-3, 3], [-1, 3], [1, 3], [3, 3]].map(([c, r]) => ({ x: W / 2 + c * 9, y: 50 - r * 9, up: true, vx: 0, vy: 0 }))
  let pins = rack()
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      t += dt
      if (phase === 'aim') { aim = Math.sin(t * 2) * 0.35; bx = clamp(bx + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 60 * dt, W / 2 - 34, W / 2 + 34); if (k.hit('a')) { phase = 'power'; t = 0 } }
      else if (phase === 'power') { power = (Math.sin(t * 3 - Math.PI / 2) + 1) / 2; if (k.hit('a')) { phase = 'roll'; vx = Math.sin(aim) * 160 * (0.5 + power); vy = -Math.cos(aim) * 160 * (0.5 + power) } }
      else if (phase === 'roll') {
        bx += vx * dt; by += vy * dt
        if (bx < W / 2 - 40 || bx > W / 2 + 40) { vx = 0; bx = clamp(bx, W / 2 - 40, W / 2 + 40); msg = 'GUTTER' }
        for (const pin of pins) {
          if (pin.up && Math.hypot(pin.x - bx, pin.y - by) < 8) { pin.up = false; pin.vx = (pin.x - bx) * 8 + vx * 0.3; pin.vy = vy * 0.6 }
          if (!pin.up) { pin.x += pin.vx * dt; pin.y += pin.vy * dt; pin.vx *= 0.96; pin.vy *= 0.96; for (const q of pins) if (q.up && Math.hypot(q.x - pin.x, q.y - pin.y) < 7 && Math.hypot(pin.vx, pin.vy) > 20) { q.up = false; q.vx = pin.vx * 0.7 + rnd(-20, 20); q.vy = pin.vy * 0.7 } }
        }
        if (by < 10) { phase = 'result'; timer = 1.2 }
      } else {
        pins.forEach((q) => { if (!q.up) { q.x += q.vx * dt; q.y += q.vy * dt } })
        timer -= dt
        if (timer <= 0) {
          const down = pins.filter((q) => !q.up).length
          if (!pins.some((q) => q.up) || ball === 2) {
            const pts = pins.filter((q) => !q.up).length
            game.score += pts + (pts === 10 ? (ball === 1 ? 10 : 5) : 0)
            msg = pts === 10 ? (ball === 1 ? 'STRIKE!' : 'SPARE!') : `${pts} PINS`
            frame++; ball = 1; pins = rack()
            if (frame > 10) game.over = true
          } else { ball = 2; msg = `${down} DOWN`; pins = pins.filter((q) => q.up).concat(pins.filter((q) => !q.up).map((q) => ({ ...q, x: -99, y: -99 }))) }
          bx = W / 2; by = H - 24; phase = 'aim'; t = 0
        }
      }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.c; g.globalAlpha = 0.25; g.fillRect(W / 2 - 40, 0, 80, H); g.globalAlpha = 1
      g.fillStyle = p.dim; g.fillRect(W / 2 - 46, 0, 6, H); g.fillRect(W / 2 + 40, 0, 6, H)
      pins.forEach((q) => { g.fillStyle = q.up ? p.fg : p.dim; g.beginPath(); g.arc(q.x, q.y, 3.5, 0, 6.28); g.fill() })
      g.fillStyle = p.a; g.beginPath(); g.arc(bx, by, 6, 0, 6.28); g.fill()
      if (phase === 'aim') { g.strokeStyle = p.c; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.sin(aim) * 40, by - Math.cos(aim) * 40); g.stroke() }
      if (phase === 'power') { g.fillStyle = p.dim; g.fillRect(W - 30, 60, 10, 100); g.fillStyle = p.a; g.fillRect(W - 30, 160 - power * 100, 10, power * 100) }
      text(g, `FRAME ${Math.min(10, frame)}  BALL ${ball}`, 6, 14, 8, p.fg); text(g, `SCORE ${game.score}`, W - 6, 14, 8, p.fg, 'right')
      if (msg && phase !== 'roll') text(g, msg, 50, H / 2, 8, p.c, 'center')
      text(g, phase === 'aim' ? '← → SPOT · SPACE LOCK AIM' : phase === 'power' ? 'SPACE SET POWER' : '', W / 2, H - 4, 7, p.fg, 'center')
    },
  }
  return game
}

// Sea Diver: collect treasure, watch your air, avoid the sharks.
export function seaDiver(p: Pal): Game {
  let x = W / 2, y = 40, air = 1, carry = 0
  let sharks = Array.from({ length: 4 }, (_, i) => ({ x: rnd(0, W), y: 70 + i * 36, v: (i % 2 ? 1 : -1) * rnd(30, 60) }))
  let gems = Array.from({ length: 5 }, () => ({ x: rnd(20, W - 20), y: rnd(80, H - 16) }))
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      x = clamp(x + ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 90 * dt, 6, W - 6)
      y = clamp(y + ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * 80 * dt + 6 * dt, 30, H - 8)
      if (y < 36) { air = Math.min(1, air + dt * 0.8); if (carry) { game.score += carry * 100; carry = 0 } } else air -= dt * 0.06
      sharks.forEach((s) => { s.x += s.v * dt; if (s.x < -20 || s.x > W + 20) s.v = -s.v; s.y += Math.sin(performance.now() / 500 + s.x) * 0.2 })
      gems = gems.filter((gm) => { if (Math.hypot(gm.x - x, gm.y - y) < 10) { carry++; return false } return true })
      if (gems.length < 3) gems.push({ x: rnd(20, W - 20), y: rnd(80, H - 16) })
      if (air <= 0 || sharks.some((s) => Math.abs(s.x - x) < 14 && Math.abs(s.y - y) < 7)) game.over = true
      if (game.score > 0 && game.score % 1000 === 0) sharks.forEach((s) => (s.v *= 1.0005))
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.b; g.fillRect(0, 0, W, 32)
      g.fillStyle = p.dim; for (let i = 0; i < W; i += 16) g.fillRect(i, 30 + Math.sin(i + performance.now() / 300) * 2, 10, 2)
      g.fillStyle = p.c; gems.forEach((gm) => { g.beginPath(); g.moveTo(gm.x, gm.y - 5); g.lineTo(gm.x + 4, gm.y); g.lineTo(gm.x, gm.y + 5); g.lineTo(gm.x - 4, gm.y); g.fill() })
      g.fillStyle = p.a; sharks.forEach((s) => { g.fillRect(s.x - 12, s.y - 3, 24, 7); g.beginPath(); g.moveTo(s.x, s.y - 3); g.lineTo(s.x + (s.v > 0 ? -4 : 4), s.y - 9); g.lineTo(s.x + (s.v > 0 ? 4 : -4), s.y - 3); g.fill() })
      g.fillStyle = p.fg; g.fillRect(x - 5, y - 3, 10, 6); g.fillRect(x + 3, y - 5, 3, 3)
      g.fillStyle = air < 0.3 ? p.a : p.fg; g.fillRect(6, 20, air * 80, 5)
      text(g, 'AIR', 6, 16, 8, p.bg); text(g, `SCORE ${game.score}  BAG ${carry}`, W - 6, 16, 8, p.bg, 'right')
    },
  }
  return game
}

// ======================= HANDHELD =======================

// Mole Bop: tap the matching direction when a mole pops up.
export function moleBop(p: Pal): Game {
  const holes = [[W / 2, 60], [W / 2 + 70, H / 2 + 10], [W / 2, H - 40], [W / 2 - 70, H / 2 + 10]]
  const keys = ['u', 'r', 'd', 'l'] as const
  let up = -1, upT = 0, wait = 1, time = 45, miss = 0, flash = -1, flashT = 0
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      time -= dt; flashT -= dt
      if (time <= 0) game.over = true
      if (up < 0) { wait -= dt; if (wait <= 0) { up = Math.floor(Math.random() * 4); upT = Math.max(0.45, 1.1 - game.score * 0.02) } }
      else { upT -= dt; if (upT <= 0) { up = -1; wait = rnd(0.2, 0.7); miss++ } }
      keys.forEach((kk, i) => { if (k.hit(kk)) { flash = i; flashT = 0.15; if (i === up) { game.score++; up = -1; wait = rnd(0.15, 0.5) } else game.score = Math.max(0, game.score - 1) } })
    },
    draw(g) {
      clear(g, p)
      holes.forEach(([x, y], i) => {
        g.fillStyle = p.fg; g.beginPath(); g.ellipse(x, y + 10, 24, 8, 0, 0, 6.28); g.fill()
        if (i === up) { g.fillStyle = p.a; g.beginPath(); g.arc(x, y, 14, Math.PI, 0); g.fillRect(x - 14, y, 28, 10); g.fill(); g.fillStyle = p.bg; g.fillRect(x - 6, y - 5, 3, 3); g.fillRect(x + 3, y - 5, 3, 3) }
        if (flash === i && flashT > 0) { g.strokeStyle = p.fg; g.lineWidth = 2; g.strokeRect(x - 22, y - 20, 44, 36) }
      })
      text(g, `BOPS ${game.score}`, 6, 14, 8, p.fg); text(g, `TIME ${Math.ceil(Math.max(0, time))}`, W - 6, 14, 8, p.fg, 'right')
      text(g, 'ARROW = HOLE', W / 2, H / 2 + 14, 8, p.fg, 'center')
    },
  }
  return game
}

// Fishing Hole: drop the line when a fish swims under it, reel at the right moment.
export function fishingHole(p: Pal): Game {
  let hook = 30, state: 'idle' | 'drop' | 'bite' | 'reel' = 'idle', biteT = 0, time = 60, catchName = '', catchT = 0, hooked: { y: number; size: number } | null = null
  let fish = Array.from({ length: 6 }, () => ({ x: rnd(0, W), y: rnd(90, H - 14), v: rnd(15, 45) * (Math.random() < 0.5 ? 1 : -1), size: Math.floor(rnd(1, 4)) }))
  const names = ['', 'MINNOW', 'BASS', 'BIG CATFISH']
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      time -= dt; catchT -= dt
      if (time <= 0) game.over = true
      fish.forEach((f) => { f.x += f.v * dt; if (f.x < -10 || f.x > W + 10) f.v = -f.v })
      if (state === 'idle') { hook = 30; if (k.hit('a') || k.hit('d')) state = 'drop' }
      else if (state === 'drop') {
        hook = Math.min(H - 10, hook + (k.u ? -50 : 60) * dt)
        const f = fish.find((f) => Math.abs(f.x - W / 2) < 8 && Math.abs(f.y - hook) < 8)
        if (f) { state = 'bite'; biteT = 0.6; hooked = f; fish = fish.filter((q) => q !== f) }
        if (k.hit('a')) state = 'reel'
      } else if (state === 'bite') {
        biteT -= dt
        if (k.hit('a')) state = 'reel'
        else if (biteT <= 0) { if (hooked) fish.push({ x: W / 2, y: hooked.y, v: 60, size: hooked.size }); hooked = null; state = 'drop' }
      } else {
        hook -= 90 * dt
        if (hook <= 30) { if (hooked) { game.score += hooked.size * 10; catchName = names[hooked.size]; catchT = 1.5; fish.push({ x: -10, y: rnd(90, H - 14), v: rnd(15, 45), size: Math.floor(rnd(1, 4)) }) } hooked = null; state = 'idle' }
      }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; g.fillRect(0, 70, W, H - 70)
      g.fillStyle = p.fg; g.fillRect(W / 2 - 30, 40, 60, 8); g.fillRect(W / 2 - 2, 20, 3, 22)
      g.strokeStyle = p.fg; g.beginPath(); g.moveTo(W / 2, 22); g.lineTo(W / 2, hook); g.stroke()
      g.fillRect(W / 2 - 2, hook - 2, 4, 4)
      fish.forEach((f) => { g.fillStyle = p.fg; g.beginPath(); g.ellipse(f.x, f.y, 5 + f.size * 3, 3 + f.size, 0, 0, 6.28); g.fill(); g.fillRect(f.x - Math.sign(f.v) * (6 + f.size * 3), f.y - 3, 3, 6) })
      if (hooked) { g.fillStyle = p.a; g.beginPath(); g.ellipse(W / 2, hook + 6, 5 + hooked.size * 3, 3 + hooked.size, Math.PI / 2, 0, 6.28); g.fill() }
      if (state === 'bite') text(g, '! BITE ! SPACE', W / 2, 64, 8, p.fg, 'center')
      if (catchT > 0) text(g, `CAUGHT A ${catchName}!`, W / 2, 64, 8, p.fg, 'center')
      text(g, `POINTS ${game.score}`, 6, 14, 8, p.fg); text(g, `TIME ${Math.ceil(Math.max(0, time))}`, W - 6, 14, 8, p.fg, 'right')
      if (state === 'idle') text(g, 'SPACE CAST', W / 2, 64, 8, p.fg, 'center')
    },
  }
  return game
}

// Lights Off: toggling a light flips its neighbors. Turn them all off.
export function lightsOff(p: Pal): Game {
  const N = 5
  let b = Array(N * N).fill(false), cx = 2, cy = 2, level = 1, moves = 0
  const flip = (x: number, y: number) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] = !b[ny * N + nx] })
  const setup = () => { b = Array(N * N).fill(false); for (let i = 0; i < 3 + level * 2; i++) flip(Math.floor(Math.random() * N), Math.floor(Math.random() * N)); if (!b.some(Boolean)) flip(2, 2); moves = 0 }
  setup()
  const press = (x: number, y: number) => { flip(x, y); moves++; if (!b.some(Boolean)) { game.score += Math.max(10, 50 - moves); level++; setup() } }
  const S = 34, ox = (W - N * S) / 2, oy = 30
  const game: Game = {
    over: false, score: 0,
    update(_, k) {
      if (k.hit('l')) cx = Math.max(0, cx - 1); if (k.hit('r')) cx = Math.min(N - 1, cx + 1)
      if (k.hit('u')) cy = Math.max(0, cy - 1); if (k.hit('d')) cy = Math.min(N - 1, cy + 1)
      if (k.hit('a')) press(cx, cy)
      if (k.hit('b')) setup()
    },
    click(x, y) { const gx = Math.floor((x - ox) / S), gy = Math.floor((y - oy) / S); if (gx >= 0 && gy >= 0 && gx < N && gy < N) { cx = gx; cy = gy; press(gx, gy) } },
    draw(g) {
      clear(g, p)
      b.forEach((on, i) => { g.fillStyle = on ? p.fg : p.dim; g.fillRect(ox + (i % N) * S + 2, oy + Math.floor(i / N) * S + 2, S - 4, S - 4) })
      g.strokeStyle = p.c; g.lineWidth = 2; g.strokeRect(ox + cx * S + 1, oy + cy * S + 1, S - 2, S - 2)
      text(g, `LEVEL ${level}  MOVES ${moves}`, 6, 14, 8, p.fg); text(g, `SCORE ${game.score}`, W - 6, 14, 8, p.fg, 'right')
      text(g, 'SPACE PRESS · X NEW PUZZLE', W / 2, H - 6, 7, p.fg, 'center')
    },
  }
  return game
}

// ======================= COMPUTER =======================

// Type Attack: words fall from the sky. Type them before they land.
const WORDS = 'modem disk mouse pixel floppy cursor email chat buddy away music mix burn rewind tape pager arcade joystick cartridge static antenna remote cereal bean lava lamp basement couch vinyl needle record player sleepover pizza soda mixtape boombox walkman screen saver dial tone keyboard window folder'.split(' ')
export function typeAttack(p: Pal): Game {
  let words: { w: string; x: number; y: number; v: number }[] = [], typed = '', spawn = 0, lives = 5, t = 0
  const game: Game = {
    over: false, score: 0,
    update(dt) {
      t += dt; spawn -= dt
      if (spawn <= 0) { const w = WORDS[Math.floor(Math.random() * WORDS.length)]; words.push({ w, x: rnd(10, W - w.length * 7 - 10), y: 20, v: 12 + t * 0.4 }); spawn = Math.max(0.9, 2.6 - t * 0.02) }
      words.forEach((w) => (w.y += w.v * dt))
      const landed = words.filter((w) => w.y > H - 20)
      if (landed.length) { lives -= landed.length; words = words.filter((w) => w.y <= H - 20); if (lives <= 0) game.over = true }
    },
    key(k) {
      if (k === 'Backspace') { typed = typed.slice(0, -1); return }
      if (!/^[a-z]$/i.test(k)) return
      typed += k.toLowerCase()
      if (!words.some((w) => w.w.startsWith(typed))) typed = words.some((w) => w.w.startsWith(k.toLowerCase())) ? k.toLowerCase() : ''
      const done = words.find((w) => w.w === typed)
      if (done) { game.score += done.w.length * 10; words = words.filter((w) => w !== done); typed = '' }
    },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.dim; g.fillRect(0, H - 20, W, 1)
      words.forEach((w) => {
        const match = typed && w.w.startsWith(typed)
        text(g, w.w, w.x, w.y, 10, p.fg)
        if (match) text(g, typed, w.x, w.y, 10, p.c)
      })
      text(g, `> ${typed}_`, 6, H - 6, 10, p.c)
      text(g, `SCORE ${game.score}`, 6, 12, 8, p.fg); text(g, `LIVES ${'♥'.repeat(Math.max(0, lives))}`, W - 6, 12, 8, p.a, 'right')
    },
  }
  return game
}

// Fifteen: classic sliding-tile puzzle.
export function fifteen(p: Pal): Game {
  let b = [...Array(15).keys()].map((i) => i + 1).concat(0)
  const moveTile = (i: number) => { const e = b.indexOf(0); const ok = (Math.abs(i - e) === 1 && Math.floor(i / 4) === Math.floor(e / 4)) || Math.abs(i - e) === 4; if (ok) { b[e] = b[i]; b[i] = 0; return true } return false }
  for (let n = 0; n < 300; n++) { const e = b.indexOf(0); const opts = [e - 1, e + 1, e - 4, e + 4].filter((i) => i >= 0 && i < 16); moveTile(opts[Math.floor(Math.random() * opts.length)]) }
  let moves = 0, solved = false
  const S = 44, ox = (W - S * 4) / 2, oy = 28
  const slide = (dx: number, dy: number) => { const e = b.indexOf(0), ex = e % 4, ey = Math.floor(e / 4), sx = ex - dx, sy = ey - dy; if (sx >= 0 && sx < 4 && sy >= 0 && sy < 4 && moveTile(sy * 4 + sx)) after() }
  const after = () => { moves++; if (b.slice(0, 15).every((v, i) => v === i + 1)) { solved = true; game.score = Math.max(10, 1000 - moves * 5); game.over = true } }
  const game: Game = {
    over: false, score: 0,
    update(_, k) { if (k.hit('l')) slide(-1, 0); if (k.hit('r')) slide(1, 0); if (k.hit('u')) slide(0, -1); if (k.hit('d')) slide(0, 1) },
    click(x, y) { const gx = Math.floor((x - ox) / S), gy = Math.floor((y - oy) / S); if (gx >= 0 && gy >= 0 && gx < 4 && gy < 4 && moveTile(gy * 4 + gx)) after() },
    draw(g) {
      clear(g, p)
      b.forEach((v, i) => { if (!v) return; const x = ox + (i % 4) * S, y = oy + Math.floor(i / 4) * S; g.fillStyle = v === i + 1 ? p.b : p.dim; g.fillRect(x + 2, y + 2, S - 4, S - 4); text(g, String(v), x + S / 2, y + S / 2 + 5, 14, p.fg, 'center') })
      text(g, solved ? 'SOLVED!' : `MOVES ${moves}`, W / 2, 16, 8, p.fg, 'center')
      text(g, 'CLICK A TILE or ARROWS', W / 2, H - 6, 7, p.fg, 'center')
    },
  }
  return game
}

// Flip Side: disc-flipping strategy game vs the computer (mouse or keys).
export function flipSide(p: Pal): Game {
  const N = 8
  const b = Array(64).fill(0); b[27] = b[36] = -1; b[28] = b[35] = 1
  let cx = 2, cy = 3, turn = 1, aiT = 0, msg = ''
  const flips = (i: number, who: number) => {
    if (b[i]) return []
    const out: number[] = []
    const x = i % N, y = Math.floor(i / N)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const run: number[] = []
      let nx = x + dx, ny = y + dy
      while (nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === -who) { run.push(ny * N + nx); nx += dx; ny += dy }
      if (run.length && nx >= 0 && ny >= 0 && nx < N && ny < N && b[ny * N + nx] === who) out.push(...run)
    }
    return out
  }
  const legal = (who: number) => b.map((_, i) => i).filter((i) => flips(i, who).length)
  const play = (i: number, who: number) => { const f = flips(i, who); if (!f.length) return false; b[i] = who; f.forEach((j) => (b[j] = who)); return true }
  const finish = () => { const me = b.filter((v) => v === 1).length, them = b.filter((v) => v === -1).length; game.score = me; msg = me > them ? 'YOU WIN' : me < them ? 'CPU WINS' : 'DRAW'; game.over = true }
  const next = () => { turn = -turn; if (!legal(turn).length) { turn = -turn; if (!legal(turn).length) finish() } }
  const S = 24, ox = (W - N * S) / 2, oy = 20
  const human = (i: number) => { if (turn === 1 && play(i, 1)) { next(); aiT = 0.6 } }
  const game: Game = {
    over: false, score: 0,
    update(dt, k) {
      if (k.hit('l')) cx = Math.max(0, cx - 1); if (k.hit('r')) cx = Math.min(N - 1, cx + 1)
      if (k.hit('u')) cy = Math.max(0, cy - 1); if (k.hit('d')) cy = Math.min(N - 1, cy + 1)
      if (k.hit('a')) human(cy * N + cx)
      if (turn === -1) {
        aiT -= dt
        if (aiT <= 0) {
          const corners = [0, 7, 56, 63]
          const opts = legal(-1).sort((a, c) => (corners.includes(c) ? 100 : 0) + flips(c, -1).length - ((corners.includes(a) ? 100 : 0) + flips(a, -1).length))
          if (opts.length) play(opts[0], -1)
          next()
        }
      }
    },
    click(x, y) { const gx = Math.floor((x - ox) / S), gy = Math.floor((y - oy) / S); if (gx >= 0 && gy >= 0 && gx < N && gy < N) { cx = gx; cy = gy; human(gy * N + gx) } },
    draw(g) {
      clear(g, p)
      g.fillStyle = p.b; g.fillRect(ox, oy, N * S, N * S)
      const hints = turn === 1 ? legal(1) : []
      for (let i = 0; i < 64; i++) {
        const x = ox + (i % N) * S, y = oy + Math.floor(i / N) * S
        g.strokeStyle = p.bg; g.strokeRect(x, y, S, S)
        if (b[i]) { g.fillStyle = b[i] === 1 ? p.fg : p.bg; g.beginPath(); g.arc(x + S / 2, y + S / 2, S / 2 - 3, 0, 6.28); g.fill() }
        else if (hints.includes(i)) { g.fillStyle = p.c; g.fillRect(x + S / 2 - 2, y + S / 2 - 2, 4, 4) }
      }
      g.strokeStyle = p.c; g.lineWidth = 2; g.strokeRect(ox + cx * S + 1, oy + cy * S + 1, S - 2, S - 2); g.lineWidth = 1
      text(g, `YOU ${b.filter((v) => v === 1).length}`, 6, 12, 8, p.fg); text(g, `CPU ${b.filter((v) => v === -1).length}`, W - 6, 12, 8, p.fg, 'right')
      text(g, msg || (turn === 1 ? 'YOUR MOVE (yellow dots)' : 'CPU THINKING...'), W / 2, 12, 8, p.c, 'center')
    },
  }
  return game
}
