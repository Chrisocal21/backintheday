// Square basement, 10m x 10m, 2.8m ceiling. Origin at floor center.
// Zones: 70s = NW corner by the stairs, 80s = NE, 90s = SW, early 2000s = SE.
export const ROOM = { half: 5, height: 2.8 }

export const TV_SCREEN: [number, number, number] = [0, 0.87, -1.29]

/** Y rotation that turns a prop's front (local -z) toward the main TV. */
export function faceTV(x: number, z: number) {
  return Math.atan2(-(TV_SCREEN[0] - x), -(TV_SCREEN[2] - z))
}

// Axis-aligned footprint colliders on the floor plane: [minX, minZ, maxX, maxZ].
// The player is treated as a circle of PLAYER_RADIUS.
export const PLAYER_RADIUS = 0.3

export const COLLIDERS: [number, number, number, number][] = [
  // Center
  [-2.04, 1.61, -1.56, 2.09], // couch floor lamp
  [-2.34, -4.39, -1.86, -3.91], // record nook floor lamp
  [-1.22, 1.65, 1.22, 2.55], // couch
  [-0.6, -0.3, 0.6, 0.3], // coffee table
  [-0.9, -1.9, 0.9, -1.3], // TV stand
  // Staircase along the north wall (x -1.5..1), rising toward +x.
  [-1.5, -5, 1, -4],
  // 70s
  [-4.7, -2.4, -3.4, -1.1], // papasan
  [-4.75, -5, -2.45, -4.45], // record cabinet + speakers
  [-4.75, -3.85, -4.25, -3.35], // side table
  // 80s
  [4.25, -4.0, 5, -3.2], // arcade cabinet
  [3.15, -5, 4.05, -4.3], // TV cart
  [1.55, -3.1, 2.45, -2.2], // bean bag
  // 90s
  [-5, 2.9, -4.55, 4.3], // shelf
  [-3.6, 2.6, -2.8, 3.4], // bean bag
  [-5, -0.15, -4.5, 1.15], // game closet shelf (west wall)
  // 2000s
  [4.25, 3.1, 5, 4.5], // desk
  [2.1, 2.15, 3.0, 3.05], // inflatable chair
  [3.55, 3.55, 4.05, 4.05], // wooden computer chair
  [1.15, 3.7, 2.05, 4.6], // bean bag
]

// Seats: where your eyes go when sitting, and where you stand back up.
export type Seat = { name: string; eye: [number, number, number]; stand: [number, number]; target?: [number, number, number] }

export const SEATS: Seat[] = [
  { name: 'couch', eye: [-0.7, 1.08, 2.1], stand: [-0.7, 1.2] },
  { name: 'couch', eye: [0, 1.08, 2.1], stand: [0, 1.2] },
  { name: 'couch', eye: [0.7, 1.08, 2.1], stand: [0.7, 1.2] },
  { name: 'papasan', eye: [-4.05, 1.0, -1.75], stand: [-3.0, -1.75] },
  { name: 'bean bag', eye: [2.0, 0.78, -2.65], stand: [2.0, -1.8] },
  { name: 'bean bag', eye: [-3.2, 0.78, 3.0], stand: [-3.2, 2.1] },
  { name: 'inflatable chair', eye: [2.55, 0.98, 2.6], stand: [2.55, 1.65] },
  { name: 'bean bag', eye: [1.6, 0.78, 4.15], stand: [1.6, 3.2] },
  { name: 'computer chair', eye: [3.8, 1.12, 3.8], stand: [3.65, 2.9], target: [4.46, 0.97, 3.8] },
]
