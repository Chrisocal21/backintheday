# Back in the Day - Handoff Spec for VS Code

Tagline: "Feels like home." Nov 15, 2026. Read this first, then 01-feature-map.md for full detail. This file wins on layout and stack where they differ.

## Repo
Suggested repo and folder name: `back-in-the-day`

## What It Is
A walkable first-person nostalgic basement in the browser. Cozy hangout, no goals, no score. Four decades of stuff (70s, 80s, 90s, early 2000s) so a visitor feels at home. The room is the product.

## Stack
- React, Vite, TypeScript, Tailwind for any UI overlays
- React Three Fiber (Three.js) for the 3D room
- Ink-outline look via a standard outline post-process or inverted-hull outline, plus light halftone shading
- Deploy on Vercel
- Desktop first: mouse look, keyboard walk, Gamepad API support
- No Unity

## Layout
- Square basement.
- Staircase runs along one wall. The space under the stairs is the 70s nook: papasan, record player, dim lamp.
- Other three corners: 80s, 90s, early 2000s.
- Shared center: main TV, couch, bean bags, coffee table with the remote.
- Players arrive by descending the stairs on entry (six seconds, skippable). The door at the top stays closed with light underneath; no upstairs rooms yet. Occasional muffled footsteps remain.

## Art Rules
- Mostly realistic (matte PBR shading, real lighting and shadows) with only a hint of comic: thin, slightly soft outlines and a faint halftone in the darkest areas. Toned down from the original Spider-Verse direction on 2026-11-15. Knobs live in `STYLE` in `src/scene/Ink.tsx`.
- Consoles keep true colors and shapes inside that style.
- The TV screen is the exception: it shows normal, unstyled video and game output.
- Likeness: blend real designs into our own, GTA style. Invent all brand names. No logos, wordmarks, or real names.

## V1 Interactions (must feel great)
1. Sit mode. Walk to a chair, press a key, camera locks to seat height with free look. Press a key to stand. Each seat has its own TV angle. Audio keeps playing.
2. Remote. Pick it up from the coffee table. Channel up/down flips curated channels, one per era. Input button opens an on-screen menu: TV, Game, and a paste-a-YouTube-link field.
3. Record player. Drop the needle, music plays. Records are public domain, Creative Commons, or royalty-free only, sorted by era.
4. VCR. Slide a tape in, the TV plays it. Tape contents still undecided.
5. Controller. Pick up a joystick or controller, press Input to Game, play a free game on the TV.

Everything else (Lego, cards, toys, posters) starts as pick-up-and-inspect objects.

## TV Rules
- One TV for video and games, switched with Input.
- YouTube plays through an embedded player on the TV surface (CSS3D iframe layered into the scene; a video cannot be textured directly from an iframe).
- If a video blocks embedding or fails, show static and "No Signal."
- Curated channel videos must be pre-checked for embed support.

## Games
- Public domain, homebrew, and freeware only. No commercial ROMs.
- Keyboard or real gamepad.
- Specific titles still to choose.

## Build Order
1. Empty square basement, first-person walk, collisions.
2. One test object with the ink-outline look. Confirm the style works before modeling anything else.
3. Main TV with YouTube embed and the remote.
4. Sit mode on the couch.
5. 90s zone as the first full zone.
6. Record player, then VCR, then console and controller.
7. Remaining zones one at a time: 80s, 70s nook, early 2000s.

## Still Open
See 02-open-questions.md: VCR tape contents, specific free games, music sources, curated channels, distribution, domain.
