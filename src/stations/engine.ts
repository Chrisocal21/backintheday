// Tiny retro game engine. Every game here is original code (genre nods only, invented names): free to use.
export const W = 256, H = 224

export type Pal = { bg: string; fg: string; a: string; b: string; c: string; dim: string }
export type Keys = { l: boolean; r: boolean; u: boolean; d: boolean; a: boolean; b: boolean; hit: (k: 'l' | 'r' | 'u' | 'd' | 'a' | 'b') => boolean }
export type Game = {
  update: (dt: number, k: Keys) => void
  draw: (g: CanvasRenderingContext2D) => void
  click?: (x: number, y: number, right: boolean) => void
  key?: (key: string) => void // raw typed key, for typing games
  over: boolean
  score: number
}

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size = 8, color = '#fff', align: CanvasTextAlign = 'left') {
  g.fillStyle = color
  g.font = `bold ${size}px monospace`
  g.textAlign = align
  g.fillText(s, x, y)
}
export function clear(g: CanvasRenderingContext2D, p: Pal) {
  g.fillStyle = p.bg
  g.fillRect(0, 0, W, H)
}
export const hitBox = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
