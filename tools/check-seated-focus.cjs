const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),THREE=require('three'),assert=require('node:assert/strict')
const load=(path,imports,extra={})=>{const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,require:n=>imports[n],...extra});return out}
const layout=load('src/scene/layout.ts',{})
const camera=new THREE.PerspectiveCamera(70,16/9); camera.position.set(...layout.SEATS[1].eye)
const originalPosition=camera.position.clone(), originalRotation=camera.quaternion.clone()
const state={seated:1,arriving:false,menuOpen:false,seatZoom:0,setSeatZoom(v){this.seatZoom=Math.max(0,Math.min(1,v))}}
const listeners={};let frame
const mod=load('src/scene/SeatedFocus.tsx',{react:{useEffect:fn=>fn()},'@react-three/fiber':{useThree:()=>({camera}),useFrame:fn=>{frame=fn}},three:THREE,'../store':{useStore:{getState:()=>state}},'./layout':layout,'../preferences':{usePreferences:{getState:()=>({reducedMotion:false})}}},{window:{addEventListener:(n,f)=>{listeners[n]=f},removeEventListener(){}}})
mod.SeatedFocus()
const wheel={target:{closest:()=>null},deltaY:-120,deltaMode:0,preventDefault(){}}
for(let i=0;i<10;i++) listeners.wheel(wheel)
for(let i=0;i<120;i++) frame(null,1/60)
assert(camera.fov<30 && camera.fov>10,'Zoom must enlarge the TV without extreme cropping')
assert(camera.position.equals(originalPosition) && camera.quaternion.equals(originalRotation),'Zoom must preserve seat position and free-look direction')
const before=state.seatZoom
listeners.wheel({...wheel,target:{closest:()=>({})},deltaY:120})
assert.equal(state.seatZoom,before,'Scrolling a device panel must not change zoom')
state.seated=null
for(let i=0;i<120;i++) frame(null,1/60)
assert(Math.abs(camera.fov-70)<0.02,'Standing must restore the room view')
const normal=mod.focusedFov(3.4,16/9,false),portrait=mod.focusedFov(3.4,0.5,false)
assert(portrait>normal,'Narrow viewports need a wider framing to retain the TV sides')
console.log('PASS: seated zoom, preserved free look, panel scroll exclusion, standing reset, narrow viewport framing')
