// role and progression data.
// Extracted from the v8 runtime without behavior changes.

export const ARENA_BASE_SPECS={
  13: {name:'Ronin Dragoon', role:'BURST MELEE',   icon:'RD'},  // Monk
  3:  {name:'Retribution',   role:'DPS PALADIN',   icon:'Ã¢Å¡â€'},  // Zayt
  6:  {name:'Pyromancer',    role:'FIRE MAGE',     icon:'Ã°Å¸â€Â¥'},  // Alibaba
  7:  {name:'Affliction',    role:'DOT WARLOCK',   icon:'Ã¢ËœÂ '},  // Jafaar
  8:  {name:'Marksmanship',  role:'SNIPER',        icon:'Ã°Å¸Å½Â¯'}, // Zaatar
  10: {name:'Holy',          role:'PRIEST HEALER', icon:'Ã¢Å“Å¸'},  // Naana
  11: {name:'Apothecary',    role:'HERBALIST',     icon:'Ã°Å¸Â§Âª'}, // Bakdounes
  12: {name:'Aromancer',     role:'ESSENCE HEALER',icon:'Ã°Å¸Å’Â¿'}  // Habaq
};

ARENA_BASE_SPECS[3] = {name:'Holy Sword Saint', role:'BOSS BURST', icon:'HS'};

export const ARENA_ROLE_ROOT_ORDER=['tank','melee','magic','pierce','healer'];

export const ARENA_ROLE_ROOTS={
  tank:{id:'tank',name:'Tank Root',role:'DEFENDER',unitIdx:0,cost:50,color:'#3a8e3a',accent:'#266026',desc:'Start as a simple shield tank, then choose a dedicated defender.'},
  melee:{id:'melee',name:'Melee DPS Root',role:'FRONTLINE DPS',unitIdx:5,cost:40,color:'#e07a1f',accent:'#9c4d0d',desc:'Start as a skirmisher, then choose assassin, blademaster, paladin, or ronin dragoon.'},
  magic:{id:'magic',name:'Magic Ranged Root',role:'MAGIC DPS',unitIdx:6,cost:50,color:'#8866cc',accent:'#44aadd',desc:'Start as a basic caster, then choose frost, thunder, poison, destruction, shadow, or moonkin.'},
  pierce:{id:'pierce',name:'Pierce Ranged Root',role:'PHYSICAL RANGED',unitIdx:8,cost:45,color:'#3d8a3d',accent:'#ffd700',desc:'Start as a marksman, then choose hunter or engineer paths.'},
  healer:{id:'healer',name:'Healer Root',role:'SUPPORT',unitIdx:10,cost:50,color:'#4cd97a',accent:'#1f8a3d',desc:'Start as a basic healer, then choose priest, aromancer, druid, or holy paladin.'}
};

export const ARENA_ROLE_PATHS={
  tank:[
    {id:'zavs_guardian',unitIdx:0,branch:'a',name:'Zavs Citadel',role:'Melee Protector',headline:'Citadel - protects fragile melee teams with guard pulses and a shield wall.'},
    {id:'zavs_warlord',unitIdx:0,branch:'b',name:'Zavs Vanguard',role:'Physical Enabler',headline:'Vanguard - boosts physical and pierce push teams with armor crack and banners.'},
    {id:'taoon_blood',unitIdx:1,branch:'a',name:'Taoon Bloodwarden',role:'Tank Support',headline:'Bloodwarden - anti-burst tank, self-heals, ally shields, and Crimson Covenant.'},
    {id:'taoon_plague',unitIdx:1,branch:'b',name:'Taoon Gravebinder',role:'Control Tank',headline:'Gravebinder - Death Grip control, Soul Chains, and magic/curse/poison setup.'},
    {id:'batata_nature',unitIdx:2,branch:'a',name:'Batata Mudroot Warden',role:'Backline Protector',headline:'Mudroot Warden - shelters healers and ranged allies with mud shields and healing support.'},
    {id:'batata_berserker',unitIdx:2,branch:'b',name:'Batata Stonehide Mauler',role:'Swarm Disruptor',headline:'Stonehide Mauler - breaks enemy swarms with mud slows, weakens, and self-shields.'},
    {id:'king_protection',unitIdx:3,branch:'a',name:'King Protection',role:'Hallowed Guardian',headline:'Hallowed Guardian - safest pure tank with shield bounces, oaths, guardian defenses, and Ashen Hallow.'}
  ],
  melee:[
    {id:'felfel_shadow',unitIdx:4,branch:'a',name:'Felfel Shadow',role:'Assassin',headline:'Shadow - restealth, eviscerate, cloak, and killing spree.'},
    {id:'felfel_poison',unitIdx:4,branch:'b',name:'Felfel Poison',role:'Assassin',headline:'Poison - blade flurry, toxic bloom, venom meteor, deathmark.'},
    {id:'jazar_sword',unitIdx:5,branch:'a',name:'Jazar Sword Saint',role:'Blademaster',headline:'Sword Saint - mortal strike, execute, colossus smash, final strike.'},
    {id:'jazar_storm',unitIdx:5,branch:'b',name:'Jazar Storm Binder',role:'Control Melee',headline:'Storm Binder - wind step, blade dance, pulls, and anchor haste.'},
    {id:'king_retribution',unitIdx:3,branch:null,name:'Holy Sword Saint',role:'Melee DPS',headline:'Holy Sword Saint only - 3/5/10 holy blade arts, Judgment Seals, and Divine Ruination.'},
    {id:'monk_dps',unitIdx:13,branch:null,name:'Ronin Dragoon',role:'Melee DPS',headline:'Ronin Dragoon only - 3/5/10 sword rhythm, jump dives, Azure Sen, and Midare Stardiver.'}
  ],
  magic:[
    {id:'alibaba_frost',unitIdx:6,branch:'a',name:'Alibaba Frost',role:'Frost Mage',headline:'Frost - slows, roots normal enemies with Frozen Orb, and controls clusters.'},
    {id:'alibaba_thunder',unitIdx:6,branch:'b',name:'Alibaba Thunder',role:'Thunder Mage',headline:'Thunder - chain lightning, micro-stuns, stormkeeper, thunderstorm.'},
    {id:'jafaar_poison',unitIdx:7,branch:null,name:'Jafaar Poison',role:'Poison Warlock',headline:'Poison - Agony stacks, curse bloom, fel meteor, and Soul Harvest.'},
    {id:'jafaar_destruction',unitIdx:7,branch:'b',name:'Jafaar Destruction',role:'Destruction Warlock',headline:'Destruction - Immolate, Havoc links, and cascading Chaos Bolt.'},
    {id:'shadow_priest',unitIdx:10,branch:'b',name:'Shadow Priest',role:'Magic DPS',headline:'Shadow only - void DoTs, apparitions, tentacles, and Void Torrent.'},
    {id:'moonkin',unitIdx:11,branch:'a',name:'Moonkin',role:'Magic DPS',headline:'Moonkin only - solar push, lunar pull, astral power, and Astral Typhoon.'}
  ],
  pierce:[
    {id:'zaatar_trapper',unitIdx:8,branch:'a',name:'Zaatar Trapper',role:'Hunter',headline:'Trapper - traps, explosive shot, lock and load, black arrow.'},
    {id:'zaatar_beast',unitIdx:8,branch:'b',name:'Zaatar Beast Mastery',role:'Hunter',headline:'Beast Mastery - pet commands, enraged beasts, dire beast, stampede.'},
    {id:'rommana_siege',unitIdx:9,branch:'a',name:'Rommana Siege Engineer',role:'Engineer',headline:'Siege Engineer - artillery turrets, rockets, napalm, dropship.'},
    {id:'rommana_cannon',unitIdx:9,branch:'b',name:'Rommana Flying Cannon',role:'Engineer',headline:'Flying Cannon - escorts, shield generator, rocket punch, overdrive.'}
  ],
  healer:[
    {id:'naana_holy',unitIdx:10,branch:null,name:'Naana Holy',role:'Healer',headline:'Holy - reactive raid healing with Prayer, Renew, Sanctify, and Divine Hymn.'},
    {id:'naana_discipline',unitIdx:10,branch:'a',name:'Naana Discipline',role:'Shield Healer',headline:'Discipline - Penance healing, barriers, and Rapture shields.'},
    {id:'habaq_base',unitIdx:12,branch:null,name:'Habaq Aromancer',role:'Healer',headline:'Aromancer - 3/5/10 Aroma Bolt, Essence Infusion, Blooming Shrine, plus Herbal Tempest.'},
    {id:'bakdounes_base',unitIdx:11,branch:null,name:'Bakdounes Resto',role:'Healer',headline:'Resto only - Lifebloom, 3/5/10 Regrowth-Medica-Benediction, mushrooms, Tree of Life.'},
    {id:'king_holy',unitIdx:3,branch:'b',name:'King Holy',role:'Healer',headline:"Holy only - 3/5/10 tank saves, Holy Shock, Beacon of Virtue, and Divine Toll."}
  ]
};

export const ARENA_ROLE_SPECS={
  tank:[
    {id:'zavs',unitIdx:0,name:'Zavs',role:'Shield Tank',identity:'Shield tank that chooses melee protection or physical/pierce team pressure.',paths:['zavs_guardian','zavs_warlord']},
    {id:'taoon',unitIdx:1,name:'Taoon',role:'Death Knight',identity:'Anti-burst tank with grips, ally safety, and cluster control.',paths:['taoon_blood','taoon_plague']},
    {id:'batata',unitIdx:2,name:'Batata',role:'Mudroot Tank',identity:'Anti-swarm sustain tank that protects healers and ranged units.',paths:['batata_nature','batata_berserker']},
    {id:'king_protection',unitIdx:3,name:'King Protection',role:'Hallowed Guardian',identity:'One-path safe tank built around Avenger shields, guardian oaths, and Ashen Hallow.',paths:['king_protection']}
  ],
  melee:[
    {id:'felfel',unitIdx:4,name:'Felfel',role:'Assassin',identity:'High-risk melee with shadow or poison execution tools.',paths:['felfel_shadow','felfel_poison']},
    {id:'jazar',unitIdx:5,name:'Jazar',role:'Blademaster',identity:'Weapon master that chooses pure sword damage or storm control.',paths:['jazar_sword','jazar_storm']},
    {id:'king_retribution',unitIdx:3,name:'Holy Sword Saint',role:'Melee DPS',identity:'One-path FFT-style holy blade striker with Judgment Seals, guard windows, boss burst, and Divine Ruination.',paths:['king_retribution']},
    {id:'monk_dps',unitIdx:13,name:'Ronin Dragoon',role:'Melee DPS',identity:'One-path Samurai and Dragoon burst skirmisher with Azure Sen, jump dives, and short Third Eye guard windows.',paths:['monk_dps']}
  ],
  magic:[
    {id:'alibaba',unitIdx:6,name:'Alibaba',role:'Mage',identity:'Control caster choosing frost lockdown or thunder disruption.',paths:['alibaba_frost','alibaba_thunder']},
    {id:'jafaar',unitIdx:7,name:'Jafaar',role:'Warlock',identity:'Warlock choosing poison curse buildup or destruction burst.',paths:['jafaar_poison','jafaar_destruction']},
    {id:'shadow_priest',unitIdx:10,name:'Shadow Priest',role:'Magic DPS',identity:'One-path void damage with apparitions and torrent pressure.',paths:['shadow_priest']},
    {id:'moonkin',unitIdx:11,name:'Moonkin',role:'Magic DPS',identity:'One-path astral caster with push, pull, and typhoon control.',paths:['moonkin']}
  ],
  pierce:[
    {id:'zaatar',unitIdx:8,name:'Zaatar',role:'Hunter',identity:'Physical ranged unit choosing traps or beast mastery.',paths:['zaatar_trapper','zaatar_beast']},
    {id:'rommana',unitIdx:9,name:'Rommana',role:'Engineer',identity:'Engineer choosing siege artillery or flying cannon escorts.',paths:['rommana_siege','rommana_cannon']}
  ],
  healer:[
    {id:'naana',unitIdx:10,name:'Naana',role:'Priest Healer',identity:'Tank-saving healer choosing holy recovery or discipline shields.',paths:['naana_holy','naana_discipline']},
    {id:'habaq',unitIdx:12,name:'Habaq',role:'Aromancer',identity:'Sustain healer with aroma statues, 3/5/10 infusion rhythm, and Herbal Tempest.',paths:['habaq_base']},
    {id:'bakdounes',unitIdx:11,name:'Bakdounes',role:'Herbalist',identity:'Resto plant healer with Lifebloom, 3/5/10 recovery, mushrooms, and Tree of Life.',paths:['bakdounes_base']},
    {id:'king_holy',unitIdx:3,name:'King Holy',role:'Holy Healer',identity:'Tank-saving holy support with Word of Glory, Guardian mercy, Beacon, and Divine Toll.',paths:['king_holy']}
  ]
};

export const ARENA_PATH_DETAIL_LINES={
  zavs_guardian:['Stats: +18% HP, +10% armor','Bodyguard: melee/paladin allies -12% damage taken','Citadel Wall: -45% damage, 20% HP shield, emergency heal if low'],
  zavs_warlord:['Stats: +10% HP, +8% damage, 8% faster attacks','Forward Standard: physical/pierce allies +5% damage','Bannerfall: 16% HP shield, -25% damage, physical/pierce banner zone'],
  taoon_blood:['Stats: +18% HP, +12% armor, +15% magic resist, -5% damage','Death Strike: 5th hit heals Taoon and triggers Blood Tithe shields','Crimson Covenant: -35% damage, 20% HP shield, emergency Blood Mend if low'],
  taoon_plague:['Stats: +10% HP, +8% magic resist, +6% damage, 6% faster attacks','Soul Chains: 5th hit slows/interrupts grouped non-boss enemies','Maw of the Grave: 16% HP shield, -25% damage, pull zone setup'],
  batata_nature:['Stats: +22% HP, +10% MR, -5% damage','Backline Garden: healer/ranged allies -10% damage taken','Living Bulwark: 22% HP shield, -30% damage, shelter bonuses'],
  batata_berserker:['Stats: +14% HP, +12% armor, +6% damage, 4% faster attacks','Mirebreaker: Batata -10% damage while swarmed','Quakebreak: 20% HP shield, -25% damage, mud weakens swarms'],
  king_protection:['Stats: +120% HP/armor, +65% MR, -15% damage','Hallowed Leap: jumps toward ranged/caster threats and shields King','Avenger Shield: 6s, 3 targets; L4 hits 5 at 1.65x with 16% shield cap','Ashen Hallow: 20% shield, -30% damage, ally DR inside'],
  king_retribution:['3rd/5th/10th: Stasis Sword, Lightning Stab, Holy Explosion','Passive: Sword Saint Cycle + Judgment Seals','A3/A5: Crush Judgment, Hallowed Bladefall','Signature: Divine Ruination'],
  monk_dps:['3rd/5th/10th: Hakaze Thrust, Gekko Dive, Midare Nastrond','Passive: Azure Sen + Third Eye','A3/A5: Hissatsu Gyoten, Geirskogul Dive','Signature: Midare Stardiver'],
  alibaba_frost:['Stats: -10% damage, 10% faster attacks','Frost hits slow by 35%; Frozen Orb slows 50%','Frozen Orb roots normal enemies for 0.5s per hit'],
  alibaba_thunder:['Stats: +10% damage','Chain Thunder: 0.5s stun to non-boss enemies','Stormkeeper: every 8th hit deals 250% damage'],
  jafaar_poison:['Agony: stacking DoT with Curse Bloom at 3 stacks','Fel Meteor after 5 curse applications','Soul Harvest: 4s rift, 90px radius'],
  jafaar_destruction:['Stats: +20% damage, -10% HP','Havoc mirrors damage to a second enemy','Chaos Bolt cascades 5 -> 3 -> 2 -> 1 bolts'],
  shadow_priest:['Shadow Word Pain stacks to 3','Max stacks: target takes +7% damage','Void Torrent signature channels burst damage'],
  moonkin:['Eclipse shifts Solar/Lunar control','Solar pushes, Lunar pulls and slows','Astral Power: +10% damage per stack, max 3'],
  zaatar_trapper:['Stats: +10% HP','Traps every 10s: fire, frost, root','Lock and Load: trap trigger gives 3 bonus shots'],
  zaatar_beast:['Stats: -10% damage','Kill Command: pet lunges every 6th hit','Bestial Wrath: pets +50% damage, +30% attack speed'],
  rommana_siege:['Artillery turrets: max 3 long-range splash','Munitions Cache: turret damage stacks up to +100%','Napalm Grid: burning zone control'],
  rommana_cannon:['Flying cannon with 2 pearl escorts','Shield Generator protects frontline','Overdrive boosts self and drones, then vents AoE'],
  naana_holy:['Prayer of Mending: 6s cooldown, 5 bounces, 18% max HP heal','Renew: every 3s on two wounded allies; L5 strengthens it','Flash Heal: every 3rd hit heals the lowest wounded ally','Sanctify: every 5th hit heals the lowest allies'],
  naana_discipline:['Penance: 5 bolts every 5th attack plus healing','Power Word Barrier: 12s cooldown absorb','Rapture: team shields for 8s'],
  habaq_base:['Soothing Aroma: healing statues every 5s; L5 raises max to 3','3rd/5th/10th: Aroma Bolt, Essence Infusion, Blooming Shrine','Aromatic Rain, Transcendence, Herbal Tempest empower shrine healing'],
  bakdounes_base:['Lifebloom: attacks stack HoTs and bloom at 3 stacks','3rd/5th/10th: Regrowth, Medica Bloom, Benediction Bloom','Efflorescence mushrooms, Swiftmend, Tranquility, Tree of Life'],
  king_holy:['3rd/5th/10th: Judgment of Light, Word of Glory, Guardian\'s Mercy','Holy Shock, Holy Prism, Barrier of Faith keep tank saves active','Beacon: all heals splash during signature; Divine Toll hits 5 low allies']
};

export const ARENA_SPEC_HALO_COLORS={
  // Batata Ã¢â‚¬â€ Primal Guardian: Base green, Halwa gold, Maqliya moonfire blue
  '2_base':'#6b8e23', '2_a':'#6fbf5a', '2_b':'#b0793a',
  // Zayt Ã¢â‚¬â€ Paladin: Ret gold, Prot silver-blue, Holy white
  '3_base':'#ffd700', '3_a':'#88aaff', '3_b':'#ffffff',
  // Alibaba Ã¢â‚¬â€ Mage: Arcane purple, Frost cyan, Fire red
  '6_base':'#ff6633', '6_a':'#66ccff', '6_b':'#aa88ff',
  // Jafaar Ã¢â‚¬â€ Warlock: curse purple, Demo fel, Destro fire orange
  '7_base':'#9b59b6', '7_a':'#5a3a8a', '7_b':'#ff6633',
  // Zaatar Ã¢â‚¬â€ Hunter: MM gold, Survival brown, BM green
  '8_base':'#ffd700', '8_a':'#aa6633', '8_b':'#3aa84e',
  // Naana Ã¢â‚¬â€ Priest: Holy white, Disc pink, Shadow purple
  '10_base':'#ffffff', '10_a':'#ffaadd', '10_b':'#aa66ff',
  // Bakdounes Ã¢â‚¬â€ Herbalist: Apothecary green, Moonkin indigo, Witch Doctor brown
  '11_base':'#3aa84e', '11_a':'#4466cc', '11_b':'#8a5a2a',
  // Habaq Ã¢â‚¬â€ Aromancer: base sage, Oracle gold, Brewer purple
  '12_base':'#5e8a3a', '12_a':'#d4a842', '12_b':'#7a3a9a',
  // Monk - Ronin Dragoon: azure/crimson burst
  '13_base':'#2f6fc7'
};
