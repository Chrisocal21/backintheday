# Back in the Day - Project Log

## 2026-11-15 - Bigger guide, no duplicates, scroll to full screen
- Chris saw duplicate TV/movies. The same film came from Codex's seed, the VHS shelf and the harvest; now deduped by normalized title and URL.
- Harvester expanded: sci-fi/horror, silent, comedy, classic TV commercials, newsreels, 80 per collection, plus 75 official music videos (73 passed the YouTube check). Guide: 667 titles. Audio: 99 tracks (90 old-time radio).
- Scroll wheel all the way in now takes over the screen on the TV, the PC and every game device; scroll out to come back. Verified in Chrome.

## 2026-11-15 - Free media harvester, no more tapes
- Took over from Codex. Its TV "watch" system was half-finished: `src/media/Playback.tsx` imported a missing `media.css`, and the program guide, watch theater and TV playback host were never mounted, so the page failed to load. Added the stylesheet, built the Program Guide (tabs, search, one-click play), and mounted all three.
- Chris didn't like carrying tapes to the VCR. Choosing a tape or cartridge now plays it immediately; sitting on any TV-facing seat shows "T  TV guide" and T opens the guide.
- New `tools/harvest-free-media.mjs`: pulls Internet Archive items explicitly marked public domain or CC BY / BY-SA (NC/ND skipped unless flagged), with a family-friendly title filter. First run: 160 videos (40 each feature films, classic TV, cartoons, shorts) and 42 audio tracks (old-time radio, netlabel music) wired into the guide and record/tape libraries.
- Everything streams; offline needs `--download` (many GB). Games are not harvested: web games rarely carry reuse licenses, so devices keep original games.

## 2026-11-15 - Wall dressing expansion
- Added ten original retro wall prints with varied titles, sizes, and slight hanging angles, plus a 21-cassette rack, two shallow display shelves with books/frames, and a cork memory board with fictional illustrated snapshots/notes.
- Concentrated additions on walls and above furniture to keep circulation clear. These additions are decorative; they do not claim new interaction behavior.
- Build and existing layout reachability check pass. Visual review of this pass remains pending.

## 2026-11-15 - Basement surface pass
- Added staggered instanced wood floorboards with modest color variation and narrow joints; removed the previous full-length floor seam overlays.
- Added plaster bump texture, vertical veneer paneling in the record nook, woven center rug, subtle ceiling panel joints, and a visible warm dome light controlled by the existing overhead dimmer.
- Added two high basement windows with dark nighttime glass and wood trim. Stair opening and access routes stay clear.
- Build, arrival, and clearance checks pass. Chrome screenshot verified ceiling joints, fixture, windows, new arcade/TV cart, and floor rendering.

## 2026-11-15 - Arcade and 90s detail pass
- Replaced rectangular arcade blockout with profiled side panels, recessed attract graphic, joystick/buttons, coin door, and original Night Orbit marquee. Arcade remains visual set dressing; playable games remain on the main TV.
- Added wood-veneer rolling TV cart with casters, tuning dials, grille, antennas, and tapes.
- Open 90s shelving now holds paperbacks, illustrated boxes, and a fabric storage bin. Added toy brick studs and handheld buttons.
- Replaced flat poster symbols with original retro print designs, typography, paper grain, and tape corners.
- Build, layout, and seated-focus checks pass. Live page loads; final visual review of this pass remains pending because screenshot capture showed a different foreground window.

## 2026-11-15 - Record nook and family computer materials
- Rebuilt the record console with veneer panels, feet, shelves, record spines, and slatted crate/sleeves. Speakers use cloth grilles and subtle cone silhouettes.
- Replaced the papasan's solid bowl with curved rattan ribs/rings and a woven cushion. Added cloth to beanbags and bound rugs; softened rug saturation.
- Detailed the family desk with rounded wood furniture, beige CRT bezel/stand, instanced keyboard keys, mouse/mat, tower face, and cable. Added wood texture to the kitchen chair seat/back.
- Kept existing object footprints and record-player position. Build, layout clearance, and seated focus checks pass.

## 2026-11-15 - Furniture realism pass
- Replaced center blockouts with rounded upholstered couch cushions/arms, shared procedural woven fabric and wood-grain textures, rounded coffee table with apron/shelf, and an open veneer TV cabinet with doors, handles, feet, and tapes.
- Added a ceramic mug/coaster, subtle table ring, folded throw, couch welting, CRT rounded casing, vents, speaker grille, and power indicator. TV output stays normal and unobstructed.
- Reduced default outlines and halftone. Kept the center furniture footprints and interaction targets. Cabinet and table tops retain their previous heights.
- Build, layout clearance, and seated-focus checks pass. Browser screenshot verified the new couch, table, materials, and accessories rendering in the room.

## 2026-11-15 - Seated screen focus
- Added smooth seated zoom with mouse wheel or +/-; 0 restores room view and Z faces the seat's screen. Free look remains available.
- Zoom is limited using the physical TV/monitor dimensions and viewport aspect so the device and surrounding room stay visible. It changes the lens rather than moving through furniture.
- Standing resets zoom. TV games use the same camera controller, avoiding competing FOV changes. Device/tabletop menus retain their normal scroll behavior.

## 2026-11-15 - Family computer chair
- Added a honey-oak slat-back kitchen chair at the beige computer desk, with four tapered legs and cross braces.
- Computer seat faces the monitor; lounge seats still face the TV. Moved inflatable chair forward to leave the desk approach clear, and updated collision/stand-up positions.

## 2026-11-15 - Stair arrival and starter media shelf
- User replaced the decorative-stairs requirement with arrival down the stairs. Added a six-second camera descent, roomward turn, skip button/Space/Escape, and a walkable landing exit.
- Added six TV/movie entries in `src/library.ts`: The Coming of Robin Hood, The General, Big Buck Bunny, Elephants Dream, His Girl Friday, Duck and Cover. Archive filenames and item reuse labels checked; each entry carries a source link and credit. These span older classics and open films, not a completed four-decade TV lineup.
- Added original Basement Rally and Night Snake games on the TV. Selecting a game seats the player, narrows the view, routes WASD to the game, and provides Escape/button exit. No external ROMs used.
- Device-only remote panel opens Movies & games. Streaming failure shows No Signal; direct video autoplay rejection offers a Play film button. Remote hosts are external and need live playback checks.
- Build, arrival/skip, layout reachability, movement/game-input checks, and both TV game render/input smoke checks pass. Browser verification caught a stale Vite tabletop module path from concurrent workspace changes; restarting the dev server restored the app. Full live stream playback and visual arrival review remain pending.

## 2026-11-15 - Circulation pass
- Moved papasan forward along the west wall to open the record cabinet approach; moved the 80s bean bag away from the arcade approach.
- Pulled couch back and coffee table forward to widen their gap. Updated remote position, seat viewpoints, stand-up positions, and furniture colliders together.
- Separated 2000s chairs to clear the computer desk approach. Added a layout reachability check for electronics and every seat exit using the player's collision radius.

## 2026-11-15 - Contextual controls
- Removed the permanent remote panel, walking banner, and older general hangout menu.
- TV controls appear when using the remote (E to pick up) or the TV (click, or E when looking at it nearby). Lamp clicks open lighting controls only.
- Done or Escape dismisses controls. Remote channel shortcuts require an active TV interaction or a held remote. E reopens controls while carrying the remote away from the table.
- Added TV interaction priority to prevent E from also sitting down. Build and movement regression check pass.

## 2026-11-15 - Warm lighting and room detail
- Added two shaded floor lamps, steady blue CRT light spill, baseboards, ceiling trim, floor joints, rug border, and two couch cushions.
- Default mood is Late night; Room mood panel includes Late night, Movie night, Lights up, plus independent overhead, lamp, and TV glow sliders.
- Preserved newer always-available WASD and Escape behavior; the Room mood button explicitly opens the panel after releasing mouse capture.
- Production build passes. Updated the movement regression check for the newer Escape behavior. Visual review remains pending.

## 2026-11-15 - Second monitor hangout pass
- Follow-up movement correction: keyboard navigation now uses the active room mode rather than requiring browser pointer lock; Walk in focuses a uniquely identified room canvas, handles capture rejection, and supports drag-to-look. Added `tools/check-movement.cjs` to exercise the actual movement callback without pointer lock, including strafe, menu, seated, and Escape behavior. Regression check and production build pass; live server serves the correction. Physical browser interaction remains unverified.
- Added couch entry and an unobtrusive, hideable panel when the mouse is released.
- Added channel buttons and a ceiling-light dimmer; default ceiling lighting is reduced for a late night feel.
- Fixed mismatched pointer-lock targets and added an explicit Walk around action that stands the user up before walking.
- Cleared movement keys on focus and pointer-lock changes to prevent stuck movement.
- Production build passes. Localhost serves the changes; interactive browser verification is pending because the earlier Computer Use check was blocked.

## 2026-11-15 - More games per device
- Chris asked for a lot more free games matched to each machine. Added 14 more original games (32 total), picked to fit each device: arcade action on the cabinet, sports and adventure on the wood-grain console, quick pocket games on the handheld, typing, strategy and puzzles on the PC. Writing them ourselves keeps everything free for anyone to use.

## 2026-11-15 - Every device playable
- Chris wanted each console, arcade, computer and record player in the room playable on its own system, not one shared menu. Built a small retro game engine and 18 original games split across four devices, each with its own look (neon arcade bezel, wood-grain console, green-screen handheld, beige PC window). Menus are one short list per device: arrows, Enter, Esc.
- Added 12 more original records (17 total). Board games stay in the game closet.

## 2026-11-15 - Game closet
- Chris asked for comics to read, AI games and board games, all free for anyone to use. Built a game closet shelf on the west wall: three original comics written for the project, plus Tic-Tac-Toe, Four in a Row and Checkers against a computer opponent (Easy/Hard). Everything is original, so there are no licensing questions.
- Intro screen removed; walking is always on. Fixed mouse look (an invisible layer from the TV screen was eating clicks).

## 2026-11-15 - Concept session
Started as a working title, "Retro Room." Chris came in with the idea of a walkable nostalgic room: TV, VCR, record player, consoles, bean bags, papasan, handhelds, Lego, cards. Worked through the decisions one at a time.

Key calls:
- Pure hangout, no objectives
- Zones by decade (70s, 80s, 90s, early 2000s) around a shared center
- Sit mode with free look while video and music play
- TV with remote, curated channels per era, and paste-your-own YouTube links; embed-blocked videos show "No Signal"
- One TV handles both video and games via an Input switch
- Ink-outline art on the room, true-color consoles, normal-looking TV screen
- Blend real designs into invented ones, no logos or real brand names
- Desktop first with gamepad support
- Free-to-use games and music only
- Square basement with stairs; the space under them is the 70s nook; stairs are decoration for now
- React Three Fiber on Vite, not Unity
- Name: Back in the Day, tagline "Feels like home."

## 2026-11-15 - First build session
- Scaffolded Vite + React + TS + R3F on localhost:3000. Room shell, first-person walk, collisions.
- Outline hulls on walls blacked out the screen up close; switched to thin world-space outlines and seam lines on the shell.
- TV with YouTube embed, remote, Input menu, placeholder channels.
- Art direction change: Chris asked to tone down the "Spider-Man vibes" toward a more realistic style. Now PBR shading with thin outlines and a faint halftone.
- Sit mode on couch (3 seats) and both bean bags. Coffee table pulled closer to the TV to make a walkway.

## 2026-11-15 - Build session 2
- Sitting reworked: E or F, 8 seats across the room, each facing the TV from its own angle.
- Blocked out all four decade corners with era props (papasan, arcade cabinet, wood TV on a cart, cereal shelf, Lego, inflatable chair, beige PC, glow stars, lava lamps, posters). Brand names and poster designs are invented.
- Couch rebuilt with real cushions and arms.
- Record player works: drop the needle, music plays, R swaps records. Music is synthesized in the browser as a royalty-free stand-in until real PD/CC tracks are chosen.
- Muffled footsteps overhead added, as the handoff asks for.
- Tried drifting dust particles; Chris didn't like them, so they were removed.
- Note: 70s corner sits beside the stairs, not under them yet. Nothing has been verified in a browser so far.

Saved: Feature Map, Open Questions, Progress Tracker, Handoff, this log. Files renamed from RETROROOM_ to BACKINTHEDAY_ after the name was chosen.

## 2026-11-15 - Device and listening library expansion
Read existing handoffs; expanded device games from 32 entries on four machines to 69 entries / 40 distinct original implementations across five machines. Added Vector Disc at the family desk. Added per-device discovery and saved favorites/recent. Added 11 credited CC music recordings and 23 LibriVox spoken chapters/acts with contextual search and transport; retained 17 original synth records and the original cassette. Added game/library state smoke scripts and a Vite component review page. Details and limitations: `06-library-expansion.md`.
