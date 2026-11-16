// Exercise the actual Player frame callback with browser mouse capture unavailable.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const THREE = require('three')
const listeners = new Map()
const windowMock = {
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener() {},
}
const documentMock = { ...windowMock, pointerLockElement: null, exitPointerLock() {}, getElementById() { return null } }
const state = { locked: true, menuOpen: false, seated: null, setLocked(v) { this.locked = v }, setElectronics() {} }
const camera = new THREE.PerspectiveCamera()
camera.position.set(0, 1.6, 3.5)
let frame
function load(file, imports) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
  const exports = {}
  vm.runInNewContext(source, { exports, require: name => imports[name], window: windowMock, document: documentMock, navigator: { getGamepads: () => [] }, console })
  return exports
}
const layout = load('src/scene/layout.ts', {})
const { Player } = load('src/scene/Player.tsx', {
  react: { useEffect: fn => fn(), useRef: current => ({ current }) },
  '@react-three/fiber': { useThree: () => ({ camera }), useFrame: fn => { frame = fn } },
  three: THREE, './layout': layout, '../store': { useStore: { getState: () => state } },
})
Player()
const key = (code, kind = 'keydown') => listeners.get(kind)({ code, preventDefault() {} })
key('KeyW')
for (let i = 0; i < 10; i++) frame(null, 1 / 60)
assert(camera.position.z < 3.1, 'W must move forward without pointer lock')
key('KeyW', 'keyup')
key('KeyD')
frame(null, 1 / 60)
assert(camera.position.x > 0, 'D must strafe right')
key('KeyD', 'keyup')
const pausedPosition = camera.position.clone()
state.menuOpen = true
key('KeyW'); frame(null, 1 / 60)
assert(camera.position.equals(pausedPosition), 'Input menus must block walking')
state.menuOpen = false
state.seated = 1
key('KeyW'); frame(null, 1 / 60)
assert(camera.position.equals(pausedPosition), 'Sitting must block walking')
state.seated = null
key('KeyW', 'keyup')
key('Escape')
frame(null, 1 / 60)
assert(state.locked && camera.position.equals(pausedPosition), 'Escape frees the mouse while leaving walking available')
key('KeyW'); frame(null, 1 / 60)
assert(camera.position.z < pausedPosition.z, 'W must still work after Escape')
key('KeyW', 'keyup')
const beforeGame = camera.position.clone()
state.playingGame = true
key('KeyW'); frame(null, 1 / 60)
assert(camera.position.equals(beforeGame), 'Game controls must not move the room camera')
state.playingGame = false
console.log('PASS: WASD without mouse capture, strafe, menu, seat, Escape')
