const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path'),assert=require('node:assert/strict')
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true})
const cache=new Map(),stubRoom={recordPlaying:true},stubPrefs={cassettePlaying:true,change(k,v){this[k]=v}}
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const out={};cache.set(file,out);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:out,require:n=>n==='../store'?{useStore:{setState:v=>Object.assign(stubRoom,v)}}:n==='../preferences'?{usePreferences:{getState:()=>stubPrefs}}:n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),localStorage:storage,console,Math},{filename:file});return out}
const {LISTENING}=load('src/listening/catalog.ts'),{useListening:s}=load('src/listening/state.ts'),{useLibraryShelf:shelf}=load('src/libraryShelf.ts')
assert.equal(LISTENING.length,34);assert.equal(LISTENING.filter(t=>t.format==='record').length,11);assert.equal(new Set(LISTENING.map(t=>t.id)).size,34)
for(const t of LISTENING){assert(t.creator&&t.note&&t.verified&&t.license);for(const field of ['url','source','licenseUrl'])assert.equal(new URL(t[field]).protocol,'https:');if(t.format==='tape')assert(t.duration>0)}
const a=LISTENING[0],tape=LISTENING.find(t=>t.format==='tape')
s.getState().play('record',a.id);assert(!stubRoom.recordPlaying);assert(s.getState().record.playing)
s.getState().update('record',{time:32});s.getState().toggle('record');assert(!s.getState().record.playing);assert.equal(s.getState().record.time,32)
s.getState().toggle('record');assert(s.getState().record.playing)
s.getState().play('tape',tape.id);assert(!stubPrefs.cassettePlaying);assert(s.getState().record);assert(s.getState().tape)
s.getState().play('record',tape.id);assert.equal(s.getState().record.id,a.id,'format mismatch must not replace selection')
s.setState({mode:'repeat'});const request=s.getState().record.request;s.getState().next('record',1,true);assert.equal(s.getState().record.id,a.id);assert(s.getState().record.request>request)
s.getState().next('record');assert.notEqual(s.getState().record.id,a.id,'manual next must escape repeat')
s.setState({mode:'shuffle'});const before=s.getState().record.id;s.getState().next('record');assert.notEqual(s.getState().record.id,before)
shelf.getState().toggle('game:computer:pegs');shelf.getState().remember('game:computer:pegs');shelf.getState().remember('game:computer:pegs');assert.equal(shelf.getState().recent.filter(k=>k==='game:computer:pegs').length,1)
cache.delete(path.resolve('src/libraryShelf.ts'));assert(load('src/libraryShelf.ts').useLibraryShelf.getState().favorites.includes('game:computer:pegs'))
s.getState().stop('record');assert.equal(s.getState().record,null);assert(s.getState().tape)
console.log('PASS: 34 credited recordings; device isolation, pause, repeat/manual-next/shuffle, synth handoff, replay requests, persistent favorites/recent')
