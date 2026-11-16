const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const assert = require('node:assert/strict')
const exportsMock = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/scene/layout.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsMock })
const { COLLIDERS, PLAYER_RADIUS: r, ROOM, SEATS } = exportsMock
const blocked = (x, z) => Math.abs(x) > ROOM.half-r || Math.abs(z) > ROOM.half-r || COLLIDERS.some(([x0,z0,x1,z1]) => (x-Math.max(x0,Math.min(x,x1)))**2 + (z-Math.max(z0,Math.min(z,z1)))**2 < r*r)
const key = (x,z) => `${x},${z}`
const queue = [[0,35]], seen = new Set(['0,35'])
for(let i=0;i<queue.length;i++) {
  const [x,z] = queue[i]
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const a=x+dx,b=z+dz,k=key(a,b)
    if(!seen.has(k) && !blocked(a/10,b/10)) { seen.add(k); queue.push([a,b]) }
  }
}
const targets = [
  ['stair arrival exit', -1.65,-2.8],
  ['record player', -3.6,-3.9], ['arcade',3.7,-3.6], ['computer',3.9,3.1], ['TV',0,-0.8],
  ['disc console',3.8,4.4], ['woodgrain console',2.75,-3.75], ['handheld',-4,2.1], ['cassette deck',2.3,-3.8],
  ...SEATS.map((s,i) => [`seat ${i} stand-up position`, ...s.stand]),
]
for(const [name,x,z] of targets) {
  assert(!blocked(x,z), `${name} overlaps a collision boundary`)
  assert(seen.has(key(Math.round(x*10),Math.round(z*10))), `${name} is unreachable from entry`)
}
console.log(`PASS: ${targets.length} electronics approaches and stand-up positions reachable with player clearance`)
