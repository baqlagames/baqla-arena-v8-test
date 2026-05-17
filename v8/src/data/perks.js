export const ARENA_PERKS = [
  {
    id: 'openingLedger',
    name: 'Opening Ledger',
    tag: 'Economy',
    unlockStage: 1,
    cost: 0,
    color: '#ffd166',
    desc: '+25 starting gold each stage.',
    effects: { startingGold: 25 },
  },
  {
    id: 'ironSeed',
    name: 'Iron Seed',
    tag: 'Tank',
    unlockStage: 2,
    cost: 30,
    color: '#6ee7b7',
    desc: 'Tank units gain +8% max HP.',
    effects: { tankHpMult: 0.08 },
  },
  {
    id: 'sharpSprout',
    name: 'Sharp Sprout',
    tag: 'Damage',
    unlockStage: 3,
    cost: 45,
    color: '#f87171',
    desc: 'Melee and ranged damage units gain +5% attack damage.',
    effects: { dpsDamageMult: 0.05 },
  },
  {
    id: 'calmBloom',
    name: 'Calm Bloom',
    tag: 'Healer',
    unlockStage: 4,
    cost: 55,
    color: '#86efac',
    desc: 'Healing from healer units is +8% stronger.',
    effects: { healerOutputMult: 0.08 },
  },
  {
    id: 'beanMagnet',
    name: 'Bean Magnet',
    tag: 'Meta',
    unlockStage: 6,
    cost: 75,
    color: '#a78bfa',
    desc: '+15% Beans from stage victories.',
    effects: { beansBonusPct: 0.15 },
  },
];

export const DEFAULT_UNLOCKED_PERKS = ['openingLedger'];

export function perkById(id) {
  return ARENA_PERKS.find(perk => perk.id === id) || null;
}

export function perkSlotCount(maxStage) {
  return maxStage >= 6 ? 2 : 1;
}
