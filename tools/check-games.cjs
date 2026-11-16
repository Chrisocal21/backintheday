const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict')
for(const id of ['rally','snake']) {
  const handlers = {}, labels = []
  let frame
  const state = {playingGame:true,stopGame(){this.playingGame=false}}
  const store = fn => fn(state); store.getState=()=>state
  const ctx = new Proxy({fillText:s=>labels.push(s)}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true}})
  let cleanup
  const imports = {
    react:{useRef:()=>({current:{getContext:()=>ctx}}),useEffect:fn=>{cleanup=fn()}},
    'react/jsx-runtime':{jsx:()=>null},
    '../store':{useStore:store},'../library':{GAMES:[{id:'rally',title:'Basement Rally'},{id:'snake',title:'Night Snake'}]},
  }
  const code = ts.transpileModule(fs.readFileSync('src/scene/GameScreen.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  const exportsMock={}
  vm.runInNewContext(code,{exports:exportsMock,require:n=>imports[n],window:{addEventListener:(n,f)=>{handlers[n]=f},removeEventListener(){}},navigator:{getGamepads:()=>[]},requestAnimationFrame:f=>{frame=f;return 1},cancelAnimationFrame(){}})
  exportsMock.GameScreen({id})
  handlers.keydown({code:'KeyW',preventDefault(){}})
  for(let i=0;i<300;i++) frame(i*16.67)
  handlers.keydown({code:'Space',preventDefault(){}})
  frame(5017)
  assert(labels.some(s=>s.includes('ESC EXIT')),`${id} must render game controls`)
  handlers.keydown({code:'Escape',preventDefault(){}})
  assert(!state.playingGame,`${id} must release controls on Escape`)
  cleanup()
}
console.log('PASS: both TV games render, accept keys/restart, and release controls on Escape')
