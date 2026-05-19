// balance and economy tuning.
// Extracted from the v8 runtime without behavior changes.

export const HP_MULT_PLAYER=1.10;

export const HP_MULT_ENEMY=1.10;

export const MINION_NERF=0.70;

export const UNIT_VISUAL_SCALE=1.20;

export const ARENA_L=24,ARENA_R=476,ARENA_TOP_BASE=42;

export const RESPAWN_FRAMES=1800;

export const GRID_COLS=6;

export const GRID_ROWS=3;

export const GRID_BOT_PAD=70;

export const GRID_X=ARENA_L+10;

export const GRID_W=(ARENA_R-ARENA_L-20);

export const CELL_W=GRID_W/GRID_COLS;

export const ARENA_MAX_UNIT_LEVEL=5;

export const ARENA_GOLD_COSTS=[ // gold price by unit id 0-13 + Vodka (id:99 -> idx 14)
  50, 50, 50,        // Malfof, Taoon, Batata
  40, 45, 40,        // Zayt, Felfel, Jazar
  50, 60, 45, 65,    // Alibaba, Foul, Sabbar, Rumman
  50, 55, 55,        // Naana, Bakdounes, Zaatar
  45,                // Monk DPS
  150                // Vodka (Champion's Aura affects entire field)
];

export const ARENA_UPGRADE_COSTS=[0, 45, 125, 190, 275];

export const ARENA_UPGRADE_MULT_BY_UNIT={
  // Tanks. Utility duty, multiple placed per squad.
  0:1.00, 1:1.04, 2:1.03,                // Malfof, Taoon, Batata
  // Vanilla DPS: one passive + one branch fork, no class kit.
  5:1.12,                                // Jazar (Blademaster)
  // Sniper / focused DPS: more on-hit gear or unique kit.
  8:1.14,                                // Zaatar (Sniper)
  // Healers: aura-driven support.
  10:1.12, 11:1.12,                      // Naana, Bakdounes
  // CC priest: heavier toolkit (mind control, shields).
  12:1.12,                               // Habaq
  // Class-kit DPS: paladin with multi-passive stacking.
  3:1.20,                                // Zayt - Justice's Reach + Divine Storm + Wings
  // Specialists: unique mechanic (stealth opener, fire minions).
  4:1.24, 6:1.22,                        // Felfel, Filfil Har
  // Engineer / warlock: permanent summons or burst toolkit.
  7:1.32, 9:1.30,                        // Jafaar (3 minions), Rumman (bombs + nuke)
  // Hero: global champion aura, hero-class.
  13:1.12,                               // Monk DPS - one-path melee specialist
  99:1.70                                // Vodka
};

export const ARENA_UPGRADE_MULT_BY_BRANCH={
  // ===== TANKS =====
  '0_a':1.12,   // Zavs Citadel - melee-protection tank + Citadel Wall sig
  '0_b':1.16,   // Zavs Vanguard - physical/pierce enabler + Bannerfall Crash sig
  '1_a':1.18,   // Taoon Bloodwarden - ally shields, Death Strike, Crimson Covenant
  '1_b':1.22,   // Taoon Gravebinder - Death Grip control, Soul Chains, Maw of the Grave
  '2_a':1.13,   // Batata Mudroot Warden - healer/ranged shelter + Living Bulwark sig
  '2_b':1.17,   // Batata Stonehide Mauler - anti-swarm mud disruption + Quakebreak sig
  // ===== MELEE DPS =====
  '3_a':1.22,   // Zayt Muqaddas (Protection) - tank conversion + Ashen Hallow sig
  '3_b':1.24,   // Zayt Mubarak (Holy) - healer conversion + Beacon of Virtue sig
  '4_a':1.34,   // Felfel Shadow - restealth, burst openers, Killing Spree
  '4_b':1.36,   // Felfel Samm (Poison Assassin) - Blade Flurry + Sepsis + Deathmark sig
  '5_a':1.16,   // Jazar Romi (Sword Saint) - mortal strike + execute + Final Strike sig
  '5_b':1.20,   // Jazar Azraq (Storm Binder) - wind step + blade dance + Storm Anchor sig
  // ===== RANGED / CASTER =====
  '6_a':1.20,   // Alibaba Barid (Frost) - frostbolt + shatter + Frozen Orb sig
  '6_b':1.24,   // Alibaba Barqi (Storm) - overload + stormkeeper + Thunderstorm sig
  '7_a':1.38,   // Jafaar Akhdar (Demonology) - Demonic Empowerment + Soul Link + Summon Infernal sig
  '7_b':1.42,   // Jafaar Mudammas (Destruction) - Immolate + Havoc + Chaos Bolt sig
  '8_a':1.20,   // Zaatar Bary (Trapper) - Explosive Trap + Lock and Load + Black Arrow sig
  '8_b':1.24,   // Zaatar Akhdar (Beast Mastery) - Kill Command + Bestial Wrath + Stampede sig
  '9_a':1.36,   // Rumman Siege - artillery turrets, rockets, napalm
  '9_b':1.42,   // Rumman Murr (Flying Cannon) - cannon form + rocket punch + Overdrive sig + Self-Destruct on death
  // ===== HEALERS / SUPPORT =====
  '10_a':1.18,  // Naana Hamra (Discipline) - penance + barrier + Rapture sig
  '10_b':1.36,  // Naana Bayda (Shadow) - Void DPS: SW:P DoTs + Shadow Apparitions + Void Torrent sig
  '11_a':1.34,  // Bakdounes Qamari (Moonkin) - eclipse DPS + Celestial Alignment sig
  '11_b':1.24,  // Bakdounes Mujaffaf (Witch Doctor) - totem healer + Ancestral Awakening sig
  '12_a':1.14,  // Habaq Dhahabi (Essence Oracle) - bond healing + Elixir of Life sig
  '12_b':1.34,  // Habaq Barri (Toxin Brewer) - poison DPS + Pandemic sig
  // ===== HERO =====
  '99_a':1.70,  // Vodka Warbringer - 2.0x dmg + whirlwind + Champion's Wrath sig
  '99_b':1.75   // Vodka Guardian - champion aura + battle standard + Last Stand sig
};

export const ARENA_ARMOR_MATRIX={
  physical:{unarmored:1.0, heavy:0.6, warded:1.0, boss:0.85},
  pierce:  {unarmored:1.4, heavy:0.7, warded:1.0, boss:0.85},
  magic:   {unarmored:1.0, heavy:1.4, warded:0.65, boss:0.85}
};

export const ARENA_DEFENSE_MATRIX={
  physical:{plate:0.65, mail:0.85, leather:1.0,  cloth:1.15},
  pierce:  {plate:0.90, mail:1.0,  leather:0.75, cloth:1.10},
  magic:   {plate:1.20, mail:1.0,  leather:0.85, cloth:0.70}
};

export const ARENA_PLAYER_ARMOR_TYPE={
  0:'plate', 1:'mail', 2:'mail',    // Zavs=plate, Taoon=mail, Batata=mail
  3:'mail',                          // Zayt base=mail (Prot branch overrides to plate)
  4:'leather', 5:'leather',          // Felfel=leather, Jazar=leather
  6:'cloth',                         // Alibaba=cloth
  7:'cloth',                         // Jafaar=cloth
  8:'mail',                          // Zaatar=mail (hunter)
  9:'mail',                          // Rumman=mail (engineer)
  10:'cloth', 11:'cloth', 12:'cloth',// healers=cloth
  13:'leather',                       // Monk DPS
  99:'leather'                       // Vodka=leather
};

export const ARENA_PLAYER_ARMOR_BRANCH_OVERRIDE={
  '3_a':'plate'                      // Prot Paladin Ã¢â€ â€™ plate
};

export const ARENA_ATTACK_TYPE_BY_UNIT={
  0:'physical', 1:'physical', 2:'physical', // tanks
  3:'physical',                             // Zayt (melee paladin; bolt overrides to magic)
  4:'physical', 5:'physical',               // Felfel (dagger), Jazar (charge/lance)
  6:'magic',                                // Alibaba Ã¢â‚¬â€ fire bolt
  7:'magic',                                // Jafaar Ã¢â‚¬â€ curse projectile
  8:'pierce',                               // Zaatar Ã¢â‚¬â€ arrow (sniper)
  9:'pierce',                               // Rumman Ã¢â‚¬â€ bomb fragments
  10:'magic',                               // Naana Ã¢â‚¬â€ smite
  11:'magic',                               // Bakdounes Ã¢â‚¬â€ potion bolts
  12:'magic',                               // Habaq - aromatic essence
  13:'physical',                            // Monk DPS
  99:'physical'                             // Vodka - hero melee
};

export const ARENA_SELL_RATIO=0.80;

export const ARENA_BASE_INCOME=12;

export const ARENA_INCOME_PER_STAGE=3;

export const ARENA_INTEREST_RATE=0.05;

export const ARENA_INTEREST_CAP=20;

export const ARENA_KILL_BOUNTY_MULT=0.18;

export const ARENA_CAMPAIGN_KILL_BOUNTY_MULT=0.20;

export const ARENA_BUILD_FIRST=30;

export const ARENA_BUILD_NEXT=45;

export const ARENA_BUILD_BOSS=45;

export const ARENA_ROUNDS_PER_STAGE=6;

export const ARENA_LEASH_FWD=400;

export const ARENA_LEASH_BACK=250;

export const ARENA_LEASH_SIDE=240;

export const ARENA_UNIT_SIZE_SCALE=0.65;
