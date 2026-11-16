const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),THREE=require('three'),assert=require('node:assert/strict')
for(const kind of ['tape','cartridge']) {
  let frame,keydown,refIndex=0
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,1.6,-0.2);camera.lookAt(kind==='tape'?new THREE.Vector3(0,0.19,-1.32):new THREE.Vector3(-0.65,0.61,-1.6))
  const state={heldMedia:{kind,id:kind==='tape'?'friday':'rally',title:'Test media'},arriving:false,playingGame:false,menuOpen:false,electronics:null,setHint(){},playFilm(id){this.filmId=id},playGame(id){this.gameId=id;this.playingGame=true}}
  const store=fn=>fn(state);store.getState=()=>state;store.setState=values=>Object.assign(state,values)
  const ctx=new Proxy({},{get:()=>()=>{}})
  const prefs={reducedMotion:false,consolePower:true,change(){}}
  const jsx=(type,props)=>({type,props})
  const imports={
    react:{useEffect:fn=>fn(),useMemo:fn=>fn(),useRef:value=>({current:refIndex++===0?new THREE.Group():value})},
    'react/jsx-runtime':{jsx,jsxs:jsx},'@react-three/fiber':{useThree:()=>({camera}),useFrame:fn=>{frame=fn}},three:THREE,
    '../store':{useStore:store,openDevice:d=>{state.electronics=d}},'../preferences':{usePreferences:Object.assign(fn=>fn(prefs),{getState:()=>prefs})},
    '../library':{FILMS:[{id:'friday',title:'Test film'}],GAMES:[{id:'rally',title:'Test game'}]},'./Furniture':{FurnitureBox:()=>null},
  }
  const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/scene/MediaRitual.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:out,require:n=>imports[n],window:{addEventListener:(n,f)=>{if(n==='keydown')keydown=f},removeEventListener(){}},document:{createElement:()=>({getContext:()=>ctx})}})
  out.MediaRitual();frame(null,0.01);keydown({code:'KeyE',stopImmediatePropagation(){}})
  for(let i=0;i<60;i++)frame(null,1/60)
  assert.equal(state.heldMedia,null,`${kind} must leave the player's hand`)
  assert.equal(kind==='tape'?state.insertedTape:state.insertedCartridge,kind==='tape'?'friday':'rally')
  assert.equal(kind==='tape'?state.filmId:state.gameId,kind==='tape'?'friday':'rally',`${kind} must play after insertion`)
}
console.log('PASS: selecting and inserting a tape/cartridge transfers it from hand to device and starts the selected content')
