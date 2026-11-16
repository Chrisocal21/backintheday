# Library expansion

## Purpose
Make each physical device a useful, growing library while keeping the room a quiet hangout. Device libraries remain separate. Browsing should support a short list, search, genre filters, favorites, recently played, and clear controls. No permanent HUD.

## Scope of this pass
- Read and preserve the four-device game system in `stations/`; extend it rather than routing every game through the main TV.
- Add an early-2000s disc console and more original, era-styled games. Labels describe the intended style, never a fictitious historical release date.
- Test every catalogue entry through its update/draw/input lifecycle and check that each device is reachable.
- Add real licensed music and public-domain spoken-word tapes, with creator, source, license, verification date, and playback errors visible in the browser.
- Make records/cassettes searchable and filterable; retain physical player controls and background listening.
- Update progress and handoff documents with counts and limitations.

## Boundaries
No commercial ROMs. No web game embeds without explicit reuse permission. Original games and era-inspired ports may appear on multiple suitable devices; count distinct game implementations separately from device library entries. External media remains streamed, and host availability can change.

## Delivered
- 69 device entries / 40 distinct original games: arcade 14, woodgrain 13, handheld 13, PC 17, disc console 12.
- Separate searchable libraries, genre filters, saved favorites/recent, random picks, style-year labels, controls, saved best scores, pause/restart and blur pause.
- 11 credited CC BY 4.0 music recordings alongside 17 original synth records; 23 public-domain spoken chapters/acts alongside the original cassette mixtape.
- Contextual retro record/tape browsers with transport, seek, volume, repeat/shuffle, source/credit/license links and visible failures. External audio continues while walking.
- Sources: https://apps.incompetech.com/music/royalty-free/licenses/ and https://librivox.org/pages/public-domain/ . Track/item source links are stored with each recording. LibriVox status is USA public domain; check other jurisdictions before distribution there.

## Verification
- `node tools/check-station-library.cjs`: 69 entries, 40 factories, 184,917 simulated frames; fixed an invalid diagonal peg move found by pointer testing.
- `node tools/check-listening.cjs`: 34 credited streams, correct source handoff, queue/replay behavior, independent players, saved favorites/recent.
- Production build checked with `npm.cmd run build`.
- Visual Chrome review found and fixed list/description overlap at a 768px browser viewport; checked PC search and Marble Tilt launch. Review components separately at `/tools/review-library.html?device=computer` (Vite only).

## Limits / next work
This pass adds original era-inspired games, not ROM emulation. Counts include ports on multiple suitable machines. Smoke checks cover execution/input; difficulty and long-session play still need human tuning. Music/tapes stream from external hosts, so availability is outside the app. No claim that all 34 streams have been listened through. TV/film and boardgame systems were preserved.

Browser playback verified: Local Forecast reached 1:06 of 2:45; Sherlock Holmes - A Scandal in Bohemia reached 0:48 of 57:54. These checks verified loading and advancing playback counters, not full-track listening. Layout reachability, walking, seat focus and preference regression scripts also pass (18 reachable electronics/stand-up targets).
