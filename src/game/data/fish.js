// Fish definitions. location: 'river'|'pond'|'ocean'|'cave'. season: array or 'all'.
// difficulty 1-10 affects the fishing minigame. spec drives the icon color.

export const FISH = [
  { id: 'minnow', name: 'Minnow', price: 12, difficulty: 1, location: ['pond', 'river'], season: 'all', spec: { c: '#9cb0c0' }, desc: 'A tiny common fish.' },
  { id: 'sunfish', name: 'Sunfish', price: 30, difficulty: 2, location: ['pond', 'river'], season: [0, 1], spec: { c: '#e8c84e', c2: '#fff0a0' }, desc: 'Loves warm shallows.' },
  { id: 'carp', name: 'Carp', price: 28, difficulty: 3, location: ['pond'], season: 'all', spec: { c: '#9a8a5e' }, desc: 'Hardy and plentiful.' },
  { id: 'bass', name: 'Bass', price: 55, difficulty: 4, location: ['river', 'pond'], season: [0, 1, 2], spec: { c: '#5a7a4a', c2: '#7c9a5a' }, desc: 'A fighter on the line.' },
  { id: 'trout', name: 'Rainbow Trout', price: 70, difficulty: 5, location: ['river'], season: [1], spec: { c: '#c06a8a', c2: '#e890b0' }, desc: 'Shimmers in summer rivers.' },
  { id: 'catfish', name: 'Catfish', price: 110, difficulty: 6, location: ['river'], season: [0, 2], spec: { c: '#5a4a3a' }, desc: 'Whiskered river dweller. Rainy days.' },
  { id: 'pike', name: 'Pike', price: 130, difficulty: 7, location: ['river', 'pond'], season: [2, 3], spec: { c: '#6a7a4a' }, desc: 'A toothy predator.' },
  { id: 'salmon', name: 'Salmon', price: 95, difficulty: 5, location: ['river'], season: [2], spec: { c: '#e07a5a', c2: '#f09a7a' }, desc: 'Swims upstream in fall.' },
  { id: 'sardine', name: 'Sardine', price: 22, difficulty: 2, location: ['ocean'], season: 'all', spec: { c: '#a0b0c0' }, desc: 'Small ocean fish.' },
  { id: 'tuna', name: 'Tuna', price: 160, difficulty: 7, location: ['ocean'], season: [1, 3], spec: { c: '#4a6a9a', c2: '#6a8aba' }, desc: 'A big ocean catch.' },
  { id: 'snapper', name: 'Red Snapper', price: 90, difficulty: 5, location: ['ocean'], season: [0, 1], spec: { c: '#d24a4a', c2: '#f06a6a' }, desc: 'Vivid red ocean fish.' },
  { id: 'eel', name: 'Eel', price: 120, difficulty: 8, location: ['ocean', 'river'], season: [2], spec: { c: '#3a4a3a' }, desc: 'Slippery and stubborn.' },
  { id: 'pufferfish', name: 'Pufferfish', price: 200, difficulty: 8, location: ['ocean'], season: [1], spec: { c: '#e8c84e', c2: '#fff' }, desc: 'Puffs up when caught.' },
  { id: 'cavefish', name: 'Cave Fish', price: 75, difficulty: 6, location: ['cave'], season: 'all', spec: { c: '#9a9aae' }, desc: 'Pale, eyeless, lives in the dark.' },
  { id: 'glowfish', name: 'Glow Fish', price: 180, difficulty: 7, location: ['cave'], season: 'all', spec: { c: '#6ad0e0', c2: '#aef0ff' }, desc: 'Glows faintly in deep caves.' },
  { id: 'legendfish', name: 'The Green Leviathan', price: 1500, difficulty: 10, location: ['pond'], season: [1], spec: { c: '#3aae6a', c2: '#6af0a0' }, desc: 'A legendary fish of the deep pond.' },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
