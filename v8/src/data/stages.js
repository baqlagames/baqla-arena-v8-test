// campaign stage data.
// Extracted from the v8 runtime without behavior changes.

export const WEATHER={clear:0,rain:1,storm:2,fog:3,night:4,morning:5,sunset:6,sandstorm:7,snow:8,blizzard:9,magma:10};

export const STAGES=[
  // ACT 1 Ã¢â‚¬â€ THE GARDEN PATH. eliteEnemyId on non-boss stages: an "elite"
  // (2.5Ãƒâ€” HP, 1.5Ãƒâ€” DMG, bigger model, big gold reward) spawns ~5s after the last wave.
  {n:1,name:'Garden Edge',act:1,type:'normal',layout:'open',weather:'morning',castleHp:1000,enemyCastleHp:1500,eliteEnemyId:1,
    waves:[[10,2,0],[22,2,3],[36,2,2],[52,2,0]]},
  {n:2,name:'Sunlit Field',act:1,type:'normal',layout:'open',weather:'clear',castleHp:1200,enemyCastleHp:1800,eliteEnemyId:2,
    waves:[[10,2,0],[22,2,3],[36,2,1],[52,2,2]]},
  {n:3,name:'Greenhouse Ruins',act:1,type:'mini',layout:'open',weather:'clear',castleHp:1400,enemyCastleHp:0,bossId:0,
    waves:[[10,2,0],[25,2,1],[42,2,3]]},
  {n:4,name:'River Crossing',act:1,type:'normal',layout:'bridges',weather:'rain',castleHp:1600,enemyCastleHp:2200,eliteEnemyId:3,
    waves:[[10,2,0],[22,2,1],[36,2,2],[52,2,3]]},
  {n:5,name:'Old Farmhouse',act:1,type:'strong',layout:'open',weather:'sunset',castleHp:1800,enemyCastleHp:0,bossId:1,
    waves:[[10,2,0],[25,2,1],[42,2,2]]},
  // ACT 2 Ã¢â‚¬â€ SPICE BAZAAR (non-boss stages get elites: bandit / camel / falcon)
  {n:6,name:'Bazaar Outskirts',act:2,type:'normal',layout:'bridges',weather:'sunset',castleHp:1000,enemyCastleHp:1800,eliteEnemyId:4,
    waves:[[10,2,4],[22,2,5],[36,2,7],[52,2,4]]},
  {n:7,name:'Cursed Bazaar',act:2,type:'normal',layout:'bridges',weather:'fog',castleHp:1100,enemyCastleHp:2000,crystalNode:true,eliteEnemyId:5,
    waves:[[10,2,4],[22,2,7],[36,2,6],[52,2,5]]},
  {n:8,name:'Lantern Quarter',act:2,type:'mini',layout:'bridges',weather:'night',castleHp:1200,enemyCastleHp:0,crystalNode:true,bossId:10,
    waves:[[10,2,5],[22,2,7],[36,2,4],[52,2,6],[70,2,5]]},
  {n:9,name:'Storm Skies',act:2,type:'normal',layout:'arena',weather:'storm',castleHp:1300,enemyCastleHp:2400,crystalNode:true,eliteEnemyId:6,
    waves:[[10,2,5],[22,2,4],[36,2,7],[52,2,6]]},
  {n:10,name:'Sultan\'s Palace',act:2,type:'vs',layout:'arena',weather:'storm',castleHp:1500,enemyCastleHp:0,bossId:4,crystalNode:true,
    waves:[[10,2,4],[22,1,5],[36,2,6],[52,2,7]]},
  // ACT 3 Ã¢â‚¬â€ DESERT CROSSING (elites: scorpion / vulture / mummy)
  {n:11,name:'Dune Edge',act:3,type:'normal',layout:'lanes',weather:'clear',castleHp:1500,enemyCastleHp:2000,crystalNode:true,eliteEnemyId:8,
    waves:[[10,2,8],[22,2,9],[36,1,11],[52,2,10],[70,2,8],[90,2,9]]},
  {n:12,name:'Bone Field',act:3,type:'normal',layout:'lanes',weather:'sandstorm',castleHp:1700,enemyCastleHp:2200,crystalNode:true,eliteEnemyId:9,
    waves:[[10,2,9],[25,2,11],[42,2,10],[58,2,9],[76,2,10],[94,2,11]]},
  {n:13,name:'Sphinx Watchtower',act:3,type:'mini',layout:'arena',weather:'sunset',castleHp:1900,enemyCastleHp:0,crystalNode:true,bossId:14,bossAlone:true,
    waves:[[10,2,8],[22,2,10],[36,1,11],[52,2,9],[70,2,10],[90,2,8]]},
  {n:14,name:'Buried Temple',act:3,type:'normal',layout:'lanes',weather:'fog',castleHp:2100,enemyCastleHp:2700,crystalNode:true,eliteEnemyId:11,
    waves:[[10,2,11],[22,2,9],[36,2,10],[52,1,8],[70,2,11],[90,2,9]]},
  {n:15,name:'Pharaoh\'s Tomb',act:3,type:'strong',layout:'arena',weather:'night',castleHp:2200,enemyCastleHp:0,bossId:6,bossAlone:true,crystalNode:true,
    waves:[[10,2,11],[25,2,8],[42,1,10],[58,2,9],[76,2,11],[94,2,10]]},
  // ACT 4 Ã¢â‚¬â€ FROSTBOUND MOUNTAINS (elites: golem / mage / titan)
  {n:16,name:'Foothill Pass',act:4,type:'normal',layout:'towers',weather:'snow',castleHp:2300,enemyCastleHp:3000,crystalNode:true,eliteEnemyId:12,
    waves:[[10,2,12],[22,2,13],[36,1,14],[52,2,15],[70,2,13],[90,2,12],[112,2,14]]},
  {n:17,name:'Frozen River',act:4,type:'normal',layout:'towers',weather:'fog',castleHp:2500,enemyCastleHp:3300,crystalNode:true,eliteEnemyId:14,
    waves:[[10,2,13],[22,2,14],[36,1,15],[52,2,12],[70,2,14],[90,2,13],[112,2,15]]},
  {n:18,name:'Glacier Bridge',act:4,type:'mini',layout:'towers',weather:'blizzard',castleHp:2700,enemyCastleHp:0,bossId:7,crystalNode:true,
    waves:[[10,2,13],[25,1,14],[42,2,15]]},
  {n:19,name:'Ice Cathedral',act:4,type:'normal',layout:'towers',weather:'night',castleHp:3000,enemyCastleHp:3800,crystalNode:true,eliteEnemyId:15,
    waves:[[10,2,12],[22,2,14],[36,2,13],[52,1,15],[70,2,12],[90,2,14],[112,2,13]]},
  {n:20,name:'Mountain Throne',act:4,type:'vs',layout:'arena',weather:'storm',castleHp:2800,enemyCastleHp:0,bossId:8,crystalNode:true,
    waves:[[10,2,15],[25,1,14],[42,2,12],[60,2,13]]},
  // ACT 5 Ã¢â‚¬â€ UNDERWORLD GAUNTLET (boss-only)
  {n:21,name:'Forge of Fire',act:5,type:'mini',layout:'arena',weather:'magma',castleHp:3000,enemyCastleHp:0,bossId:0,
    waves:[[10,2,16]]},
  {n:22,name:'Crypt of Echoes',act:5,type:'mini',layout:'arena',weather:'fog',castleHp:3100,enemyCastleHp:0,bossId:5,
    waves:[[10,2,17]]},
  {n:23,name:'Bone Cathedral',act:5,type:'strong',layout:'arena',weather:'storm',castleHp:3200,enemyCastleHp:0,bossId:6,
    waves:[[10,2,18]]},
  {n:24,name:'Throne of Whispers',act:5,type:'strong',layout:'arena',weather:'night',castleHp:3300,enemyCastleHp:0,bossId:8,
    waves:[[10,2,17]]},
  {n:25,name:'The Final Reckoning',act:5,type:'final',layout:'arena',weather:'storm',castleHp:3500,enemyCastleHp:0,bossId:9,
    waves:[[10,2,16],[25,1,19],[42,2,17]]}
];

export const STAGE_HP_MULT=[1,1.00,1.06,1.12,1.18,1.25, 1.30,1.40,1.50,1.62,1.80, 1.98,2.18,2.40,2.64,2.90, 3.18,3.48,3.80,4.16,4.55, 4.98,5.45,5.96,6.52,7.12];

export const STAGE_DMG_MULT=[1,1.05,1.10,1.16,1.22,1.28, 1.33,1.40,1.47,1.54,1.60, 1.66,1.72,1.78,1.84,1.90, 1.96,2.02,2.08,2.14,2.20, 2.26,2.32,2.38,2.44,2.50];
