// Villagers of Hollowbrook. Each has a palette (procedural sprite), gift
// preferences, a birthday, and tiered dialogue. Relationship is tracked in
// hearts (0-10). Talking + gifting raises it; heart events unlock at thresholds.

export const NPCS = [
  {
    id: 'mara', name: 'Mara', title: 'Shopkeeper', birthday: { season: 0, day: 14 },
    palette: { skin: '#e8b888', hair: '#7a3b1a', shirt: '#3a7a4f', shirt2: '#2c5c3c', pants: '#4a3a5a', shoes: '#3a2a1c' },
    home: 'shop',
    loves: ['cabbage', 'cauliflower', 'energy_tonic'], likes: ['lettuce', 'salad', 'wild_mushroom'], dislikes: ['fiber', 'coal'],
    intro: "Welcome to Hollowbrook! I run the General Store. Bring me your harvest and I'll buy it — and you can grab seeds & tools from me.",
    chat: {
      0: ["Fresh seeds came in this morning.", "A farm's only as good as its soil. And its farmer.", "Need anything? I've got a bit of everything."],
      2: ["Your stall's been the talk of the market lately.", "You've got a knack for greens, I'll give you that.", "Stop by anytime — I always save the good seeds for you."],
      5: ["Honestly? The whole valley feels brighter since you arrived.", "I keep telling folks: that farm up the hill is something special.", "Coffee's on me next time you're in town."],
      8: ["You're family to this town now, you know that?", "I saved you the rarest seeds I could find. Don't tell the others.", "Whatever you're growing up there — keep it up. We're proud of you."],
    },
    rainy: ["Rain's good for the crops, bad for the customers.", "Slow day. Perfect for reorganizing the seed shelf."],
  },
  {
    id: 'gus', name: 'Gus', title: 'Carpenter', birthday: { season: 2, day: 8 },
    palette: { skin: '#d8a070', hair: '#3a2a1c', shirt: '#9c5a2e', shirt2: '#7c4623', pants: '#3a3a44', shoes: '#2a2a30', hat: '#6b4a2a' },
    home: 'town',
    loves: ['hardwood', 'gold_bar', 'pumpkin_pie'], likes: ['wood', 'corn_bread'], dislikes: ['wild_berry', 'dandelion'],
    intro: "Name's Gus. I build things. Barns, coops, fences — you bring the wood and gold, I'll raise it by morning.",
    chat: {
      0: ["A sturdy fence keeps the critters honest.", "Wood's the backbone of any farm.", "You'll want more storage soon. Trust me."],
      2: ["Saw your fences. Clean work. Color me impressed.", "Anytime you want an upgrade, you know where I am."],
      5: ["Tell you what — I'll knock a bit off your next build.", "We should grab a drink at the saloon sometime."],
      8: ["You and me, we build things that last. Respect.", "Whatever you need built — it's yours, friend."],
    },
    rainy: ["Can't lay foundations in this muck.", "Rain day. Good time to sharpen the tools."],
  },
  {
    id: 'pip', name: 'Pip', title: 'Forager', birthday: { season: 0, day: 26 },
    palette: { skin: '#c88858', hair: '#2a6a3a', shirt: '#5fa83e', shirt2: '#3f8a2e', pants: '#6b4a2a', shoes: '#3a2a1c' },
    home: 'forest',
    loves: ['wild_mushroom', 'snowdrop', 'greens_smoothie'], likes: ['blackberry', 'hazelnut', 'herb_tea'], dislikes: ['gold_bar', 'iron_bar'],
    intro: "Oh! A new face. I'm Pip. I live for the forest — mushrooms, berries, the secret stuff. Stick with me and I'll show you where the good greens hide.",
    chat: {
      0: ["Found a whole patch of mushrooms by the old log today!", "The forest gives, if you know how to ask.", "Ever tried wild leeks? Life-changing."],
      2: ["I'll let you in on a foraging spot sometime. Maybe.", "You smell like fresh soil. That's a compliment!"],
      5: ["Okay okay — the rare stuff grows deep in the woods after rain. You didn't hear it from me.", "You get it. You really get it. The forest, I mean."],
      8: ["You're the only one who understands the quiet up there.", "Take this — found two. One's yours, always."],
    },
    rainy: ["RAIN! Best foraging day there is! Gotta run!", "Everything's about to sprout. I can feel it."],
  },
  {
    id: 'edith', name: 'Edith', title: 'Rancher', birthday: { season: 1, day: 18 },
    palette: { skin: '#e8c0a0', hair: '#b0b0b8', shirt: '#9c3b5a', shirt2: '#7c2c46', pants: '#4a4a54', shoes: '#3a2a1c' },
    home: 'town',
    loves: ['milk', 'wool', 'veggie_stew'], likes: ['egg', 'corn', 'baked_potato'], dislikes: ['eel', 'cavefish'],
    intro: "I'm Edith. Been ranching these fields sixty years. Animals are honest company — more than most people, I'd say.",
    chat: {
      0: ["A happy animal gives the best milk.", "Back in my day we did it all by hand. Built character.", "You feed 'em, they feed you. Simple as that."],
      2: ["You've got patient hands. Good for animals.", "Come by, I'll show you how to shear proper."],
      5: ["You remind me of myself, decades back. Stubborn. Kind.", "I'll sell you a hen or two, cheap. You've earned it."],
      8: ["This valley's in good hands with you, dear.", "Whenever I'm gone, promise me you'll keep it green."],
    },
    rainy: ["Animals stay in the barn today. Smart of them.", "Rain on the tin roof. Best sound there is."],
  },
  {
    id: 'theo', name: 'Theo', title: 'Fisher', birthday: { season: 3, day: 4 },
    palette: { skin: '#caa078', hair: '#1a2a3a', shirt: '#3a6a9c', shirt2: '#2c5278', pants: '#3a3a44', shoes: '#2a2a30' },
    home: 'beach',
    loves: ['tuna', 'pufferfish', 'fish_dinner'], likes: ['bass', 'trout', 'salmon'], dislikes: ['salad', 'pickles'],
    intro: "Theo. I fish. Dawn till dusk, river to sea. You ever cast a line? Once you do, the land never feels quite enough.",
    chat: {
      0: ["Tide's turning. The big ones bite at dusk.", "Patience, friend. The water rewards patience.", "Caught a pike yesterday. Fought me for an hour."],
      2: ["You should join me on the pier sometime.", "Rain days are the best fishing. Don't let anyone tell you different."],
      5: ["I'll teach you the trick to the deep-water fish.", "There's a legend in that pond. The Leviathan. I'll find it one day."],
      8: ["You're the finest angler this valley's seen besides me.", "When I land the Leviathan, you'll be the first to know."],
    },
    rainy: ["Perfect. Absolutely perfect weather. The fish are mine today.", "Rain means catfish. Meet me at the river."],
  },
  {
    id: 'rosa', name: 'Rosa', title: 'Chef', birthday: { season: 1, day: 27 },
    palette: { skin: '#d89868', hair: '#2a1a14', shirt: '#e8e0d0', shirt2: '#c8c0b0', pants: '#9c3b3b', shoes: '#3a2a1c', hat: '#fff' },
    home: 'town',
    loves: ['artichoke', 'starfruit', 'stir_fry'], likes: ['tomato', 'basil', 'bellpepper', 'salad'], dislikes: ['wild_berry', 'sap'],
    intro: "Ahh, a farmer! I'm Rosa, I run the kitchen at the saloon. Bring me your freshest greens and I'll turn them into something magnificent.",
    chat: {
      0: ["A dish is only as good as its ingredients.", "Basil! I can never have enough basil.", "Tonight's special? Whatever's freshest. Always."],
      2: ["Your produce has flavor. Real flavor. Rare these days.", "I'm working on a new recipe. You'll be my taste-tester."],
      5: ["I'll teach you a recipe or two. A good cook shares.", "You grow it, I'll cook it. We make a fine team."],
      8: ["The saloon's never smelled so good, thanks to your harvests.", "You've got a chef's palate. Come cook with me anytime."],
    },
    rainy: ["Rainy days are soup days. Bring me roots!", "Nothing beats hot stew when it's grey out."],
  },
  {
    id: 'bram', name: 'Bram', title: 'Miner', birthday: { season: 3, day: 22 },
    palette: { skin: '#c0905a', hair: '#3a3a30', shirt: '#6a5a3a', shirt2: '#4c4028', pants: '#3a3a44', shoes: '#2a2a30', hat: '#c8a030' },
    home: 'mine',
    loves: ['gem', 'crystal', 'gold_bar'], likes: ['copper', 'iron', 'coal', 'cavefish'], dislikes: ['flower', 'daffodil'],
    intro: "Bram. I work the mine east of town. Dangerous down there — slimes, bats, worse. But the deeper you go, the better the loot.",
    chat: {
      0: ["Found a copper vein on level four. Beauty.", "Watch the slimes. They look soft. They aren't.", "Bring a sword if you go down. And don't go at night."],
      2: ["You hold your own in the caves. Not bad for a farmer.", "I'll mark the good ore levels for you sometime."],
      5: ["The crystals deep down — they hum. Swear they're alive.", "You ever need backup in the mine, you holler."],
      8: ["Best mining partner I've had. And I've had none. Ha!", "There's a level so deep I've never reached it. Maybe together."],
    },
    rainy: ["Rain don't reach the mine. Always dry down there.", "Good day to be underground, honestly."],
  },
  {
    id: 'nina', name: 'Nina', title: 'Botanist', birthday: { season: 2, day: 16 },
    palette: { skin: '#e0b890', hair: '#8a6ab0', shirt: '#6a9c5a', shirt2: '#4c7c3e', pants: '#4a4a5a', shoes: '#3a2a1c' },
    home: 'forest',
    loves: ['ancientgreen', 'kohlrabi', 'herb_tea'], likes: ['kale', 'collard', 'watercress', 'mustard'], dislikes: ['coal', 'stone'],
    intro: "Hello there. I'm Nina — I study the rare plants of the valley. There's an ancient strain of greens here, you know. Lost for centuries. I intend to find it.",
    chat: {
      0: ["Every leaf tells a story, if you read it right.", "The soil here is unusually rich. Almost magical.", "I'm cataloguing the valley's flora. Slow work. Joyful work."],
      2: ["Your crops have remarkable vigor. What's your secret?", "I'd love to study a sample from your farm sometime."],
      5: ["I believe the Ancient Green still grows somewhere here.", "If anyone can cultivate the lost strain, it's you."],
      8: ["Together we could restore the valley's lost flora. Imagine it.", "You don't just grow plants. You give them life. It's a gift."],
    },
    rainy: ["The plants drink deep today. Listen — you can almost hear them.", "Rain carries seeds further than you'd think."],
  },
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n]));

// Gift reaction -> hearts delta and message.
export function giftReaction(npc, itemId) {
  if (npc.loves?.includes(itemId)) return { pts: 80, react: 'love', line: "This is exactly what I love! Thank you so much!" };
  if (npc.likes?.includes(itemId)) return { pts: 45, react: 'like', line: "Oh, how thoughtful. I like this a lot." };
  if (npc.dislikes?.includes(itemId)) return { pts: -20, react: 'dislike', line: "Oh... um. Thanks, I suppose." };
  return { pts: 20, react: 'neutral', line: "For me? That's kind of you." };
}
