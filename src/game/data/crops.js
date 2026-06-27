// Crop definitions. "Greens" leans into leafy greens but has full variety.
// growDays: total days seed->harvest. regrow: days to regrow after harvest (0 = single).
// season: array of season indices (0 spring,1 summer,2 fall,3 winter).
// kind drives sprite generation. yieldMin/Max: produce per harvest. xp: farming xp on harvest.

export const CROPS = [
  // ---------------- SPRING ----------------
  { id: 'lettuce', name: 'Lettuce', season: [0], growDays: 4, regrow: 0, seedPrice: 20, sellPrice: 45,
    kind: 'leafy', stem: '#4f8c36', leaf: '#7cc04f', leaf2: '#9ad96a', produce: { shape: 'leafy', c: '#7cc04f' }, heart: true, yieldMin: 1, yieldMax: 1, xp: 8 },
  { id: 'spinach', name: 'Spinach', season: [0, 2], growDays: 5, regrow: 0, seedPrice: 25, sellPrice: 55,
    kind: 'leafy', stem: '#3c7a2e', leaf: '#3f8a36', leaf2: '#56a345', produce: { shape: 'leafy', c: '#3f8a36' }, yieldMin: 1, yieldMax: 2, xp: 10 },
  { id: 'kale', name: 'Kale', season: [0, 2, 3], growDays: 6, regrow: 3, seedPrice: 35, sellPrice: 60,
    kind: 'leafy', stem: '#2c6024', leaf: '#2f7a3a', leaf2: '#45924f', produce: { shape: 'leafy', c: '#2f7a3a' }, yieldMin: 1, yieldMax: 1, xp: 12 },
  { id: 'cabbage', name: 'Cabbage', season: [0], growDays: 8, regrow: 0, seedPrice: 40, sellPrice: 110,
    kind: 'head', stem: '#4f8c36', leaf: '#8fc85a', leaf2: '#a8de72', produce: { shape: 'head', c: '#9ad96a', c2: '#b6e886' }, yieldMin: 1, yieldMax: 1, xp: 18 },
  { id: 'arugula', name: 'Arugula', season: [0], growDays: 4, regrow: 2, seedPrice: 22, sellPrice: 40,
    kind: 'leafy', stem: '#3c7a2e', leaf: '#5fa83e', leaf2: '#7cc04f', produce: { shape: 'leafy', c: '#5fa83e' }, yieldMin: 1, yieldMax: 1, xp: 7 },
  { id: 'bokchoy', name: 'Bok Choy', season: [0, 2], growDays: 5, regrow: 0, seedPrice: 30, sellPrice: 70,
    kind: 'leafy', stem: '#dfe8c0', leaf: '#5fa83e', leaf2: '#7cc04f', produce: { shape: 'leafy', c: '#9ad96a' }, yieldMin: 1, yieldMax: 1, xp: 11 },
  { id: 'radish', name: 'Radish', season: [0], growDays: 4, regrow: 0, seedPrice: 15, sellPrice: 38,
    kind: 'root', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'round', c: '#d23b4e', c2: '#e85f70' }, fruit: '#d23b4e', yieldMin: 1, yieldMax: 2, xp: 7 },
  { id: 'parsnip', name: 'Parsnip', season: [0], growDays: 5, regrow: 0, seedPrice: 18, sellPrice: 42,
    kind: 'root', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'long', c: '#e8d8a0', c2: '#f4e8bc' }, fruit: '#e8d8a0', yieldMin: 1, yieldMax: 1, xp: 8 },
  { id: 'potato', name: 'Potato', season: [0], growDays: 6, regrow: 0, seedPrice: 30, sellPrice: 50,
    kind: 'root', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'round', c: '#c79a5e', c2: '#d8b074' }, fruit: '#c79a5e', yieldMin: 1, yieldMax: 3, xp: 10 },
  { id: 'cauliflower', name: 'Cauliflower', season: [0], growDays: 9, regrow: 0, seedPrice: 45, sellPrice: 130,
    kind: 'head', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'head', c: '#f4f0e0', c2: '#fff' }, yieldMin: 1, yieldMax: 1, xp: 20 },
  { id: 'peas', name: 'Snap Peas', season: [0], growDays: 6, regrow: 2, seedPrice: 28, sellPrice: 35,
    kind: 'vine', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'cluster', c: '#7cc04f' }, fruit: '#7cc04f', yieldMin: 2, yieldMax: 4, xp: 9 },
  { id: 'scallion', name: 'Scallion', season: [0, 3], growDays: 3, regrow: 2, seedPrice: 12, sellPrice: 28,
    kind: 'stalk', stem: '#dfe8c0', leaf: '#6cae44', produce: { shape: 'long', c: '#9ad96a', c2: '#eef' }, fruit: '#9ad96a', fruit2: '#fff', yieldMin: 1, yieldMax: 2, xp: 5 },
  { id: 'strawberry', name: 'Strawberry', season: [0], growDays: 7, regrow: 3, seedPrice: 60, sellPrice: 70,
    kind: 'fruit', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'round', c: '#e23b4e', c2: '#ff7080' }, fruit: '#e23b4e', fruit2: '#ffe46b', yieldMin: 1, yieldMax: 2, xp: 12 },

  // ---------------- SUMMER ----------------
  { id: 'greenbean', name: 'Green Bean', season: [1], growDays: 6, regrow: 2, seedPrice: 30, sellPrice: 32,
    kind: 'vine', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'cluster', c: '#5fa83e' }, fruit: '#5fa83e', yieldMin: 2, yieldMax: 4, xp: 9 },
  { id: 'cucumber', name: 'Cucumber', season: [1], growDays: 6, regrow: 3, seedPrice: 35, sellPrice: 55,
    kind: 'vine', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'long', c: '#4f8c36', c2: '#6cae44' }, fruit: '#4f8c36', yieldMin: 1, yieldMax: 2, xp: 11 },
  { id: 'zucchini', name: 'Zucchini', season: [1], growDays: 7, regrow: 3, seedPrice: 40, sellPrice: 60,
    kind: 'vine', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'long', c: '#3f7a2e', c2: '#5fa83e' }, fruit: '#3f7a2e', yieldMin: 1, yieldMax: 2, xp: 12 },
  { id: 'broccoli', name: 'Broccoli', season: [1], growDays: 8, regrow: 0, seedPrice: 50, sellPrice: 120,
    kind: 'head', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'cluster', c: '#3f7a2e', c2: '#56a345' }, fruit: '#3f7a2e', yieldMin: 1, yieldMax: 1, xp: 18 },
  { id: 'celery', name: 'Celery', season: [1], growDays: 6, regrow: 0, seedPrice: 32, sellPrice: 65,
    kind: 'stalk', stem: '#9ad96a', leaf: '#6cae44', produce: { shape: 'long', c: '#9ad96a', c2: '#b6e886' }, fruit: '#9ad96a', yieldMin: 1, yieldMax: 2, xp: 11 },
  { id: 'bellpepper', name: 'Bell Pepper', season: [1], growDays: 7, regrow: 3, seedPrice: 42, sellPrice: 50,
    kind: 'fruit', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'round', c: '#3fae4f', c2: '#5fd96a' }, fruit: '#3fae4f', yieldMin: 1, yieldMax: 2, xp: 11 },
  { id: 'tomato', name: 'Tomato', season: [1], growDays: 8, regrow: 2, seedPrice: 45, sellPrice: 55,
    kind: 'fruit', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'round', c: '#e23b3b', c2: '#ff6b6b' }, fruit: '#e23b3b', yieldMin: 1, yieldMax: 3, xp: 12 },
  { id: 'corn', name: 'Corn', season: [1, 2], growDays: 10, regrow: 3, seedPrice: 55, sellPrice: 60,
    kind: 'stalk', stem: '#5fa83e', leaf: '#6cae44', produce: { shape: 'long', c: '#ffd84e', c2: '#fff0a0' }, fruit: '#ffd84e', fruit2: '#fff0a0', yieldMin: 1, yieldMax: 2, xp: 16 },
  { id: 'basil', name: 'Basil', season: [1], growDays: 4, regrow: 2, seedPrice: 25, sellPrice: 45,
    kind: 'leafy', stem: '#3c7a2e', leaf: '#3f8a36', leaf2: '#56a345', produce: { shape: 'leafy', c: '#3f8a36' }, yieldMin: 1, yieldMax: 2, xp: 8 },
  { id: 'chard', name: 'Swiss Chard', season: [1, 2], growDays: 6, regrow: 3, seedPrice: 34, sellPrice: 58,
    kind: 'leafy', stem: '#e23b4e', leaf: '#2f7a3a', leaf2: '#45924f', produce: { shape: 'leafy', c: '#2f7a3a' }, yieldMin: 1, yieldMax: 2, xp: 11 },
  { id: 'okra', name: 'Okra', season: [1], growDays: 7, regrow: 2, seedPrice: 38, sellPrice: 50,
    kind: 'vine', stem: '#3c7a2e', leaf: '#5fa83e', produce: { shape: 'long', c: '#5fa83e', c2: '#7cc04f' }, fruit: '#5fa83e', yieldMin: 1, yieldMax: 2, xp: 10 },

  // ---------------- FALL ----------------
  { id: 'brussels', name: 'Brussels Sprout', season: [2], growDays: 8, regrow: 3, seedPrice: 45, sellPrice: 60,
    kind: 'stalk', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'cluster', c: '#5fa83e' }, fruit: '#5fa83e', yieldMin: 2, yieldMax: 3, xp: 14 },
  { id: 'leek', name: 'Leek', season: [2], growDays: 7, regrow: 0, seedPrice: 30, sellPrice: 60,
    kind: 'stalk', stem: '#9ad96a', leaf: '#6cae44', produce: { shape: 'long', c: '#9ad96a', c2: '#eef' }, fruit: '#9ad96a', yieldMin: 1, yieldMax: 1, xp: 12 },
  { id: 'collard', name: 'Collard Greens', season: [2], growDays: 6, regrow: 3, seedPrice: 36, sellPrice: 62,
    kind: 'leafy', stem: '#2c6024', leaf: '#357a32', leaf2: '#4c9446', produce: { shape: 'leafy', c: '#357a32' }, yieldMin: 1, yieldMax: 2, xp: 12 },
  { id: 'turnip', name: 'Turnip', season: [2], growDays: 5, regrow: 0, seedPrice: 20, sellPrice: 48,
    kind: 'root', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'round', c: '#f0e8f0', c2: '#c79ad6' }, fruit: '#f0e8f0', yieldMin: 1, yieldMax: 2, xp: 9 },
  { id: 'pumpkin', name: 'Pumpkin', season: [2], growDays: 11, regrow: 0, seedPrice: 70, sellPrice: 230,
    kind: 'fruit', stem: '#4f8c36', leaf: '#5fa83e', produce: { shape: 'round', c: '#e08a2e', c2: '#f0a84e' }, fruit: '#e08a2e', yieldMin: 1, yieldMax: 1, xp: 26 },
  { id: 'squash', name: 'Butternut Squash', season: [2], growDays: 8, regrow: 0, seedPrice: 48, sellPrice: 105,
    kind: 'fruit', stem: '#4f8c36', leaf: '#5fa83e', produce: { shape: 'long', c: '#e8b85e', c2: '#f4d088' }, fruit: '#e8b85e', yieldMin: 1, yieldMax: 1, xp: 17 },
  { id: 'artichoke', name: 'Artichoke', season: [2], growDays: 9, regrow: 0, seedPrice: 55, sellPrice: 140,
    kind: 'head', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'head', c: '#5fa83e', c2: '#7cc04f' }, yieldMin: 1, yieldMax: 1, xp: 20 },
  { id: 'watercress', name: 'Watercress', season: [2], growDays: 4, regrow: 2, seedPrice: 26, sellPrice: 50,
    kind: 'leafy', stem: '#3c7a2e', leaf: '#56a345', leaf2: '#7cc04f', produce: { shape: 'leafy', c: '#56a345' }, yieldMin: 1, yieldMax: 1, xp: 9 },
  { id: 'mustard', name: 'Mustard Greens', season: [2], growDays: 5, regrow: 2, seedPrice: 28, sellPrice: 52,
    kind: 'leafy', stem: '#4f8c36', leaf: '#7cc04f', leaf2: '#9ad96a', produce: { shape: 'leafy', c: '#7cc04f' }, yieldMin: 1, yieldMax: 2, xp: 10 },
  { id: 'kohlrabi', name: 'Kohlrabi', season: [2], growDays: 6, regrow: 0, seedPrice: 34, sellPrice: 75,
    kind: 'root', stem: '#4f8c36', leaf: '#6cae44', produce: { shape: 'round', c: '#9ad9b0', c2: '#b6e8c8' }, fruit: '#9ad9b0', yieldMin: 1, yieldMax: 1, xp: 12 },
  { id: 'grape', name: 'Grape', season: [2], growDays: 9, regrow: 3, seedPrice: 60, sellPrice: 75,
    kind: 'vine', stem: '#4f8c36', leaf: '#5fa83e', produce: { shape: 'cluster', c: '#7a3bd2' }, fruit: '#7a3bd2', yieldMin: 1, yieldMax: 2, xp: 14 },

  // ---------------- WINTER (greenhouse / hardy) ----------------
  { id: 'winterkale', name: 'Frost Kale', season: [3], growDays: 7, regrow: 4, seedPrice: 55, sellPrice: 95,
    kind: 'leafy', stem: '#2c6024', leaf: '#3a8a6a', leaf2: '#56a385', produce: { shape: 'leafy', c: '#3a8a6a' }, yieldMin: 1, yieldMax: 2, xp: 16 },
  { id: 'snowpea', name: 'Snow Pea', season: [3], growDays: 6, regrow: 3, seedPrice: 50, sellPrice: 65,
    kind: 'vine', stem: '#3c7a2e', leaf: '#7cc0a0', produce: { shape: 'cluster', c: '#9ad9b0' }, fruit: '#9ad9b0', yieldMin: 2, yieldMax: 3, xp: 14 },

  // ---------------- SPECIAL ----------------
  { id: 'starfruit', name: 'Starfruit', season: [1], growDays: 13, regrow: 0, seedPrice: 200, sellPrice: 750,
    kind: 'fruit', stem: '#4f8c36', leaf: '#5fa83e', produce: { shape: 'round', c: '#ffe046', c2: '#fff5a0' }, fruit: '#ffe046', fruit2: '#fff', yieldMin: 1, yieldMax: 1, xp: 50 },
  { id: 'ancientgreen', name: 'Ancient Green', season: [0, 1, 2, 3], growDays: 14, regrow: 7, seedPrice: 0, sellPrice: 500,
    kind: 'leafy', stem: '#2c6024', leaf: '#6cd0b0', leaf2: '#9af0d0', produce: { shape: 'leafy', c: '#6cd0b0' }, heart: true, yieldMin: 1, yieldMax: 2, xp: 60 },
];

export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));
export const SEASON_NAMES = ['Spring', 'Summer', 'Fall', 'Winter'];
