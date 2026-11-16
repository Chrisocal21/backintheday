# Back in the Day - Handoff for ChatGPT

Date: 2026-11-15. Read this first, then `00-handoff.md` (the original spec) and `03-progress-tracker.md` (what's built).

## What this is
A walkable first-person nostalgic basement in the browser. Tagline: "Feels like home." Cozy hangout, no goals or score. Four decades of stuff (70s, 80s, 90s, early 2000s) in the corners of one square room, with a shared center: TV, couch, coffee table, remote. The room is the product.

## How to run
```
npm install
npm run dev      # http://localhost:3000 (strict port)
npm run build    # type-check + production build
```
Windows machine. Stack: React 18, Vite 5, TypeScript, React Three Fiber 8, drei 9, three 0.170, zustand 4. No Tailwind yet (plain CSS files).

## Rules that must not be broken
1. **Everything must be free to use.** Games, music, comics and films are either written from scratch for this project (all games, comics and synth records) or public domain / Creative Commons with credit (films in `src/library.ts`, listening credits in `src/listening/`). No commercial ROMs, no copyrighted music.
2. **No real brands.** Invent every name (GTA-style). Shapes and color schemes can nod to real products; logos, wordmarks and real names cannot. Game names are original too ("Maze Muncher", not the real thing).
3. **Look:** mostly realistic (matte PBR, real lighting) with only a light comic touch: thin outlines, faint halftone in shadows. Chris asked to tone down the "Spider-Man vibes". Knobs: `STYLE` in `src/scene/Ink.tsx`. The TV screen always shows normal, unstyled video.
4. **Each device is its own system.** Chris was explicit: the arcade, woodgrain console, handheld, computer and disc console each open their own menu with their own games. Do not merge them into one shared menu.
5. **Menus stay simple:** one searchable list per device, with genre/favorites/recent filters; ↑ ↓ to choose, Enter to play, Esc to go back. Show genre, a one-line blurb and controls.
6. **No intro screen.** Walking is always on when the page loads. Chris asked to remove it.
7. The stair door stays closed (future hook). Don't build anything behind it.

## Controls (player)
- WASD / arrows walk · click the room to look with the mouse · Esc frees the mouse
- E interact (the hint at the bottom says what E does) · F sit/stand
- Remote: E pick up, [ ] channels, I input menu · Record player: E needle, R next record · O room settings

## Code map
| Area | Files |
|---|---|
| App shell, overlays | `src/App.tsx`, `src/hangout.css` |
| Global state | `src/store.ts` (zustand: `locked` = walk mode on, `menuOpen`, `hints`, `seated`, TV/media state), `src/preferences.ts` (saved settings) |
| Room geometry | `src/scene/Room.tsx`, `Zones.tsx`, `Props.tsx`, `RetroDetails.tsx`, `CornerFurniture.tsx`, `Furniture.tsx`, `Architecture.tsx`, `WallClutter.tsx` |
| Layout, colliders, seats | `src/scene/layout.ts` (room is 10 m × 10 m, origin at floor center; -z is north/TV side) |
| Walking, mouse look | `src/scene/Player.tsx` |
| Sitting | `src/scene/Seats.tsx`, `SeatedFocus.tsx` |
| TV, remote, films | `TV.tsx`, `Remote.tsx`, `MediaRitual.tsx`, `GameScreen.tsx`, `src/library.ts`, `src/channels.ts`, `src/youtube.ts` |
| Music, sound | `src/audio.ts` (synth records), `src/environmentAudio.ts`, `RecordPlayer.tsx`, `HouseLife.tsx` |
| Device game systems | `src/stations/` — `catalog.ts` (devices + their game lists), `engine.ts` (tiny canvas engine, 256×224), `games.ts` + `games2.ts` + `games3.ts` (69 entries / 40 distinct games), `StationScreen.tsx` (device UI), `state.ts`; room hotspots in `src/scene/Stations.tsx` |
| Listening libraries | `src/listening/` (11 CC music tracks, 23 spoken-word chapters, transport and attribution); `src/libraryShelf.ts` (saved favorites/recent) |
| Game closet | `src/scene/GameCloset.tsx`, `src/ui/ClosetMenu.tsx`, `src/ui/games.ts` (board game AI), `src/ui/comics.ts` |

## How to add things
- **A game to a device:** write `function myGame(p: Pal): Game` (see `src/stations/engine.ts`: `update(dt, keys)`, `draw(ctx)`, optional `click`/`key`, set `over` and `score`). Draw only with the palette `p` so it matches the device (the handheld is green-screen). Add one entry to that device's `games` list in `catalog.ts`.
- **A new device:** add a `Station` in `catalog.ts`, a bezel class in `stations.css`, and a hotspot (position + range) in `SPOTS` in `src/scene/Stations.tsx`.
- **An interactable object:** follow the pattern in `GameCloset.tsx` / `Stations.tsx`: check distance + where the camera looks in `useFrame`, set a hint with `setHint(key, 'E  ...')`, listen for E in the capture phase and call `stopImmediatePropagation()` so E doesn't also sit you down.
- **An overlay that pauses the room:** set `useStore.setState({ locked: false })` while open, `true` when closed, and call `document.exitPointerLock()`.
- **A licensed recording:** add verified URL/creator/source/license/credit metadata to `src/listening/catalog.ts` or `spoken.ts`; verify reuse terms and stream availability. Do not label modern recordings as historical releases.
- **An original synth record:** add an entry to `RECORDS` in `src/audio.ts` (tempo, scale, chord progression, seed). It's generated in the browser.

## Gotchas
- drei `<Html occlude>` (the TV screen) puts an invisible div over the canvas. Don't rely on `e.target === canvas` for clicks.
- Don't use drei `PointerLockControls`; it kept switching walk mode off. Mouse look lives in `Player.tsx`.
- Windows is case-insensitive: never have two files whose names differ only by case.
- Two sessions edited this repo in parallel today. Read a file before changing it.
- Browser autoplay may start video muted until the first click.

## Open questions (from `02-open-questions.md`)
VCR tape contents · further verified free music for records · curated TV channel videos · distribution (portfolio site, standalone, both) · domain name · what's behind the stair door.

## Suggested next steps
1. Balance all 40 distinct original games across the 69 device entries; smoke tests pass, but manual balance work remains; check each device's E hotspot in the room.
2. Pick-up-and-inspect objects (Lego, trading cards, virtual pet, toys).
3. Expand the existing Vector Disc library on the family desk (12 entries).
4. Chess and a deck of cards (solitaire, go fish) in the game closet.
5. Deploy to Vercel.

## Latest library pass (2026-11-15)
Read `06-library-expansion.md` for counts, sources, checks and current limitations. Five separate devices: arcade 14, woodgrain 13, handheld 13, computer 17, disc 12. There are 17 synth records + 11 real CC music tracks, and 23 spoken chapters/acts + the original cassette mixtape. Search/favorites/recent are contextual. Existing TV games/films and the boardgame closet remain separate.
