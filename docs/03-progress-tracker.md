# Back in the Day - Progress Tracker

## Status (2026-11-15, end of day)
Vite + React + TypeScript + React Three Fiber, running on localhost:3000 (`npm run dev`). The room is walkable and full of working things: sit mode, TV with remote, record player, five playable game devices (69 entries / 40 distinct original games), a game closet (comics + board games vs computer), films on the TV, lighting and sound settings. V1 interactions 1-3 done; VCR and TV console exist in a first form (see below). Nothing is deployed yet.

## Built

### Moving around
- First-person walk (WASD/arrows), mouse look (click the room to capture the mouse, Esc frees it), gamepad sticks, collisions (`src/scene/Player.tsx`, colliders in `src/scene/layout.ts`)
- No intro screen; walking is always on. Skippable stair "arrival" animation on load (`src/scene/Arrival.tsx`)
- Sit mode: E or F near a seat; 9 seats (3 couch, papasan, 3 bean bags, inflatable chair, computer chair), each facing its own target (`src/scene/Seats.tsx`, `SeatedFocus.tsx`)

### Room and art
- Square basement, four decade corners: 70s NW by the stairs, 80s NE, 90s SW, early 2000s SE (`Zones.tsx`, `Props.tsx`, `RetroDetails.tsx`, `CornerFurniture.tsx`, `WallClutter.tsx`, `Architecture.tsx`)
- Mostly realistic PBR look with a light comic touch (thin outlines, faint halftone); knobs in `STYLE` in `src/scene/Ink.tsx`
- Center: CRT TV on cabinet, coffee table with remote and mug, rounded couch (`Furniture.tsx`)
- Staircase with closed door and light under it; footsteps and house sounds overhead (`environmentAudio.ts`, `HouseLife.tsx`)
- Room light dimmer, mood presets, weather/sound/comfort settings saved in the browser (`src/preferences.ts`, `src/ui/RoomSettings.tsx`); O opens settings
- Your own photo and poster upload (stays in the browser)

### TV, films, music
- Main TV plays YouTube via drei `<Html transform occlude>` iframe; static + "NO SIGNAL" on error (`TV.tsx`); placeholder channels CH 3-6 (`channels.ts`)
- Remote: E to pick up, [ ] channels, I = Input menu (TV / Game / paste a YouTube link)
- Film shelf: 6 public-domain / CC films with credits (`src/library.ts`); tapes and cartridges are picked up and inserted (`MediaRitual.tsx`); two original TV games (Basement Rally, Night Snake) in `GameScreen.tsx`
- Record player: E drop/lift needle, R next record; 17 original synthesized records plus 11 credited CC BY music recordings (`RecordPlayer.tsx`, `audio.ts`, `listening/`)
- Cassette deck with an original after-hours mixtape plus 23 public-domain spoken-word chapters/acts

### Playable devices (each its own system) - `src/stations/`
Look at a device and press E; the PC opens from its own panel with "Play computer games". Each machine keeps its own palette, bezel, searchable list, genre filters, favorites, recent history, random pick, controls, and saved best scores. Pause/restart/library controls appear only inside a device. Favorites and history persist locally.

| Device | Era style | Entries |
|---|---|---:|
| Night Orbit arcade | 1980s | 14 |
| Hearth 2400 woodgrain console | Late 1970s | 13 |
| Pocket Brick handheld | 1990s | 13 |
| Family PC | Late 1990s / 2000s | 17 |
| Vector Disc on the family desk | Early 2000s | 12 |

69 device entries represent 40 distinct original game implementations; some are suitable ports across machines. There are no commercial ROMs or historical release claims. New mechanics include pinball, trail duels, skiing, target shooting, box pushing, matching pairs, peg solitaire, circuit racing, five-hole golf, tower defense, rhythm lanes, orbital salvage, and marble tilt.

`tools/check-station-library.cjs` passed all 69 entries over 184,917 simulated frames with update/draw/keyboard/pointer input. This is a crash/input smoke check, not proof of difficulty balance. The PC browser search and Marble Tilt launch were visually checked in Chrome. `tools/review-library.html?device=computer` is a Vite-only component review page (other values: arcade, console, handheld, disc, record, tape).

### Listening libraries
- 11 real music recordings by Kevin MacLeod, credited CC BY 4.0; labels describe era mood, not historical release dates.
- 23 LibriVox chapters/acts from Sherlock Holmes, The Time Machine and Alice in Wonderland. Public domain in the USA; international status can differ.
- Record crate and tape drawer support search, genre, favorites, recent, surprise pick, previous/next, pause/resume, seek, volume, repeat/shuffle and visible playback errors. The record crate also has era-mood filtering and a separate tab for the 17 original synth records.
- Real streams hand off from the corresponding synth source; records and tapes remain independent. Music attenuates with room distance; the platter/reels follow playback. Audio continues after closing its panel.
- Sources, creator, license links and verification dates live in `src/listening/catalog.ts` and `spoken.ts`. Music URLs returned HTTP 200 and LibriVox item metadata/MP3 files were verified on 2026-11-15. External availability can change; streaming is not an offline download.
- `tools/check-listening.cjs` passes catalogue credits, format validation, synth handoff, pause, repeat/manual next/shuffle, replay requests, and persisted favorites/history.

### Game closet (west wall)
- Look + E: 3 original comics (70s/80s/90s) and board games vs the computer: Tic-Tac-Toe, Four in a Row, Checkers, each Easy/Hard (`GameCloset.tsx`, `src/ui/ClosetMenu.tsx`)

### Fixes worth knowing
- Outline hulls on walls blacked out the view → thin world-space outlines, seam lines on the shell
- drei PointerLockControls kept dropping walk mode → replaced with our own mouse look in `Player.tsx`
- drei `<Html occlude>` puts an invisible layer over the canvas → any click that isn't on UI captures the mouse
- Two files named `Tabletop`/`tabletop` broke Vite on Windows → never use names that differ only by case

## Done (planning)
- Concept, name, tagline, four decade zones, v1 interactions, art and likeness rules, stack, layout, handoff spec

## Next
- Play-test every game and balance difficulty; tune device hotspot positions (the handheld is on the floor)
- Pick-up-and-inspect objects (Lego, cards, toys)
- More board games / cards (chess, solitaire) in the closet
- Move the 70s nook fully under the stairs; colliders for small props
- Grow the verified listening catalogue and browser-check additional streams; decide VCR tape contents (open question 1)
- Deploy to Vercel; pick a domain (open questions 5-6)

Browser playback verified: Local Forecast reached 1:06 of 2:45; Sherlock Holmes - A Scandal in Bohemia reached 0:48 of 57:54. These checks verified loading and advancing playback counters, not full-track listening. Layout reachability, walking, seat focus and preference regression scripts also pass (18 reachable electronics/stand-up targets).
