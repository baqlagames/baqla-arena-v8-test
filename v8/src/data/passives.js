// unit passive and branch data.
// Extracted from the v8 runtime without behavior changes.

export const ARENA_UNIT_PASSIVES={
  0: {p1:'tankCharge', p2:'shieldBash'},    // Zavs - charge + Shield Bash setup. Branches define team value at L3.
  1: {p1:'deathGrip', p2:'runeWound'}, // Taoon - Death Knight grip + shared 3rd-hit weaken
  2: {p1:'mudClap', p2:'batataRoleChoice'},    // Batata - anti-swarm tank, path chosen at L3
  3: {p1:'wingsOfLight', p2:'shieldOfVengeance'}, // Zayt Ã¢â‚¬â€ Wings of Light (+20% dmg + crit), Shield of Vengeance (absorb Ã¢â€ â€™ burst)
  4: {p1:'garrote', p2:'sliceAndDice'}, // Felfel Ã¢â‚¬â€ Garrote stealth opener + Slice and Dice attack speed
  5: {p1:'bladeRush', p2:'risingSlash'},  // Jazar Ã¢â‚¬â€ Blademaster
  6: {p1:'hotStreak', p2:'ignite'},     // Alibaba Ã¢â‚¬â€ Hot Streak crit chain + Ignite burn DoT
  7: {p1:'agony',     p2:'unstableAffliction'},     // Jafaar Ã¢â‚¬â€ Agony DoT + UA death explosion
  8: {p1:'aimedShotMark', p2:'steadyFocus'},    // Zaatar Ã¢â‚¬â€ Marksmanship (Aimed Shot mark + Steady Focus)
  9: {p1:'autoTurret', p2:'overclock'}, // Rumman Ã¢â‚¬â€ auto turret deploy + overclock atk speed
  10:{p1:'prayerOfMending', p2:'angelOfMercy'},    // Naana Ã¢â‚¬â€ Holy Priest
  11:{p1:'lifebloom', p2:'efflorescence'},   // Bakdounes Ã¢â‚¬â€ Resto Druid
  12:{p1:'soothingAroma', p2:'essenceInfusion'},   // Habaq - Aromancer
  13:{p1:'azureSen', p2:'thirdEye'},     // Monk DPS - Ronin Dragoon
  99:{p1:'champion',  p2:'devour'}     // Vodka
};

ARENA_UNIT_PASSIVES[3] = {p1:'swordSaintCycle', p2:'judgmentSeals'};

export const ARENA_UNIT_BRANCHES={
  0: { // Zavs
    a:{name:'Zavs Citadel',ar:'Zavs Citadel',role:'Melee Protector',
       color:'#607282',accent:'#d6b45f',
       p1:'bodyguardLine',p2:'guardPulse',
       statMod:{maxHp:1.18,armor:1.10},
       branchProps:{_branchA3:'guardPulse',_branchA5:'unbreakableLine'}},
    b:{name:'Zavs Vanguard',ar:'Zavs Vanguard',role:'Physical Enabler',
       color:'#b88a32',accent:'#ffe066',
       p1:'forwardStandard',p2:'armorCrack',
       statMod:{maxHp:1.10,dmg:1.08,atkSpd:0.92},
       branchProps:{_branchA3:'armorCrack',_branchA5:'focusMark'}}
  },
  1: { // Taoon - Death Knight
    a:{name:'Taoon Bloodwarden',ar:'Taoon Bloodwarden',role:'Ally-Saving Tank',
      color:'#5a1020',accent:'#2a0810',
       p1:'deathGrip',p2:'deathStrike',
       statMod:{maxHp:1.18,armor:1.12,magicRes:1.15,dmg:0.95},
       branchProps:{_branchA3:'runeWound',_branchA5:'bloodOath'}},
    b:{name:'Taoon Gravebinder',ar:'Taoon Gravebinder',role:'Control Tank',
       color:'#2c1a4e',accent:'#44c7ff',
       p1:'deathGrip',p2:'soulChains',
       statMod:{maxHp:1.10,magicRes:1.08,dmg:1.06,atkSpd:0.94},
       branchProps:{_branchA3:'runeWound',_branchA5:'markedForRuin'}}
  },
  2: { // Batata
    a:{name:'Batata Mudroot Warden',ar:'Batata Mudroot Warden',role:'Backline Protector',
       color:'#4f7a3a',accent:'#8a6a32',
       p1:'backlineGarden',p2:'mudClap',
       statMod:{maxHp:1.22,magicRes:1.10,dmg:0.95},
       branchProps:{_branchA3:'shelterPulse',_branchA5:'rootShelter'}},
    b:{name:'Batata Stonehide Mauler',ar:'Batata Stonehide Mauler',role:'Swarm Disruptor',
       color:'#8a6a3a',accent:'#5a3c1a',
       p1:'mirebreaker',p2:'mudClap',
       statMod:{maxHp:1.14,armor:1.12,dmg:1.06,atkSpd:0.96},
       branchProps:{_branchA3:'quakeSnare',_branchA5:'mudbreakerRoar'}}
  },
  3: { // Zayt (Olive) Ã¢â‚¬â€ Paladin class tree. Base = Retribution (Wings + Shield of Vengeance, Avenging Wrath sig).
    a:{name:'King Muqaddas',ar:'Ã˜Â²Ã™Å Ã˜Âª Ã™â€¦Ã™â€šÃ˜Â¯Ã™â€˜Ã˜Â³',role:'Hallowed Guardian',
       color:'#c8c8e8',accent:'#5a6088',
       p1:'avengersShield',p2:'ardentDefender',
       statMod:{maxHp:2.20,dmg:0.85,atkSpd:0.95,armor:2.20,magicRes:1.65},
       branchAttackType:'physical',
       branchProps:{arch:'tank',taunt:{range:110},range:50,armorType:'heavy',consecration:true,_branchA3:'hallowedLeap',_branchA5:'guardianOfAncientKings'}},
    b:{name:'King Mubarak',ar:'Ã˜Â²Ã™Å Ã˜Âª Ã™â€¦Ã˜Â¨Ã˜Â§Ã˜Â±Ã™Æ’',role:'Holy',
       color:'#f0e8a8',accent:'#a08a2a',
       p1:'lightOfDawn',p2:'wordOfGlory',
       statMod:{maxHp:0.90,dmg:0.50,atkSpd:1.0},
       branchAttackType:'magic',
       branchProps:{paladinHybrid:false,arch:'healer',range:170,auraMastery:true,
         artOfWar:false,hammerOfWrath:false,_branchA3:'holyPrism',_branchA5:'barrierOfFaith',
         lightOfMartyr:true,infusionOfLight:true,holyShockBuiltIn:true,layOnHandsCD:55}}
  },
  4: { // Felfel (Rogue)
    a:{name:'Felfel Khafi',ar:'Ã™ÂÃ™â€žÃ™ÂÃ™â€ž Ã˜Â®Ã™ÂÃ™Å ',role:'Shadow Dancer',
       color:'#3a1a3a',accent:'#1a0a1a',
       p1:'shadowDance',p2:'eviscerate',
       statMod:{dmg:1.10},
       branchProps:{cloakOfShadows:true}},
    b:{name:'Felfel Samm',ar:'Ã™ÂÃ™â€žÃ™ÂÃ™â€ž Ã˜Â³Ã˜Â§Ã™â€¦',role:'Poison Assassin',
       color:'#2a3a1a',accent:'#0a1a0a',
       p1:'bladeFlurry',p2:'crimsonVial',
       statMod:{dmg:1.15},
       branchProps:{sepsis:true,poisonPayoff:true}}
  },
  5: { // Jazar (Carrot) Ã¢â‚¬â€ Blademaster rework
    a:{name:'Jazar Romi',ar:'Ã˜Â¬Ã˜Â²Ã˜Â± Ã˜Â±Ã™Ë†Ã™â€¦Ã™Å ',role:'Sword Saint',
       color:'#d44e1a',accent:'#5a1f08',
       p1:'mortalStrike',p2:'executeBlade',
       statMod:{maxHp:1.10,dmg:1.12},
       branchProps:{_branchA3:'colossusSmash',_branchA5:'enrageBlade'}},
    b:{name:'Jazar Azraq',ar:'Ã˜Â¬Ã˜Â²Ã˜Â± Ã˜Â£Ã˜Â²Ã˜Â±Ã™â€š',role:'Storm Binder',
       color:'#2f8fe8',accent:'#124f8c',
       p1:'windStep',p2:'bladeDance',
       statMod:{maxHp:1.05,atkSpd:0.90},
       branchProps:{_branchA3:'windSlash',_branchA5:'thousandCuts'}}
  },
  6: { // Alibaba (Chili) Ã¢â‚¬â€ Mage class tree. Base=Pyromancer, A=Frost, B=Storm.
    a:{name:'Alibaba Barid',ar:'Ã˜Â¹Ã™â€žÃ™Å  Ã˜Â¨Ã˜Â§Ã˜Â¨Ã˜Â§ Ã˜Â¨Ã˜Â§Ã˜Â±Ã˜Â¯',role:'Frost Mage',
       color:'#44aadd',accent:'#1a6a8a',
       p1:'frostbolt',p2:'shatter',
       statMod:{dmg:0.90,atkSpd:0.90},
       branchAttackType:'magic',
       branchProps:{_branchA3:'blizzard',_branchA5:'waterElemental',projType:'frost'}},
    b:{name:'Alibaba Barqi',ar:'Ã˜Â¹Ã™â€žÃ™Å  Ã˜Â¨Ã˜Â§Ã˜Â¨Ã˜Â§ Ã˜Â¨Ã˜Â±Ã™â€šÃ™Å ',role:'Storm Mage',
       color:'#8866cc',accent:'#4a3080',
       p1:'overload',p2:'stormkeeper',
       statMod:{dmg:1.10},
       branchAttackType:'magic',
       branchProps:{_branchA3:'chainLightning',_branchA5:'stormElemental',projType:'lightning'}}
  },
  7: { // Jafaar (Fava) Ã¢â‚¬â€ Warlock class tree (full WoW Warlock rework).
       // Base = Affliction (Agony + Unstable Affliction). A = Demonology, B = Destruction.
    a:{name:'Jafaar Akhdar',ar:'Ã˜Â¬Ã˜Â¹Ã™ÂÃ˜Â± Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â±',role:'Demonology',
       color:'#5a3a8a',accent:'#2a1a4a',
       p1:'demonicEmpowerment',p2:'soulLink',
       statMod:{maxHp:1.10},
       branchAttackType:'magic'},
    b:{name:'Jafaar Mudammas',ar:'Ã˜Â¬Ã˜Â¹Ã™ÂÃ˜Â± Ã™â€¦Ã˜Â¯Ã™â€¦Ã˜Â³',role:'Destruction',
       color:'#8a3a1a',accent:'#4a1a08',
       p1:'immolate',p2:'havoc',
       statMod:{maxHp:0.90,dmg:1.20},
       branchAttackType:'magic'}
  },
  8: { // Zaatar (Thyme) Ã¢â‚¬â€ Hunter class tree (WoW Hunter rework).
       // Base = Marksmanship (Aimed Shot mark + Steady Focus). Wolf pet.
    a:{name:'Zaatar Bary',ar:'Ã˜Â²Ã˜Â¹Ã˜ÂªÃ˜Â± Ã˜Â¨Ã˜Â±Ã™â€˜Ã™Å ',role:'Trapper',
       color:'#7a5a3a',accent:'#3a2a18',
       p1:'explosiveTrap',p2:'lockAndLoad',
       statMod:{maxHp:1.10},
       branchAttackType:'physical',
       branchProps:{_branchA3:'explosiveShot'}},
    b:{name:'Zaatar Akhdar',ar:'Ã˜Â²Ã˜Â¹Ã˜ÂªÃ˜Â± Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â±',role:'Beast Mastery',
       color:'#5a8a6a',accent:'#2a4a30',
       p1:'killCommand',p2:'bestialWrath',
       statMod:{dmg:0.90},
       branchAttackType:'pierce',
       branchProps:{_branchA3:'direBeast'}}
  },
  9: { // Rumman (Pomegranate) Ã¢â‚¬â€ Field Engineer
    a:{name:'Rommana Hilou',ar:'Ã˜Â±Ã™â€¦Ã™â€˜Ã˜Â§Ã™â€  Ã˜Â­Ã™â€žÃ™Ë†',role:'Siege Engineer',
       color:'#c02d5f',accent:'#d9a52a',
       p1:'artilleryTurret',p2:'munitionsCache',
       statMod:{dmg:1.15},
       branchProps:{_branchA3:'rocketBarrage',_branchA5:'napalmGrid'}},
    b:{name:'Rommana Murr',ar:'Ã˜Â±Ã™â€¦Ã™â€˜Ã˜Â§Ã™â€  Ã™â€¦Ã˜Â±Ã™â€˜',role:'Flying Cannon',
       color:'#4a5a6a',accent:'#2a3040',
       p1:'mechSuit',p2:'rocketPunch',
       statMod:{maxHp:1.30,dmg:1.00,armor:3},
       branchAttackType:'physical',
       branchProps:{arch:'ranged',range:170,armorType:'heavy',_branchA3:'shieldGenerator'}}
  },
  10: { // Naana (Mint) Ã¢â‚¬â€ Priest class tree (full rework).
        // Base = Holy (Prayer of Mending, Renew, Sanctify + Spirit of Redemption).
    a:{name:'Naana Hamra',ar:'Ã™â€ Ã˜Â¹Ã™â€ Ã˜Â§Ã˜Â¹ Ã˜Â£Ã˜Â­Ã™â€¦Ã˜Â±',role:'Discipline',
       color:'#e0c0d8',accent:'#a06070',
       p1:'penance',p2:'powerWordBarrier',
       statMod:{dmg:1.20},
       branchAttackType:'magic'},
    b:{name:'Naana Bayda',ar:'Ã™â€ Ã˜Â¹Ã™â€ Ã˜Â§Ã˜Â¹ Ã˜Â£Ã˜Â¨Ã™Å Ã˜Â¶',role:'Shadow',
       color:'#3a1a4a',accent:'#1a0a2a',
       p1:'shadowWordPain',p2:'shadowApparitions',
       statMod:{dmg:2.20,maxHp:0.75},
       branchAttackType:'magic',
       branchProps:{arch:'caster',range:175,atkSpd:85,_branchA3:'surrenderToMadness',_branchA5:'shadowWordDeath',projType:'voidShard'}}
  },
  11: { // Bakdounes (Parsley) Ã¢â‚¬â€ Resto Druid
    a:{name:'Bakdounes Qamari',ar:'Ã˜Â¨Ã™â€šÃ˜Â¯Ã™Ë†Ã™â€ Ã˜Â³ Ã™â€šÃ™â€¦Ã˜Â±Ã™Å ',role:'Moonkin',
       color:'#2a3a8e',accent:'#0a1a4a',
       p1:'eclipseCycle',p2:'astralPower',
       statMod:{dmg:2.0,maxHp:0.85},
       branchAttackType:'magic',
       branchProps:{arch:'ranged',range:185}},
    b:{name:'Bakdounes Mujaffaf',ar:'Ã˜Â¨Ã™â€šÃ˜Â¯Ã™Ë†Ã™â€ Ã˜Â³ Ã™â€¦Ã˜Â¬Ã™ÂÃ™Â',role:'Grove Keeper',
       color:'#2a6a1a',accent:'#0a3a08',
       p1:'wildGrowth',p2:'naturesBlessing',
       statMod:{maxHp:1.20}}
  },
  12: { // Habaq (Basil) Ã¢â‚¬â€ Aromancer class. A=Essence Oracle healer, B=Toxin Brewer DPS.
    a:{name:'Habaq Dhahabi',ar:'Ã˜Â­Ã˜Â¨Ã™â€š Ã˜Â°Ã™â€¡Ã˜Â¨Ã™Å ',role:'Essence Oracle',
       color:'#d4a842',accent:'#8a6a22',
       p1:'essenceBond',p2:'prescientMist',
       statMod:{maxHp:1.10},
       branchProps:{_branchA3:'goldenCascade',_branchA5:'prescientBarrier'}},
    b:{name:'Habaq Barri',ar:'Ã˜Â­Ã˜Â¨Ã™â€š Ã˜Â¨Ã˜Â±Ã™Å ',role:'Toxin Brewer',
       color:'#7a3a9a',accent:'#3a1a4a',
       p1:'toxicBrew',p2:'volatileMixture',
       statMod:{dmg:2.5,maxHp:0.85},
       branchAttackType:'magic',
       branchProps:{arch:'ranged',range:170}}
  },
  99: { // Vodka (hero)
    a:{name:'Vodka Borovaya',ar:'Ã™ÂÃ™Ë†Ã˜Â¯Ã™Æ’Ã˜Â§ Ã˜Â¨Ã™Ë†Ã˜Â±Ã™Ë†Ã™ÂÃ˜Â§Ã™Å Ã˜Â§',role:'Warbringer',
       color:'#88ddff',accent:'#3070a0',
       p1:'personalWhirlwind',p2:'bloodfury',
       statMod:{dmg:2.0,atkSpd:0.85}},
    b:{name:'Vodka Limonnaya',ar:'Ã™ÂÃ™Ë†Ã˜Â¯Ã™Æ’Ã˜Â§ Ã™â€žÃ™Å Ã™â€¦Ã™Ë†Ã™â€ Ã™Å Ã˜Â©',role:'Guardian',
       color:'#e8e060',accent:'#7a7020',
       p1:'champion',p2:'battleStandard',
       statMod:{maxHp:1.30}}
  }
};

export const ARENA_BASE_SIGNATURES={
  0:null, 1:null, 2:null,
  3:'divine_ruination', 4:'death_from_above', 5:'omnislash',
  6:'inferno_orb', 7:'soul_harvest', 8:'trueshot', 9:'omega_cannon',
  10:'divine_hymn',
  11:'incarnation_tree',     // Bakdounes Resto Druid base sig
  12:'herbal_tempest',
  13:'midare_stardiver',
  99:'heros_charge'
};

export const ARENA_BRANCH_SIGNATURES={
  '0_a':'citadel_wall', '0_b':'bannerfall_crash',
  '1_a':'crimson_covenant', '1_b':'maw_of_the_grave',
  '2_a':'living_bulwark', '2_b':'quakebreak_rampart',
  '3_a':'ashen_hallow', '3_b':'beacon_of_virtue', // Zayt: Prot=Ashen Hallow, Holy=Beacon of Virtue
  '4_a':'killing_spree', '4_b':'deathmark',
  '5_a':'final_strike', '5_b':'storm_anchor',
  '6_a':'frozen_orb', '6_b':'thunderstorm',
  '7_a':'summon_infernal', '7_b':'chaos_bolt', // Full WoW Warlock rework: Demo=Infernal, Destro=Chaos Bolt
  '8_a':'black_arrow', '8_b':'stampede',
  '9_a':'siege_dropship', '9_b':'mech_overdrive',
  '10_a':'rapture',
  '10_b':'void_torrent',
  '11_a':'celestial_alignment',  // Bakdounes Moonkin sig
  '11_b':'flourish',             // Bakdounes Grove Keeper sig
  '12_a':'elixir_of_life', '12_b':'pandemic',
  '99_a':'champions_wrath', '99_b':'last_stand'
};
