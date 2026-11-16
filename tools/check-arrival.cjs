const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), THREE = require('three'), assert = require('node:assert/strict')
for (const skip of [false, true]) {
  let frame
  const camera = new THREE.PerspectiveCamera()
  const state = { arriving: true, seated:null, finishArrival() { this.arriving = false } }
  const imports = {react:{useRef:current=>({current})}, '@react-three/fiber':{useFrame:fn=>{frame=fn}},three:THREE,'../store':{useStore:{getState:()=>state}},'../preferences':{usePreferences:{getState:()=>({reducedMotion:false,rememberSeat:false})}},'./layout':{SEATS:[],TV_SCREEN:[0,0.87,-1.29]}}
  const exportsMock = {}
  const code = ts.transpileModule(fs.readFileSync('src/scene/Arrival.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  vm.runInNewContext(code,{exports:exportsMock,require:name=>imports[name]})
  exportsMock.Arrival()
  frame({camera},1/60)
  assert(camera.position.y>3.9,'Arrival must begin at the stair landing')
  if(skip) state.finishArrival()
  for(let i=0;i<400;i++) frame({camera},1/60)
  assert(!state.arriving,'Arrival must release movement')
  assert(camera.position.distanceTo(new THREE.Vector3(...exportsMock.ARRIVAL_END))<0.001,'Arrival must end at the walkable basement exit')
}
console.log('PASS: stair descent and skip both release the player at the basement exit')
