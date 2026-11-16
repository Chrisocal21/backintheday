const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict')
const path=require('node:path'),cache=new Map();let seed=107
const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const out={};cache.set(file,out);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:out,require:n=>load(path.resolve(path.dirname(file),n+'.ts')),Math:math,performance:{now:()=>1234},console},{filename:file});return out}
const {STATIONS}=load('src/stations/catalog.ts'),{makeKeys}=load('src/stations/games.ts')
const context=new Proxy({canvas:{width:256,height:224},measureText:s=>({width:String(s).length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),`${String(k)} received non-finite geometry`);if(k==='arc')assert(args[2]>=0,'Negative circle radius');if(k==='ellipse')assert(args[2]>=0&&args[3]>=0,'Negative ellipse radius')},set:(o,k,v)=>{o[k]=v;return true}})
let entries=0,frames=0;const unique=new Set()
for(const station of Object.values(STATIONS)) {
  const ids=new Set()
  for(const cart of station.games) {
    assert(!ids.has(cart.id),`${station.id} has duplicate ID ${cart.id}`);ids.add(cart.id);entries++;unique.add(cart.make)
    assert(cart.title&&cart.controls&&cart.genre&&cart.blurb&&cart.styleYear,'Incomplete browser metadata')
    for(let mode=0;mode<3;mode++) {
      const game=cart.make(station.pal),keys=makeKeys()
      for(let i=0;i<1200;i++) {
        if(mode&&i%20===0){for(const c of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyX'])keys.press(c,math.random()<0.28)}
        if(mode===2&&i%100===0){game.click?.(20+math.random()*210,28+math.random()*170,math.random()<0.2);game.key?.('star'[i%4])}
        if(!game.over)game.update(1/60,keys)
        game.draw(context);frames++
        assert(Number.isFinite(game.score),`${station.id}/${cart.id} has invalid score`)
        assert.equal(typeof game.over,'boolean')
        if(game.over)break
      }
    }
  }
  console.log(`${station.name}: ${station.games.length} games passed`)
}
console.log(`PASS: ${entries} device entries / ${unique.size} distinct game implementations / ${frames} simulated frames, with update, draw, keyboard and pointer input`)
