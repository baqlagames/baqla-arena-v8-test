// enemy data.
// Extracted from the v8 runtime without behavior changes.

export const ENEMIES=[
  // ACT 1 Ã¢â‚¬â€ Garden of Decay
  {id:0,name:'Plague Aphid',act:1,arch:'swarm',color:'#7da43a',accent:'#4f6824',hp:70,dmg:12,speed:0.42,atkSpd:36,range:26,size:20,armor:0,magicRes:0,swarm:4,points:12},
  {id:1,name:'Cursed Caterpillar',act:1,arch:'tank',color:'#3a8e3a',accent:'#1f5c1f',hp:500,dmg:30,speed:0.18,atkSpd:66,range:36,size:28,armor:2,magicRes:0,armorType:'heavy',taunt:true,points:45},
  {id:2,name:'Plague Beetle',act:1,arch:'dps',color:'#5e3a1a',accent:'#3a2010',hp:250,dmg:52,speed:0.32,atkSpd:48,range:36,size:26,armor:1,magicRes:1,poisonOnHit:true,poisonDmg:3,poisonDur:120,points:38},
  {id:3,name:'Plague Wasp',act:1,arch:'ranged',color:'#d4a417',accent:'#7a5e0d',hp:140,dmg:30,speed:0.30,atkSpd:78,range:153,size:24,armor:0,magicRes:1,projType:'normal',points:38},
  // ACT 2 Ã¢â‚¬â€ Bazaar of Whispers
  {id:4,name:'Crow Cultist',act:2,arch:'caster',color:'#7a4a8e',accent:'#4a2a5e',hp:240,dmg:34,speed:0.28,atkSpd:102,range:165,size:26,armor:0,magicRes:4,armorType:'warded',projType:'curse',poisonOnHit:true,poisonDmg:4,poisonDur:180,points:70},
  {id:5,name:'Plague Bandit',act:2,arch:'assassin',color:'#a02828',accent:'#5e0e0e',hp:189,dmg:68,speed:0.48,atkSpd:46,range:34,size:24,armor:1,magicRes:2,stealth:true,stealthMult:1.6,points:75},
  {id:6,name:'Cursed War Camel',act:2,arch:'tank',color:'#b58a3a',accent:'#7a5d22',hp:880,dmg:52,speed:0.22,atkSpd:78,range:40,size:32,armor:5,magicRes:2,armorType:'heavy',taunt:true,points:95},
  {id:7,name:'Plague Falcon',act:2,arch:'ranged',color:'#7a6a3a',accent:'#4a3f22',hp:200,dmg:36,speed:0.36,atkSpd:66,range:175,size:26,armor:1,magicRes:1,projType:'lightning',points:70},
  // ACT 3 Ã¢â‚¬â€ Desert of Bones
  {id:8,name:'Cursed Scorpion',act:3,arch:'tank',color:'#c0723a',accent:'#7a3f1f',hp:820,dmg:80,speed:0.26,atkSpd:66,range:42,size:30,armor:6,magicRes:2,armorType:'heavy',poisonOnHit:true,poisonDmg:10,poisonDur:240,points:130},
  {id:9,name:'Plague Sandcrab',act:3,arch:'dps',color:'#d4a47a',accent:'#8e6e4a',hp:330,dmg:90,speed:0.32,atkSpd:48,range:36,size:24,armor:3,magicRes:1,armorType:'heavy',points:110},
  {id:10,name:'Bone Vulture',act:3,arch:'ranged',color:'#5e4a3a',accent:'#3a2e22',hp:250,dmg:58,speed:0.40,atkSpd:66,range:198,size:26,armor:1,magicRes:2,projType:'normal',points:100},
  {id:11,name:'Plague Mummy',act:3,arch:'caster',color:'#a88a5e',accent:'#6e5a3a',hp:410,dmg:52,speed:0.20,atkSpd:108,range:162,size:26,armor:2,magicRes:6,armorType:'warded',projType:'curse',chainBoltCD:540,chainBoltDmgMult:0.5,points:140},
  // ACT 4 Ã¢â‚¬â€ Frozen Reach
  {id:12,name:'Cursed Ice Golem',act:4,arch:'tank',color:'#9ed5e8',accent:'#5a8aa0',hp:1300,dmg:92,speed:0.18,atkSpd:84,range:44,size:34,armor:8,magicRes:3,armorType:'heavy',taunt:true,points:200},
  {id:13,name:'Plague Frost Wolf',act:4,arch:'swarm',color:'#7a8a9a',accent:'#4a5a6a',hp:210,dmg:58,speed:0.46,atkSpd:42,range:34,size:22,armor:2,magicRes:1,swarm:3,points:100},
  {id:14,name:'Cursed Frost Mage',act:4,arch:'caster',color:'#3a6a9e',accent:'#22456a',hp:340,dmg:65,speed:0.26,atkSpd:96,range:180,size:26,armor:1,magicRes:6,armorType:'warded',projType:'frost',slowOnHit:true,slowDur:120,points:175},
  {id:15,name:'Plague Frost Titan',act:4,arch:'dps',color:'#5e7a9a',accent:'#3a4f6a',hp:540,dmg:120,speed:0.26,atkSpd:72,range:42,size:30,armor:5,magicRes:3,armorType:'heavy',points:210},
  // ACT 5 Ã¢â‚¬â€ Crow Gerban's Domain
  {id:16,name:'Plague Imp',act:5,arch:'swarm',color:'#a02828',accent:'#5e0e0e',hp:140,dmg:44,speed:0.45,atkSpd:36,range:30,size:22,armor:1,magicRes:2,swarm:4,points:130},
  {id:17,name:'Talon Knight',act:5,arch:'tank',color:'#3a1a3a',accent:'#1a0a1a',hp:1700,dmg:115,speed:0.22,atkSpd:72,range:44,size:34,armor:9,magicRes:6,armorType:'heavy',taunt:true,points:300},
  {id:18,name:'Plague Wraith',act:5,arch:'caster',color:'#5a3a7a',accent:'#3a224a',hp:410,dmg:86,speed:0.30,atkSpd:96,range:198,size:28,armor:0,magicRes:8,armorType:'warded',projType:'curse',stealth:true,stealthMult:1.8,points:280},
  {id:19,name:'Crow Doombringer',act:5,arch:'dps',color:'#660066',accent:'#330033',hp:720,dmg:152,speed:0.28,atkSpd:66,range:42,size:32,armor:5,magicRes:5,armorType:'warded',poisonOnHit:true,poisonDmg:16,poisonDur:240,points:350},
  // ===== AOE SMASHERS (id 20-24, one per act) =====
  // Medium HP, modest single-target damage, but every basic attack splashes
  // (splashOnHit + splashRadius). Designed to threaten clumped formations,
  // NOT one-shot anyone Ã¢â‚¬â€ forces the player to spread their squad.
  {id:20,name:'Plague Bomber Beetle',act:1,arch:'aoe',color:'#5a7a2a',accent:'#3a4f1a',hp:280,dmg:28,speed:0.30,atkSpd:90,range:36,size:26,armor:1,magicRes:1,splashOnHit:true,splashRadius:45,meteorCD:780,meteorDmgMult:0.55,meteorRadius:50,points:55},
  {id:21,name:'Sand Mortar',act:2,arch:'aoe',color:'#a07a4a',accent:'#6e5028',hp:420,dmg:50,speed:0.28,atkSpd:96,range:38,size:28,armor:2,magicRes:1,splashOnHit:true,splashRadius:60,meteorCD:660,meteorDmgMult:0.6,meteorRadius:60,points:90},
  {id:22,name:'Tomb Sapper',act:3,arch:'aoe',color:'#c8b078',accent:'#7a6a44',hp:520,dmg:68,speed:0.28,atkSpd:96,range:38,size:28,armor:3,magicRes:2,splashOnHit:true,splashRadius:60,meteorCD:600,meteorDmgMult:0.65,meteorRadius:60,points:130},
  {id:23,name:'Frost Cracker',act:4,arch:'aoe',color:'#7aa8c8',accent:'#3a5a78',hp:640,dmg:88,speed:0.26,atkSpd:102,range:40,size:30,armor:4,magicRes:3,splashOnHit:true,splashRadius:65,meteorCD:540,meteorDmgMult:0.65,meteorRadius:65,points:200},
  {id:24,name:'Crow Detonator',act:5,arch:'aoe',color:'#6a2a6a',accent:'#3a0a3a',hp:760,dmg:115,speed:0.28,atkSpd:108,range:40,size:30,armor:5,magicRes:5,splashOnHit:true,splashRadius:70,meteorCD:480,meteorDmgMult:0.7,meteorRadius:70,points:300},
  // ===== BACKLINE INFILTRATORS (id 25-29, one per act) =====
  // Low HP, fast, prefersBackline:true Ã¢â‚¬â€ ignore tanks unless blocked, target
  // the player's ranged/healers/casters first. Low count per wave by design.
  {id:25,name:'Twiglet Sneak',act:1,arch:'assassin',color:'#7a5a3a',accent:'#4a3a22',hp:125,dmg:44,speed:0.52,atkSpd:38,range:32,size:24,armor:0,magicRes:1,prefersBackline:true,points:60},
  {id:26,name:'Veiled Cutpurse',act:2,arch:'assassin',color:'#3a1a4a',accent:'#1f0a2a',hp:180,dmg:72,speed:0.55,atkSpd:38,range:32,size:24,armor:1,magicRes:2,prefersBackline:true,stealth:true,stealthMult:1.4,points:90},
  {id:27,name:'Sand Stalker',act:3,arch:'assassin',color:'#a08a5a',accent:'#6a5a3a',hp:220,dmg:92,speed:0.55,atkSpd:36,range:32,size:24,armor:1,magicRes:2,prefersBackline:true,points:120},
  {id:28,name:'Frost Specter',act:4,arch:'assassin',color:'#a8c8e0',accent:'#5a8aa0',hp:280,dmg:112,speed:0.58,atkSpd:36,range:32,size:24,armor:1,magicRes:4,armorType:'warded',prefersBackline:true,stealth:true,stealthMult:1.5,points:170},
  {id:29,name:'Crow Harbinger',act:5,arch:'assassin',color:'#1a0a1a',accent:'#3a0a3a',hp:360,dmg:144,speed:0.55,atkSpd:36,range:32,size:24,armor:2,magicRes:6,armorType:'warded',prefersBackline:true,stealth:true,stealthMult:1.6,points:280},
  // ===== ACT 2 + 3 SWARM FILLERS (id 30-31) =====
  // Acts 2 and 3 had no real swarm enemy, so SWARM_RUSH waves (especially R1
  // after the rotation lock) were falling back to high-damage assassins. These
  // two fill the gap with proper low-hp/low-dmg swarm units, themed to act.
  {id:30,name:'Plague Locust',act:2,arch:'swarm',color:'#a89030',accent:'#5a4a18',hp:130,dmg:28,speed:0.44,atkSpd:36,range:28,size:20,armor:0,magicRes:1,swarm:4,points:30},
  {id:31,name:'Sand Scarab',act:3,arch:'swarm',color:'#b8884a',accent:'#6a4f28',hp:180,dmg:42,speed:0.42,atkSpd:38,range:30,size:20,armor:1,magicRes:1,swarm:4,points:62},
  // ===== HEAVY-ARMORED LINE (id 32-36, one per act) =====
  // Plate-clad slabs of meat. armorType:'heavy' Ã¢â‚¬â€ physical does 60%, pierce 70%,
  // magic does 140%. Forces magic / shred-DPS into the squad. arch:'tank' so
  // they soak the front, taunt:true so they pull aggro from melee units.
  {id:32,name:'Plate Beetle',act:1,arch:'tank',color:'#7a6a3a',accent:'#4a3a18',hp:680,dmg:26,speed:0.18,atkSpd:78,range:36,size:30,armor:5,magicRes:0,armorType:'heavy',taunt:true,points:90},
  {id:33,name:'Bronze Bandit',act:2,arch:'tank',color:'#a87a3a',accent:'#7a5018',hp:1180,dmg:48,speed:0.20,atkSpd:78,range:38,size:32,armor:10,magicRes:2,armorType:'heavy',taunt:true,points:160},
  {id:34,name:'Tomb Guardian',act:3,arch:'tank',color:'#c8a85a',accent:'#7a6a28',hp:1500,dmg:70,speed:0.22,atkSpd:72,range:40,size:34,armor:12,magicRes:3,armorType:'heavy',taunt:true,points:240},
  {id:35,name:'Frost Bulwark',act:4,arch:'tank',color:'#88a8c8',accent:'#3a5a78',hp:1900,dmg:92,speed:0.20,atkSpd:84,range:42,size:36,armor:14,magicRes:4,armorType:'heavy',taunt:true,points:340},
  {id:36,name:'Doomplate Crow',act:5,arch:'tank',color:'#3a1a3a',accent:'#1a0a1a',hp:2400,dmg:122,speed:0.22,atkSpd:78,range:44,size:36,armor:16,magicRes:6,armorType:'heavy',taunt:true,points:480},
  // ===== WARDED CASTERS (id 37-41, one per act) =====
  // Glowing magic-resistant casters. armorType:'warded' Ã¢â‚¬â€ physical 100%, pierce
  // 100%, MAGIC ONLY 50%. Pyromancer + Warlock comp stalls hard here. Forces
  // melee/pierce damage in the squad. Default 'caster' arch + ranged projectile.
  {id:37,name:'Spore Wisp',act:1,arch:'caster',color:'#9aa83a',accent:'#5a6a18',hp:175,dmg:26,speed:0.30,atkSpd:90,range:160,size:26,armor:0,magicRes:4,armorType:'warded',projType:'curse',chainBoltCD:600,chainBoltDmgMult:0.4,points:60},
  {id:38,name:'Hex Cultist',act:2,arch:'caster',color:'#7a3a8e',accent:'#3a1450',hp:280,dmg:40,speed:0.30,atkSpd:102,range:160,size:26,armor:0,magicRes:8,armorType:'warded',projType:'curse',points:110},
  {id:39,name:'Sun Mystic',act:3,arch:'caster',color:'#e0c060',accent:'#7a5410',hp:380,dmg:60,speed:0.28,atkSpd:96,range:170,size:24,armor:1,magicRes:10,armorType:'warded',projType:'fire',points:170},
  {id:40,name:'Glacier Seer',act:4,arch:'caster',color:'#7ab0e8',accent:'#3a5a78',hp:480,dmg:78,speed:0.28,atkSpd:96,range:175,size:24,armor:1,magicRes:12,armorType:'warded',projType:'frost',slowOnHit:true,slowDur:120,points:240},
  {id:41,name:'Void Augur',act:5,arch:'caster',color:'#3a1a4a',accent:'#1a0a2a',hp:600,dmg:104,speed:0.28,atkSpd:96,range:180,size:24,armor:1,magicRes:14,armorType:'warded',projType:'curse',chainBoltCD:480,chainBoltDmgMult:0.5,points:340},
  // ===== FLYING (id 42-46, one per act) =====
  // flying:true Ã¢â€ â€™ airborne movement/target priority; player units can hit air,
  // while leash rules keep ground units from over-chasing unreachable flyers.
  // (Sabbar, Rumman, Filfil Har, Foul, Naana, Habaq, Zayt holy bolt).
  // Bypass tank taunt, glide directly to back-line targets. Lower HP since
  // half the squad can't shoot them. Visual: drift bob + ground shadow.
  {id:42,name:'Sky Wasp',act:1,arch:'ranged',color:'#d4a417',accent:'#7a5e0d',hp:118,dmg:29,speed:0.46,atkSpd:82,range:135,size:24,armor:0,magicRes:1,flying:true,projType:'normal',prefersBackline:true,points:80},
  {id:43,name:'Dust Roc',act:2,arch:'ranged',color:'#a08a5a',accent:'#6a5a3a',hp:224,dmg:42,speed:0.46,atkSpd:94,range:140,size:26,armor:0,magicRes:2,flying:true,projType:'normal',prefersBackline:true,points:140},
  {id:44,name:'Sandstorm Djinn',act:3,arch:'caster',color:'#c8a05a',accent:'#7a5028',hp:318,dmg:76,speed:0.48,atkSpd:94,range:152,size:24,armor:0,magicRes:3,armorType:'warded',flying:true,projType:'fire',prefersBackline:true,points:230},
  {id:45,name:'Frost Phoenix',act:4,arch:'ranged',color:'#a8d8e8',accent:'#5a8aa0',hp:410,dmg:94,speed:0.50,atkSpd:82,range:152,size:24,armor:0,magicRes:4,flying:true,projType:'frost',slowOnHit:true,slowDur:75,prefersBackline:true,points:340},
  {id:46,name:'Doom Vulture',act:5,arch:'ranged',color:'#3a0a2a',accent:'#1a0010',hp:555,dmg:126,speed:0.50,atkSpd:82,range:160,size:26,armor:1,magicRes:5,flying:true,projType:'curse',prefersBackline:true,points:460},
  // ===== BURROWERS (id 47-51, one per act) =====
  // burrow:true + burrowTimer:N Ã¢â€ â€™ enemy starts UNTARGETABLE, sprints toward
  // king at 1.6x speed, then surfaces near the back-line with a dust burst.
  // Visual while burrowed: dust trail + faint shadow. Forces players to keep
  // a back-line defender or focus the burrower the moment it surfaces.
  // arch:'assassin' so they punch hard once up. armorType:'unarmored' (squishy
  // when surfaced Ã¢â‚¬â€ Sabbar / Rumman / casters delete them fast).
  {id:47,name:'Tunnel Beetle',act:1,arch:'assassin',color:'#5a4a2a',accent:'#3a2f1a',hp:175,dmg:50,speed:0.50,atkSpd:48,range:32,size:24,armor:1,magicRes:1,burrow:true,burrowTimer:240,points:90},
  {id:48,name:'Sand Burrower',act:2,arch:'assassin',color:'#a08660',accent:'#5a4030',hp:280,dmg:84,speed:0.55,atkSpd:48,range:32,size:24,armor:1,magicRes:2,burrow:true,burrowTimer:270,points:140},
  {id:49,name:'Tomb Crawler',act:3,arch:'assassin',color:'#c8b078',accent:'#7a6a44',hp:380,dmg:108,speed:0.55,atkSpd:42,range:34,size:26,armor:2,magicRes:2,burrow:true,burrowTimer:300,points:200},
  {id:50,name:'Frost Worm',act:4,arch:'assassin',color:'#88a8c0',accent:'#3a5a78',hp:480,dmg:130,speed:0.55,atkSpd:42,range:34,size:24,armor:2,magicRes:3,burrow:true,burrowTimer:330,slowOnHit:true,slowDur:90,points:280},
  {id:51,name:'Doom Maw',act:5,arch:'assassin',color:'#1a0010',accent:'#3a0a2a',hp:640,dmg:170,speed:0.55,atkSpd:42,range:36,size:26,armor:3,magicRes:4,burrow:true,burrowTimer:360,points:400},
  // ===== MELEE DPS FILLERS =====
  // Act 2 had no arch:'dps' Ã¢â‚¬â€ dpsLike fell back to Crow Cultist (caster),
  // flooding every theme with 180-range purple casters. This melee brute
  // fills the gap so ELITE_PAIR / MIXED_PUSH / TANK_WALL get proper melee.
  {id:52,name:'Bazaar Brute',act:2,arch:'dps',color:'#8a5a2a',accent:'#5a3818',hp:310,dmg:68,speed:0.34,atkSpd:48,range:36,size:24,armor:2,magicRes:1,points:60}
];
