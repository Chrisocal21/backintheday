// Original comics written for Back in the Day. Free to use (CC0). No real characters or brands.
export type Panel = { bg: string; scene: string; caption?: string; bubbles?: { who: string; text: string }[]; fx?: string }
export type Comic = { id: string; title: string; issue: string; era: string; cover: string; accent: string; panels: Panel[] }

export const COMICS: Comic[] = [
  {
    id: 'basement', title: 'BASEMENT RANGERS', issue: '#1 · 10¢', era: '70s', cover: '#e0662a', accent: '#ffd23f',
    panels: [
      { bg: '#f2c14e', scene: '🏠🌙', caption: 'Elm Street. Saturday night. Something is humming under the Henderson house...' },
      { bg: '#c8641e', scene: '🧒🔦👧', bubbles: [{ who: 'Dot', text: "Mom said the basement's off limits after nine." }, { who: 'Reggie', text: "Mom also said disco was a fad." }] },
      { bg: '#7a3b1e', scene: '📺✨', fx: 'BZZZT!', caption: 'The old console TV flickers on by itself.' },
      { bg: '#3b2a5a', scene: '👾', bubbles: [{ who: 'Screen', text: 'GREETINGS, EARTH KIDS. PLEASE ADJUST YOUR ANTENNA.' }] },
      { bg: '#e0662a', scene: '🧒📡', fx: 'TWEAK!', bubbles: [{ who: 'Reggie', text: 'Little to the left...' }] },
      { bg: '#f2c14e', scene: '👾🍕', bubbles: [{ who: 'Screen', text: 'PERFECT. NOW... DO YOU HAVE PIZZA?' }], caption: 'To be continued!' },
    ],
  },
  {
    id: 'neon', title: 'NEON KNIGHT', issue: '#4 · 75¢', era: '80s', cover: '#1a1a4a', accent: '#ff3fa4',
    panels: [
      { bg: '#1a1a4a', scene: '🌆🌃', caption: 'Sector 7. The arcade never closes.' },
      { bg: '#ff3fa4', scene: '🕹️💥', fx: 'GAME OVER', bubbles: [{ who: 'Kid', text: 'That was my last quarter!' }] },
      { bg: '#2a0a3a', scene: '🛹⚡', caption: 'A figure rolls out of the static...' },
      { bg: '#00c2c7', scene: '🦸‍♀️', bubbles: [{ who: 'Neon Knight', text: 'Nobody loses their last quarter on my watch.' }] },
      { bg: '#1a1a4a', scene: '🪙✨', fx: 'KA-CHING!', bubbles: [{ who: 'Kid', text: 'Whoa... high score!' }] },
      { bg: '#ff3fa4', scene: '🦸‍♀️🛹💨', bubbles: [{ who: 'Neon Knight', text: 'Remember: blow on the cartridge!' }], caption: 'NEXT ISSUE: The Tape That Ate Tuesday' },
    ],
  },
  {
    id: 'slime', title: 'SLIME TIME SQUAD', issue: '#12 · $1.25', era: '90s', cover: '#7bd13a', accent: '#8a2be2',
    panels: [
      { bg: '#7bd13a', scene: '🧪🏫', caption: 'Science fair. Table 4. A volcano that is NOT baking soda.' },
      { bg: '#8a2be2', scene: '🌋💚', fx: 'BLORP!', bubbles: [{ who: 'Jess', text: 'Was it supposed to be green?' }] },
      { bg: '#3fb6ff', scene: '🟢🟢🟢', caption: 'The slime has... opinions.' },
      { bg: '#ffe14f', scene: '🟢📟', bubbles: [{ who: 'Slime', text: 'beep beep. page me.' }, { who: 'Marcus', text: "It's using my pager!" }] },
      { bg: '#7bd13a', scene: '🧒👧🟢🏆', fx: 'WINNER!', bubbles: [{ who: 'Judge', text: 'First prize... I think?' }] },
      { bg: '#8a2be2', scene: '🟢🛹', caption: 'The slime got a skateboard. That is a different story.' },
    ],
  },
]
