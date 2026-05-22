// boss data.
// Extracted from the v8 runtime without behavior changes.

export const BOSSES=[
  {id:0,name:'Brood Mother',tier:'mini',act:1,color:'#aa4444',accent:'#5a1818',hp:11200,dmg:105,speed:0.30,atkSpd:60,range:40,size:42,armor:5,magicRes:5,points:300,raidAoeDmg:33,
    // arena stage 3 elite: spawns 2 caterpillar adds every 8s, basic attacks apply 3s poison DoT.
    spawnCD:720,spawnEnemy:0,spawnCount:2,spawnPhase:1,
    debuffCD:480,debuffType:'poison',debuffDmg:9,debuffDur:300,debuffPhase:1,
    timeEnrageAt:12600},
  {id:1,name:'Hornet Sovereign',tier:'strong',act:1,color:'#c08820',accent:'#7a4a0a',hp:21500,dmg:108,speed:0.42,atkSpd:52,range:60,size:48,armor:7,magicRes:4,points:700,raidAoeDmg:30,spawnFromTop:true,spawnYOffset:52,entryHold:30,
    // arena stage 5 boss (retuned 2026-04-30 Ã¢â‚¬â€ was a wall at L2 cap; HP -20%,
    // dmg -12%, atkSpd 48Ã¢â€ â€™54 (slower), lungeDmg -39%, lungeCD +50%, escorts 2Ã¢â€ â€™1,
    // hornet aura mult 1.20Ã¢â€ â€™1.12, Wing-Buzz dmg -25%).
    // 76 px buff aura grants nearby hornet enemies +12% atkSpd.
    // Boss-round support uses weak themed minions, not full normal-wave enemies.
    // Wing-buzz AoE every 8s. Frenzy at 50% HP Ã¢â‚¬â€ +20% atkSpd self (one-shot).
    aoeCD:480,aoeRadius:72,aoeDmg:70,aoePhase:1,aoeColor:'#ffaa00',
    buzzShotCD:420,buzzShotCount:3,buzzShotDmg:38,buzzShotPhase:1,
    hornetAura:76,hornetAuraMult:1.12,
    escortSpawn:1,escortEnemy:2,
    // Recurring hive support: 1 light skirmisher every 12s.
    spawnCD:720,spawnEnemy:2,spawnCount:1,spawnPhase:1,
    bossMinionName:'Hive Skirmisher',bossMinionHpMult:0.42,bossMinionDmgMult:0.50,bossMinionPointsMult:0.35,
    frenzyAt:0.5,frenzyAtkSpdMult:0.90,
    royalStingEvery:4,royalStingHpPct:0.034,royalStingPoisonDmg:3,royalStingDur:360,royalStingAmp:1.10,royalHatchlingHpPct:0.024,
    royalCarapaceAt:[0.70,0.35],royalCarapaceCast:720,royalCarapaceShieldPct:0.11,royalCarapaceShieldMin:1500,royalCarapaceShieldMax:2000,royalCarapaceFailDmg:165,royalCarapaceTickDmg:27,royalCarapaceAdds:2,
    projType:'normal',timeEnrageAt:9000},
  {id:2,name:'Spice Lord',tier:'mini',act:2,color:'#aa4a8e',accent:'#5e224a',hp:3200,dmg:40,speed:0.30,atkSpd:60,range:50,size:44,armor:3,magicRes:5,points:400,
    // P1: toxic volley AoE. P2: + poison cloud. P3: + frenzy disease debuff.
    aoeCD:552,aoeRadius:90,aoeDmg:50,aoePhase:1,aoeColor:'#aa66cc',
    poisonCloudCD:621,poisonCloudPhase:2,
    debuffCD:552,debuffType:'amp',debuffDur:300,debuffPhase:3,
    projType:'curse',timeEnrageAt:9000,frenzyOnEnrage:true},
  {id:3,name:'Veiled Assassin',tier:'mini',act:2,color:'#3a1a1a',accent:'#1a0a0a',hp:3800,dmg:55,speed:0.55,atkSpd:42,range:40,size:42,armor:3,magicRes:3,points:500,
    // P1: smoke-bomb fog AoE. P2: + vanish-and-ambush. P3: + mark-of-death debuff.
    aoeCD:621,aoeRadius:60,aoeDmg:30,aoePhase:1,aoeColor:'#3a3a3a',aoeIsFog:true,
    vanishCD:621,vanishMult:3.0,vanishPhase:2,
    debuffCD:552,debuffType:'mark',debuffDur:300,debuffPhase:3,
    timeEnrageAt:8250},
  {id:4,name:'Sultan of Embers',tier:'vs',act:2,color:'#dc6020',accent:'#7a3008',hp:33000,dmg:145,speed:0.35,atkSpd:54,range:80,size:54,armor:5,magicRes:6,points:1500,raidAoeDmg:51,
    // arena stage 10 boss: Inferno Pulse AoE every 6s. Meteor every ~12s on a
    // random unit (P2). Cinder Pact spawns 1 fire imp every 15s (replaces the
    // unfair livingBomb chain). Burning DoT debuff applied every 10s.
    // At 25% HP, summons 3 fire elementals (Sons of Embers).
    aoeCD:480,aoeRadius:100,aoeDmg:86,aoePhase:1,aoeColor:'#ff6600',
    meteorCD:720,meteorDmg:135,meteorRadius:80,meteorPhase:2,
    debuffCD:600,debuffType:'poison',debuffDmg:9,debuffDur:240,debuffPhase:2,
    spawnCD:900,spawnEnemy:0,spawnCount:1,spawnPhase:1, // Cinder Pact Ã¢â‚¬â€ 1 imp every 15s
    sonsAt:0.25,sonsCount:3,
    searingBrandEvery:4,searingBrandHpPct:0.063,searingBrandHealCut:0.10,searingBrandDur:480,
    projType:'fire',timeEnrageAt:12000},
  {id:5,name:'Dune Worm',tier:'mini',act:3,color:'#8e6a3a',accent:'#5a3f1a',hp:7600,dmg:68,speed:0.20,atkSpd:72,range:46,size:50,armor:6,magicRes:2,points:700,
    // Buffed 2026-05-03: HP 4500Ã¢â€ â€™5400 (+20%), dmg 50Ã¢â€ â€™55, burrowCD 552Ã¢â€ â€™432 (every 7s),
    // aoeCD 621Ã¢â€ â€™480, added magicBolt (sand-spear ranged magic at random unit).
    burrowCD:432,burrowDmg:135,burrowPhase:1,
    aoeCD:480,aoeRadius:110,aoeDmg:92,aoePhase:2,aoeColor:'#a07a44',aoeKnockback:true,
    debuffCD:480,debuffType:'slow',debuffDur:300,debuffPhase:3,
    magicBoltCD:540,magicBoltPhase:1,magicBoltDmg:110,magicBoltColor:'#c8a05a',
    timeEnrageAt:10500},
  {id:6,name:'Pharaoh Ka',tier:'strong',act:3,color:'#d4a857',accent:'#7a5a22',hp:21000,dmg:100,speed:0.30,atkSpd:60,range:70,size:52,armor:6,magicRes:7,points:2000,
    // Buffed 2026-05-03 (felt papery): HP 11000Ã¢â€ â€™13000 (+18%), dmg 72Ã¢â€ â€™80,
    // spawnCD 690Ã¢â€ â€™480 (every 8s, +1 mummy in P3), aoeCD 483Ã¢â€ â€™390, added magicBolt
    // for steady ranged magic pressure.
    spawnCD:480,spawnEnemy:11,spawnCount:2,spawnCountP3:3,spawnPhase:1,
    aoeCD:390,aoeRadius:120,aoeDmg:76,aoePhase:2,aoeColor:'#d4a857',
    debuffCD:540,debuffType:'deathMark',debuffDmg:280,debuffDur:300,debuffPhase:3,
    magicBoltCD:480,magicBoltPhase:1,magicBoltDmg:135,magicBoltColor:'#d4a857',
    resurrectOnce:true,
    projType:'curse',timeEnrageAt:12000},
  {id:7,name:'Ice Wraith',tier:'mini',act:4,color:'#88c0e0',accent:'#445a78',hp:9200,dmg:82,speed:0.40,atkSpd:54,range:60,size:46,armor:4,magicRes:7,points:900,
    // Buffed 2026-05-03: HP 5800Ã¢â€ â€™6800 (+17%), dmg 60Ã¢â€ â€™65, aoeCD 552Ã¢â€ â€™432 (every 7s),
    // blizzardCD 690Ã¢â€ â€™540, added magicBolt. iceBlockCD nudged down to 1620 (27s).
    aoeCD:432,aoeRadius:100,aoeDmg:90,aoePhase:1,aoeColor:'#88ddff',aoeFreeze:120,
    blizzardCD:540,blizzardPhase:2,
    debuffCD:480,debuffType:'slow',debuffDur:240,debuffPhase:3,
    iceBlockCD:1620,iceBlockDur:180,iceBlockPhase:3,
    magicBoltCD:480,magicBoltPhase:1,magicBoltDmg:122,magicBoltColor:'#88ddff',
    projType:'frost',timeEnrageAt:10500},
  {id:8,name:'Frost Titan King',tier:'vs',act:4,color:'#5a8eb8',accent:'#3a5a78',hp:24500,dmg:118,speed:0.22,atkSpd:78,range:60,size:56,armor:8,magicRes:5,points:2500,
    // Buffed 2026-05-03 (felt papery): HP 14000Ã¢â€ â€™17000 (+21%), dmg 85Ã¢â€ â€™95,
    // stompCD 690Ã¢â€ â€™540, aoeCD 1242Ã¢â€ â€™720 (wind every 12s, was 21s Ã¢â‚¬â€ barely fired),
    // added magicBolt (ice-spike ranged magic) + spawnCD (frost wolf every 14s).
    stompCD:540,stompRadius:120,stompDmg:135,stompStun:90,stompPhase:1,
    aoeCD:720,aoeRadius:9999,aoeDmg:0,aoeSlowAll:300,aoePhase:2,aoeColor:'#88ddff',aoeIsWind:true,
    debuffCD:540,debuffType:'freeze',debuffDmg:155,debuffDur:120,debuffPhase:3,
    spawnCD:840,spawnEnemy:13,spawnCount:1,spawnPhase:1,
    magicBoltCD:540,magicBoltPhase:1,magicBoltDmg:165,magicBoltColor:'#a8d8e8',
    avalancheAt:0.25,
    timeEnrageAt:13500},
  {id:9,name:'Crow Gerban',tier:'final',act:5,color:'#1a0010',accent:'#3a0a3a',hp:32000,dmg:120,speed:0.32,atkSpd:54,range:90,size:64,armor:10,magicRes:10,points:9999,
    // 3-phase mythic. Phase 1: caw + crows. Phase 2: + dive + feather. Phase 3: + storm + wind + lieutenants.
    // Spam tightened Ã¢â‚¬â€ cawCD 414Ã¢â€ â€™540 (~9s), stormCD 104Ã¢â€ â€™156 (~2.6s), so P3
    // doesn't completely lock the player out of healing/positioning windows.
    spawnCD:900,spawnEnemy:16,spawnCount:2,spawnPhase:1,
    cawCD:540,cawDmg:175,cawPhase:1,
    diveCD:720,diveDmg:220,divePhase:2,
    featherCD:621,featherCount:7,featherPhase:2,
    stormCD:240,stormPhase:3,
    windCD:840,windPhase:3,
    lieutenantPhase:3,lieutenantSpawned:false,
    timeEnrageAt:19200},
  {id:10,name:'Astral Lantern Warden',tier:'mini',act:2,color:'#3f6fff',accent:'#ffd166',hp:38000,dmg:165,speed:0.28,atkSpd:54,range:150,size:58,armor:4,magicRes:7,points:600,
    // Stage 8 rework: cosmic lantern guardian with visible raid mechanics.
    // No vanish/smoke/mark; all damage comes from authored Warden casts.
    astralWarden:true,astralStorm:true,disableGenericBossPressure:true,
    starfallCD:360,starfallFirst:120,starfallCount:4,starfallDmg:86,starfallRadius:46,
    eclipseBeamCD:450,eclipseBeamFirst:270,eclipseBeamDmg:122,eclipseBeamWidth:50,
    starfallTargetLockMult:0.90,starfallFrontlineRadius:96,starfallFrontlineMult:0.55,eclipseTargetLockMult:0.90,eclipseFrontlineRadius:104,eclipseFrontlineMult:0.62,
    gravityTollCD:540,gravityTollFirst:180,gravityTollDmg:98,gravityTollRadius:9999,gravityTollPhase:2,
    lanternOrbitCD:660,lanternOrbitFirst:180,lanternOrbitDmg:56,lanternOrbitShots:6,lanternOrbitPhase:3,
    lanternWardAt:[0.70,0.35],lanternWardShieldPct:0.10,astralBlightDur:300,astralBlightHpPct:0.0105,gravityBrandDur:300,gravityBrandHealCut:0.22,gravityTollFrontlineHpPct:0.075,gravityTollTankMult:0.76,gravityTollMeleeMult:0.90,astralBacklineSpellMult:0.88,
    projType:'lightning',timeEnrageAt:11400},
  // ===== STAGE 7 Ã¢â‚¬â€ WALL BOSS (Cursed Bazaar Gate) =====
  // Phase 1: barrier blocks the path. Boss untargetable, throws curses over the wall.
  // Healers' restoration purifies the barrier (drains 50% of each heal into healHp).
  // When healHp >= healHpMax, barrier shatters, boss drops down for the real fight.
  {id:11,name:'Cursed Bazaar Gate',tier:'mini',act:2,color:'#5a2a8e',accent:'#2a0a4a',hp:4600,dmg:58,speed:0.32,atkSpd:60,range:180,size:46,armor:3,magicRes:6,points:600,
    // Tuning history: hp 3500Ã¢â€ â€™6500Ã¢â€ â€™5200Ã¢â€ â€™4600, dmg 55Ã¢â€ â€™75Ã¢â€ â€™65Ã¢â€ â€™58, range 80Ã¢â€ â€™220Ã¢â€ â€™180.
    // Settling on a slightly easier middle ground after final playtest pass.
    hasBarrier:true,barrierHealMax:600,
    // Phase 1 Ã¢â‚¬â€ over the wall, fires from start
    magicBoltCD:360,magicBoltPhase:1,magicBoltDmg:88,magicBoltColor:'#a855f7',
    aoeCD:480,aoeRadius:115,aoeDmg:70,aoePhase:1,aoeColor:'#5a2a8e',
    spawnCD:540,spawnEnemy:4,spawnCount:1,spawnPhase:1, // Crow Cultist every 9s
    // Phase 2 Ã¢â‚¬â€ boss revealed, ground kit
    lungeCD:720,lungeDist:150,lungeDmg:95,lungePhase:2,
    debuffCD:600,debuffType:'amp',debuffDur:300,debuffPhase:2,
    projType:'curse',timeEnrageAt:11000},
  // ===== STAGE 12 Ã¢â‚¬â€ SKY TYRANT (Storm Roc) =====
  // Phase 1: AERIAL Ã¢â‚¬â€ patrols overhead, untargetable. Drops bombs / strafes / storms.
  // 3 lieutenants spawn at wave start; main boss lands when all 3 are defeated.
  {id:12,name:'Storm Roc',tier:'mini',act:3,color:'#a08a5a',accent:'#5a4a2a',hp:8200,dmg:86,speed:0.28,atkSpd:60,range:55,size:54,armor:5,magicRes:4,points:900,
    isAerial:true,lieutenantSpawn:true,lieutenantHpPct:0.22,lieutenantDmgPct:0.50,landingHpCap:0.64,
    // Phase 1 aerial abilities (use new handlers)
    bombDropCD:360,bombDropDmg:90,bombDropRadius:78,bombDropPhase:1,
    skyStrafeCD:480,skyStrafeDmg:62,skyStrafePhase:1,
    sandStormCD:840,sandStormDmg:48,sandStormPhase:1,
    // Phase 2 ground kit (after landing Ã¢â‚¬â€ phaseMin 1 so they fire immediately
    // post-landing; aerial gating in updateBoss prevents these from firing while flying).
    aoeCD:540,aoeRadius:100,aoeDmg:90,aoePhase:1,aoeColor:'#a08a5a',
    lungeCD:780,lungeDist:140,lungeDmg:120,lungePhase:1,
    magicBoltCD:540,magicBoltPhase:1,magicBoltDmg:120,magicBoltColor:'#a08a5a',
    projType:'normal',timeEnrageAt:12000},
  {id:13,name:'Winterglass Magistrate',tier:'mini',act:2,color:'#9fdcff',accent:'#eef8ff',hp:26000,dmg:134,speed:0.22,atkSpd:70,range:96,size:50,armor:4,magicRes:9,armorType:'warded',points:900,fixedGoldReward:200,raidAoeDmg:27,spawnFromTop:true,fixedSpawnCenter:true,spawnYOffset:42,entryHold:60,lateRoundScale:false,
    // Stage 10 wave-4 mini-boss: frost court teaching fight. Threshold
    // crystals are priority targets so units swap off the shielded boss
    // without requiring manual movement.
    winterglassMagistrate:true,frostBoss:true,stormVizier:true,projType:'frost',
    twinWardsCD:1200,stormWardThresholds:[1,0.75,0.50,0.25],stormWardHp:3200,stormWardScales:[1,1.05,1.10,1.15],stormWardSizeScales:[1,1.12,1.22,1.32],
    stormShieldDamageMult:0.24,stormExposeDur:240,stormExposeMult:1.35,
    ironSurgeEvery:180,ironSurgeFirst:90,ironSurgeDmg:66,
    mirrorCleaveEvery:144,mirrorCleaveFirst:72,mirrorCleaveDmg:120,mirrorCleaveRadius:138,
    stormWardOverchargeFirst:1200,stormWardOverchargeSecond:2400,stormWardOverchargeMults:[1,1.15,1.30],
    chainDecreeCD:500,chainDecreeFirst:190,chainDecreeDmg:80,chainDecreeCount:3,
    groundingPulseCD:360,groundingPulseFirst:300,groundingPulseDmg:170,groundingPulseRadius:128,groundingPulseTankMult:1.10,groundingPulseMeleeMult:0.78,groundingStormShockRadius:680,groundingStormShockMult:0.34,groundingBrandDur:240,groundingBrandHealCut:0.10,
    courtPulseCD:420,courtPulseFirst:120,courtPulseDmg:52,courtPulseTankMult:1.18,courtPulseMeleeMult:0.82,courtPulseBacklineMult:0.64,
    stormVenomDur:300,stormVenomHpPct:0.0075,stormVenomMinDmg:5,
    silencingDecreeCD:840,silencingDecreeCDMin:600,silencingDecreeCDMax:840,silencingDecreeFirst:520,silencingDecreeDur:150,
    tankCurseCD:720,tankCurseFirst:420,tankCurseDur:240,tankCurseHpPct:0.014,tankCurseHealCut:0.12,stormEnrageSkillMult:1.18,stormDeepEnrageDelay:3600,stormDeepEnrageSkillMult:1.35,
    timeEnrageAt:13650},
  {id:14,name:'Sphinx Judicator',tier:'mini',act:3,color:'#d8a84a',accent:'#6f4a18',hp:19000,dmg:96,speed:0.24,atkSpd:66,range:82,size:52,armor:7,magicRes:0,armorType:'warded',points:1200,raidAoeDmg:30,spawnFromTop:true,spawnYOffset:58,entryHold:45,
    // Stage 13 mini-boss: boss-only wave 6. Solar Riddle is the DPS check;
    // Death Sentence + sun pulses are the healer/sustain check. No escorts.
    projType:'fire',poisonOnHit:true,poisonDmg:6,poisonDur:180,
    magicBoltCD:420,magicBoltPhase:1,magicBoltDmg:115,magicBoltColor:'#ffd166',
    aoeCD:600,aoeRadius:118,aoeDmg:76,aoePhase:1,aoeColor:'#d8a84a',
    meteorCD:780,meteorDmg:125,meteorRadius:72,meteorPhase:2,
    debuffCD:540,debuffType:'deathMark',debuffDmg:240,debuffDur:300,debuffPhase:1,
    royalCarapaceAt:[0.72,0.42],royalCarapaceCast:600,royalCarapaceShieldPct:0.13,royalCarapaceShieldMin:2200,royalCarapaceShieldMax:3200,royalCarapaceFailDmg:185,royalCarapaceTickDmg:18,royalCarapaceAdds:0,
    timeEnrageAt:11500}
];
