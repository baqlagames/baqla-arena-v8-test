export const BOSS_CODEX_ENTRIES = [
  {
    bossId: 1,
    stage: 5,
    title: 'Hornet Sovereign',
    subtitle: 'Shield break, adds, sting',
    color: '#c08820',
    tags: ['BOSS SHIELD', 'POISON', 'ARMOR'],
    mechanics: [
      ['Royal Carapace', 'At 70% and 35% HP, break the shield before Hive Burst.'],
      ['Hive Support', 'Adds and hornet aura make the frontline collapse if ignored.'],
      ['Royal Sting', 'Repeated hits apply sting pressure and poison damage.'],
    ],
  },
  {
    bossId: 10,
    stage: 8,
    title: 'Astral Lantern Warden',
    subtitle: 'Starfall, eclipse, gravity',
    color: '#3f6fff',
    tags: ['CASTER', 'BURST', 'BACKLINE THREAT'],
    mechanics: [
      ['Starfall Lanterns', 'Falling lantern strikes target wounded and backline allies.'],
      ['Eclipse Beam', 'A line warning shows where the astral beam will fire.'],
      ['Gravity Toll', 'Phase 2 pulse pulls the team inward and pressures ranged units.'],
    ],
  },
  {
    bossId: 4,
    stage: 10,
    title: 'Sultan of Embers',
    subtitle: 'Command, cleave, burn',
    color: '#dc6020',
    tags: ['BURST', 'CASTER', 'POISON'],
    mechanics: [
      ['Inferno Pulse', 'Wide fire pulses reward spacing and healing cadence.'],
      ['Meteor', 'Danger rings mark where burst damage will land.'],
      ['Cinder Pact', 'Imp support and Sons of Embers punish slow boss damage.'],
    ],
  },
  {
    bossId: 6,
    stage: 15,
    title: 'Pharaoh Ka',
    subtitle: 'Curse, summon, ritual',
    color: '#d4a857',
    tags: ['CASTER', 'BURST', 'ARMOR'],
    mechanics: [
      ['Mummy Summons', 'Recurring mummies force cleave or quick target swaps.'],
      ['Death Mark', 'Late-phase curse burst can finish wounded units.'],
      ['Resurrection', 'Plan for one extra push after the first kill.'],
    ],
  },
];

export function bossCodexEntryForId(bossId) {
  return BOSS_CODEX_ENTRIES.find(entry => entry.bossId === bossId) || null;
}
