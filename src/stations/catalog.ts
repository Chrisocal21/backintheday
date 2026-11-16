import type { Game, Pal } from './engine'
import * as G from './games'
import * as G2 from './games2'
import * as G3 from './games3'

// Each device in the room is its own system with its own library and look.
export type StationId = 'arcade' | 'console' | 'handheld' | 'computer' | 'disc'

export type Cart = { id: string; title: string; genre: string; blurb: string; controls: string; styleYear?:number; make: (p: Pal) => Game }

export type Station = {
  id: StationId
  name: string // invented brand
  era: string
  kind: string
  pal: Pal
  frame: string // CSS class for the device bezel
  where: string
  games: Cart[]
}

const MOVE = 'Arrows / WASD'
export const STATIONS: Record<StationId, Station> = {
  arcade: {
    id: 'arcade', name: 'NIGHT ORBIT 8-in-1', era: '80s', kind: 'Arcade cabinet', frame: 'st-arcade', where: '80s corner',
    pal: { bg: '#07061a', fg: '#e8f4ff', a: '#ff3f7a', b: '#ffb13f', c: '#3fffd0', dim: '#3a3870' },
    games: [
      { id: 'orbit', title: 'Night Orbit', genre: 'Ring shooter', blurb: 'Circle the ring and blast what crawls out of the core.', controls: '← → orbit · Space fire', make: G.nightOrbit },
      { id: 'rocks', title: 'Rock Drift', genre: 'Space shooter', blurb: 'Thrust, turn and split drifting space rocks.', controls: '← → turn · ↑ thrust · Space fire', make: G.rockDrift },
      { id: 'siege', title: 'Sky Siege', genre: 'Formation shooter', blurb: 'Hold the line as the formation creeps down.', controls: '← → move · Space fire', make: G.skySiege },
      { id: 'bricks', title: 'Brick Bash', genre: 'Paddle & bricks', blurb: 'Bounce the ball and clear the wall.', controls: '← → paddle · Space launch', make: G.brickBash },
      { id: 'tanks', title: 'Tank Alley', genre: 'Duel', blurb: 'Bank shells off walls to beat the CPU tank to 5.', controls: '← → turn · ↑ ↓ drive · Space fire', make: G.tankMaze },
      { id: 'shield', title: 'City Shield', genre: 'Missile defense', blurb: 'Detonate interceptors in the sky to save six cities.', controls: 'Arrows aim · Space fire (or click)', make: G2.cityShield },
      { id: 'muncher', title: 'Maze Muncher', genre: 'Maze chase', blurb: 'Eat every dot. Big dots let you chase the chasers.', controls: MOVE, make: G2.mazeMuncher },
      { id: 'skyline', title: 'Skyline Strike', genre: 'Vertical shooter', blurb: 'Fly up the night sky, grab P for more guns.', controls: 'Arrows fly · Space fire', make: G2.skylineStrike },
    ],
  },
  console: {
    id: 'console', name: 'HEARTH 2400', era: '70s–80s', kind: 'Wood-grain home console', frame: 'st-console', where: 'rolling TV cart, 80s corner',
    pal: { bg: '#10203a', fg: '#f0e6c8', a: '#e0553a', b: '#3fa04a', c: '#f2c12e', dim: '#4a5a7a' },
    games: [
      { id: 'duel', title: 'Paddle Duel', genre: 'Paddle tennis', blurb: 'The original living-room sport. First to 7.', controls: '↑ ↓ paddle', make: G.paddleDuel },
      { id: 'hopper', title: 'Road Hopper', genre: 'Crossing', blurb: 'Hop across twelve lanes of traffic. Rest on the median.', controls: `${MOVE} hop`, make: G.roadHopper },
      { id: 'moon', title: 'Moon Hopper', genre: 'Lander', blurb: 'Feather the thrust and touch down on the pad.', controls: '← → tilt · ↑ thrust', make: G.moonHopper },
      { id: 'echo', title: 'Color Echo', genre: 'Memory', blurb: 'Watch the lights, then play them back.', controls: 'Arrows match the lights', make: G.colorEcho },
      { id: 'bowl', title: 'Bowl-O-Rama', genre: 'Bowling', blurb: 'Ten frames. Pick your spot, lock the aim, nail the power.', controls: '← → spot · Space aim · Space power', make: G2.bowlORama },
      { id: 'diver', title: 'Sea Diver', genre: 'Underwater', blurb: 'Grab treasure, surface for air, dodge the sharks.', controls: MOVE, make: G2.seaDiver },
      { id: 'tanks', title: 'Tank Alley', genre: 'Duel', blurb: 'Home version of the arcade tank duel.', controls: '← → turn · ↑ ↓ drive · Space fire', make: G.tankMaze },
    ],
  },
  handheld: {
    id: 'handheld', name: 'POCKET BRICK', era: '90s', kind: 'Handheld', frame: 'st-handheld', where: 'floor by the 90s bean bag',
    pal: { bg: '#9bbc0f', fg: '#0f380f', a: '#306230', b: '#306230', c: '#0f380f', dim: '#8bac0f' },
    games: [
      { id: 'stack', title: 'Stack Attack', genre: 'Falling blocks', blurb: 'Fit the falling pieces and clear lines.', controls: '← → move · ↑ rotate · ↓ drop · Space slam', make: G.stackAttack },
      { id: 'worm', title: 'Glow Worm', genre: 'Snake', blurb: 'Eat, grow, and don’t bite yourself.', controls: MOVE, make: G.glowWorm },
      { id: 'racer', title: 'Pocket Racer', genre: 'Racing', blurb: 'Swerve through traffic as the road speeds up.', controls: '← → change lanes', make: G.pocketRacer },
      { id: 'echo', title: 'Beep Echo', genre: 'Memory', blurb: 'The pattern game, now in your pocket.', controls: 'Arrows match the lights', make: G.colorEcho },
      { id: 'mole', title: 'Mole Bop', genre: 'Reflex', blurb: '45 seconds. Bop each mole with the matching arrow.', controls: 'Arrow = hole', make: G2.moleBop },
      { id: 'fish', title: 'Fishing Hole', genre: 'Fishing', blurb: 'Cast, wait for a bite, reel it in. Bigger fish, more points.', controls: 'Space cast / reel · ↑ raise line', make: G2.fishingHole },
      { id: 'lights', title: 'Lights Off', genre: 'Puzzle', blurb: 'Each press flips its neighbors. Get the board dark.', controls: 'Arrows move · Space press · X new', make: G2.lightsOff },
    ],
  },
  computer: {
    id: 'computer', name: 'FAMILY PC', era: '2000s', kind: 'Desktop computer', frame: 'st-computer', where: '2000s desk',
    pal: { bg: '#0a2a6a', fg: '#ffffff', a: '#ff4a4a', b: '#4ad04a', c: '#ffd23f', dim: '#5a7ab0' },
    games: [
      { id: 'mines', title: 'Minefield', genre: 'Puzzle', blurb: 'Clear the field without hitting a mine. Numbers count neighbors.', controls: 'Click open · Right-click flag', make: G.minefield },
      { id: 'double', title: 'Double Up', genre: 'Merge puzzle', blurb: 'Slide tiles, merge pairs, chase a big number.', controls: 'Arrows slide', make: G.doubleUp },
      { id: 'plane', title: 'Paper Plane', genre: 'Flyer', blurb: 'Tap to fly through the gaps.', controls: 'Space / ↑ flap', make: G.paperPlane },
      { id: 'roof', title: 'Rooftop Run', genre: 'Runner', blurb: 'Jump the vents and keep running.', controls: 'Space / ↑ jump', make: G.rooftopRun },
      { id: 'moon', title: 'Lunar Lunch Break', genre: 'Lander', blurb: 'The office lander classic. Touch down softly.', controls: '← → tilt · ↑ thrust', make: G.moonHopper },
      { id: 'type', title: 'Type Attack', genre: 'Typing', blurb: 'Words fall from the sky. Type them before they land.', controls: 'Type the words · Backspace fixes', make: G2.typeAttack },
      { id: 'flip', title: 'Flip Side', genre: 'Strategy', blurb: 'Outflank the computer’s discs to flip them your way.', controls: 'Click a yellow dot (or arrows + Space)', make: G2.flipSide },
      { id: 'fifteen', title: 'Fifteen', genre: 'Sliding puzzle', blurb: 'Slide the tiles back into order, 1 to 15.', controls: 'Click a tile or arrows', make: G2.fifteen },
      { id: 'lightsPC', title: 'Lights Off Deluxe', genre: 'Puzzle', blurb: 'The pocket puzzle, now with a mouse.', controls: 'Click lights · X new puzzle', make: G2.lightsOff },
      { id: 'muncherPC', title: 'Maze Muncher PC', genre: 'Maze chase', blurb: 'The arcade hit, shareware edition.', controls: MOVE, make: G2.mazeMuncher },
    ],
  },
  disc: {
    id:'disc',name:'VECTOR DISC',era:'2000s',kind:'Disc console',frame:'st-disc',where:'2000s corner, beside the computer',
    pal:{bg:'#102333',fg:'#e6f1f0',a:'#ed985b',b:'#78acb9',c:'#d5cd86',dim:'#365364'},
    games:[],
  },
}

type Extra=[string,string,string,string,string,(p:Pal)=>Game]
const extras:Extra[]=[
  ['pinball','Silverball Social','Pinball','Keep the ball alive with the flippers. Three balls per round.','Left / Right flippers; Space both',G3.pinball],
  ['trails','Neon Trails','Arena','Outlast the computer without crossing either trail.','Arrows / WASD steer',G3.trailDuel],
  ['slalom','Alpine Afterglow','Sport','Thread the gates as the mountain gets faster. Three misses end the run.','Left / Right steer',G3.slalom],
  ['targets','Tin Can Range','Reflex','Track moving targets. Clean hits count; misses cost points.','Arrows aim; Space fire; or click',G3.targetRange],
  ['warehouse','Boxroom Shift','Puzzle','Push all three crates onto marked squares. Plan an escape route.','Arrows / WASD push',G3.warehouse],
  ['pairs','Picture Pairs','Memory','Turn over two cards at a time. Match eight pairs in fewer turns.','Arrows choose; Space flip; or click',G3.matchPairs],
  ['pegs','Peg Garden','Puzzle','Jump over a neighbor into an empty hole. Leave as few pegs as possible.','Arrows + Space select; or click',G3.pegGarden],
  ['circuit','Weekend Circuit','Racing','Three laps around an oval. Stay on the road and find your line.','Up accelerate; Down brake; Left / Right steer',G3.circuitRace],
  ['golf','Five-Hole Sunday','Sport','Set the angle, start the power meter, then strike. Clear five holes.','Left / Right aim; Space start/stop power',G3.discGolf],
  ['fort','Star Fort','Strategy','Build $30 towers beside the route. Defend five waves.','Left / Right choose; Space build; or click',G3.starFort],
  ['beat','Beat Street','Rhythm','Tap each lane as its note crosses the target. Build a clean combo.','Left / Up / Down / Right tap lanes',G3.beatStreet],
  ['salvage','Orbital Salvage','Adventure','Collect cargo and return it to the base while avoiding orbital debris.','Arrows / WASD fly',G3.orbitalSalvage],
  ['tilt','Marble Tilt','Physics','Roll a marble around the barriers. Avoid the holes and reach the goal.','Arrows / WASD tilt',G3.marbleTilt],
]
function add(id:StationId,names:string[]) {
  for(const name of names){const e=extras.find(e=>e[0]===name)!;STATIONS[id].games.push({id:e[0],title:e[1],genre:e[2],blurb:e[3],controls:e[4],make:e[5]})}
}
add('arcade',['pinball','trails','slalom','targets','circuit','beat'])
add('console',['slalom','targets','warehouse','pairs','golf','pinball'])
add('handheld',['warehouse','pairs','pegs','golf','slalom'])
STATIONS.handheld.games.push({id:'bricks',title:'Pocket Bricks',genre:'Paddle & bricks',blurb:'A pocket-sized brick wall. Keep the ball in play.',controls:'Left / Right paddle; Space launch',make:G.brickBash})
add('computer',['pegs','warehouse','pairs','fort','circuit','golf','tilt'])
add('disc',['circuit','tilt','beat','salvage','fort','warehouse','golf','trails','pinball'])
STATIONS.disc.games.push(
  {id:'skyline',title:'Skyline Strike DX',genre:'Vertical shooter',blurb:'A disc-era version of the original vertical shooter.',controls:'Arrows fly; Space fire',make:G2.skylineStrike},
  {id:'rooftops',title:'Rooftop Rush',genre:'Runner',blurb:'Keep moving across the skyline and jump the vents.',controls:'Space / Up jump',make:G.rooftopRun},
  {id:'plane',title:'Paper Wings',genre:'Flyer',blurb:'Find the rhythm and weave through the gaps.',controls:'Space / Up flap',make:G.paperPlane},
)
STATIONS.arcade.name='NIGHT ORBIT'
for(const st of Object.values(STATIONS))st.games.forEach((g,i)=>g.styleYear??=({arcade:1982,console:1977,handheld:1990,computer:1999,disc:2000}[st.id]+i%6))
