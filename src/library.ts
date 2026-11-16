export const FILMS = [
  { id: 'robin', title: 'The Adventures of Robin Hood: The Coming of Robin Hood', year: '1955', category: 'Classic TV · Episode 1', url: 'https://archive.org/download/Robin_Hood_01_The_Coming_Of_Robin_Hood/Robin_Hood_01_The_Coming_Of_Robin_Hood_512kb.mp4', source: 'https://archive.org/details/Robin_Hood_01_The_Coming_Of_Robin_Hood', credit: 'Sapphire Films · Public domain per Internet Archive item' },
  { id: 'general', title: 'The General', year: '1926', category: 'Silent movie', url: 'https://archive.org/download/the-general-1926_202505/The%20General%20%281926%29.mp4', source: 'https://archive.org/details/the-general-1926_202505', credit: 'Buster Keaton / Clyde Bruckman · Public domain per Internet Archive item' },
  { id: 'bunny', title: 'Big Buck Bunny', year: '2008', category: 'Animation', url: 'https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4', source: 'https://peach.blender.org/about/', credit: '© 2008 Blender Foundation / www.bigbuckbunny.org · CC BY 3.0' },
  { id: 'dream', title: 'Elephants Dream', year: '2006', category: 'Animation', url: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4', source: 'https://orange.blender.org/blog/creative-commons-license/', credit: '© 2006 Blender Foundation / Netherlands Media Art Institute · CC BY 2.5' },
  { id: 'friday', title: 'His Girl Friday', year: '1940', category: 'Classic movie', url: 'https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4', source: 'https://archive.org/details/his_girl_friday', credit: 'Howard Hawks · Public domain per Internet Archive item' },
  { id: 'duck', title: 'Duck and Cover', year: '1951', category: 'Archive short', url: 'https://archive.org/download/DuckandC1951/DuckandC1951_512kb.mp4', source: 'https://archive.org/details/DuckandC1951', credit: 'Archer Productions · Prelinger Archives · Public domain' },
] as const
export const GAMES = [
  { id: 'rally', title: 'Basement Rally', help: 'W / S or ↑ / ↓ · First to 7 · Space restarts' },
  { id: 'snake', title: 'Night Snake', help: 'WASD or arrow keys · Space restarts' },
] as const
export type GameId = typeof GAMES[number]['id']
