const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict')
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true})
let save
const handlers={}
function load(file,imports={}) {
  const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,require:n=>n in imports?imports[n]:require(n),localStorage:storage,performance:{now:()=>1},setTimeout:fn=>{save=fn;return 1},clearTimeout(){},window:{addEventListener:(n,f)=>{handlers[n]=f}},document:{exitPointerLock(){}}});return out
}
const prefs=load('src/preferences.ts')
prefs.usePreferences.getState().change('weather','rain')
prefs.usePreferences.getState().change('master',0)
prefs.usePreferences.getState().change('hideHints',true)
prefs.usePreferences.getState().change('favorites',[{id:'channel:2',name:'Late TV'}])
const restored=load('src/preferences.ts').usePreferences.getState()
assert.equal(restored.weather,'rain');assert.equal(restored.master,0);assert(restored.hideHints);assert.equal(restored.favorites[0].name,'Late TV')
const channels={CHANNELS:[{},{},{},{}]}
const store=load('src/store.ts',{'./preferences':prefs,'./channels':channels}).useStore
store.getState().setLightLevel(0.31);store.getState().setSeated(1);store.getState().setSeatZoom(0.72);save()
const saved=JSON.parse(data.get(prefs.ROOM_SAVE_KEY))
assert.equal(saved.lightLevel,0.31);assert.equal(saved.seated,1);assert.equal(saved.seatZoom,0.72);assert(!('locked' in saved));assert(!('playingGame' in saved))
const roomAgain=load('src/store.ts',{'./preferences':prefs,'./channels':channels}).useStore.getState()
assert.equal(roomAgain.seated,1);assert.equal(roomAgain.seatZoom,0.72)
prefs.usePreferences.getState().change('rememberSeat',false);handlers.pagehide()
assert.equal(JSON.parse(data.get(prefs.ROOM_SAVE_KEY)).seated,null)
data.set(prefs.ROOM_SAVE_KEY,JSON.stringify({lightLevel:Infinity,channel:99,seated:99,seatZoom:2}))
const invalid=prefs.readRoom();assert(!('channel' in invalid));assert(!('seated' in invalid));assert.equal(invalid.seatZoom,1)
console.log('PASS: preferences/favorites persist, seat/zoom restore, opt-out works, transient state is excluded, invalid saved fields are rejected')
