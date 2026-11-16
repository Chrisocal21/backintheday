# Back in the Day - Progress Tracker

## Status (2026-11-15, end of day)
Vite + React + TypeScript + React Three Fiber, running on localhost:3000 (`npm run dev`). The room is walkable and full of working things: sit mode, TV with remote, record player, five playable game devices (69 entries / 40 distinct original games), a game closet (comics + board games vs computer), films on the TV, lighting and sound settings. V1 interactions 1-3 done; VCR and TV console exist in a first form (see below). Nothing is deployed yet.

## Built
- TV remote is the only TV control (`src/media/TVRemote.tsx`): Power, CH ▲▼, VOL ±, GUIDE. Shows when holding the remote, using the TV (E), or watching close-up. Keys [ ] − = G P. Channels are a basic-cable lineup (`src/media/lineup.ts`): Basement Cable 3–10, then every live channel from 11 up, grouped news → sports → reruns → cartoons → music → nature. Green on-screen channel/volume display inside the picture. Watch view has no other controls.
- Zoom in/out keeps playing: moving the picture between the room TV and the close-up resumes a <video> and re-creates YouTube at the saved time (verified: movie 11→15→19 s, YouTube 230→233→238 s across room/close-up switches).
- TV Guide restyle: deep-blue grid, yellow channel numbers, uppercase tabs; dark scrollbars everywhere.
- iPod (`src/listening/IPod.tsx`, dock on the right floor speaker of the record nook, `src/scene/IPodDock.tsx`): click-wheel UI with Now Playing, Shuffle, Albums, Artists, Genres, Songs; plays every music track through its own player. Record crate has an Albums view with covers and "Play album".
- Guide now 2,150 things to watch, organized as tabs → genre chips → decade chips → series collections. Tabs: Live TV 217, Movies 800 (classics, noir, westerns, musicals, silent, sci-fi/horror, comedy), TV shows 405, Cartoons 141, Sports 93 (vintage films), Music videos 76, Shorts 282, Old commercials 136.
- Live TV: news channels plus ~200 verified-channel 24/7 marathons and live streams found by search (sports, reruns like Power Rangers / G.I. Joe / Mr. Bean / Unsolved Mysteries, cartoons, retro game longplays, music, nature/space cams). Refresh with `node tools/check-live-channels.mjs` (stream ids change).
- Records/tapes: 733 harvested tracks (412 LibriVox audiobooks, 189 old-time radio, 132 free music).
- House sounds: the clock "tick" was a beep and played on entry; now off by default and a soft tick when enabled; appliance hum lowered. Saved settings migrated (v2).
- Live TV tab: 13 real 24/7 streams (NASA ISS, Lofi Girl, ABC News Live, NBC News NOW, BBC, Sky, Bloomberg, CNBC, Euronews, Al Jazeera, DW, France 24, CNN) in `src/media/live.json`. Stream ids change when broadcasters restart, so refresh with `node tools/check-live-channels.mjs`.
- Basement Cable (`src/media/cable.ts`): 8 always-on channels built from the free library (CH 3 Saturday Morning Cartoons, 4 Night Owl Reruns, 5 Creature Feature, 6 Silver Screen, 7 Silent Theater, 8 Video Jukebox, 9 Commercial Break, 10 Newsreel Network). Clock-based schedule: tune in mid-show; next show starts when one ends. Verified in Chrome.
- Guide groups series into collections (`src/media/series.ts`): The Lucy Show 26, Charlie Chaplin 29, Betty Boop, Beverly Hillbillies, Sherlock Holmes, Three Stooges… and music videos by artist. Click a collection to pick an episode.
- Paste any link (guide and Input menu, `src/media/links.ts`): YouTube, Vimeo, Dailymotion, Twitch, Streamable (official embeds), archive.org pages (auto-finds the video/audio file), direct .mp4/.webm/.mp3/etc., and .m3u8 live streams (hls.js). Verified archive.org + Vimeo in Chrome.
- Scroll-wheel takeover: zoomed all the way in on a seat and keep scrolling → the TV (or PC) screen fills the window; on any device overlay, scrolling in makes its screen fill the window. Scroll out steps back. Real browser fullscreen is attempted (browsers often require a click; the Fullscreen button always works). Helper: `src/takeover.ts`.
- Program guide now 667 titles, no duplicates (title/URL dedupe in `src/media/catalog.ts` and in the harvester): Movies 240, TV shows 79, Cartoons 42, Music videos 76, Shorts 153, Old commercials 74, Live 3. Music videos are official YouTube embeds, each oEmbed-checked (list in the harvester).
- Free media harvester `tools/harvest-free-media.mjs` (Internet Archive, explicit PD / CC BY / BY-SA only, plus checked official music-video embeds): videos → `src/media/harvest.json` (TV guide), audio → `src/listening/harvest.json` (records/tapes). Re-run any time: `node tools/harvest-free-media.mjs --per 100`. `--download` saves files to `public/offline/` for offline use (large).
- Program Guide (`src/media/ProgramGuide.tsx`): Movies / TV shows / Cartoons / Shorts / Music videos / Live tabs, search, one click plays on the TV. T opens it from any TV-facing seat. Tapes and cartridges play immediately (no carrying to the VCR).

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
