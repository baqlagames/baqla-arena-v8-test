// wave and threat display data.
// Extracted from the v8 runtime without behavior changes.

export const ARENA_WAVE_THEMES=['SWARM_RUSH','TANK_WALL','RANGED_KITE','MIXED_PUSH',
                      'AOE_BARRAGE','BACKLINE_STRIKE','CASTER_COVEN','ELITE_PAIR',
                      'HEAVY_WALL','WARDED_COVEN','AERIAL_RAID','BURROW_AMBUSH'];

export const ARENA_WAVE_MECHANIC_LABELS={
  shield:'Shield Carrier',
  banner:'Banner Bearer',
  medic:'Medic Bug',
  ritual:'Ritual Caster',
  exploding:'Exploding Swarm',
  sniper:'Sniper Windup'
};

export const ARENA_THREAT_TAG_COLOR={
  HEAVY:'#ff5a4a',     WARDED:'#5ac8ec',    UNARMORED:'#9aa3b2',
  FLYING:'#7dd3fc',    BURROW:'#c08a4a',    BACKLINE:'#c084fc',
  STEALTH:'#a78bfa',
  SWARM:'#fbbf24',     CASTER:'#e879f9',    TANK:'#fb923c',
  DPS:'#fb7185',       AOE:'#f97316',       RANGED:'#60a5fa',
  ASSASSIN:'#f43f5e',
  PHYSICAL:'#d1d5db',  PIERCE:'#fbbf24',    MAGIC:'#c084fc',
  BOSS:'#ff4d4d',      BARRIER:'#a855f7',   AERIAL:'#fbbf24',
  ELITE:'#ff8c00',
};
