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
    tags: ['CASTER', 'BURST', 'BACKLINE THREAT', 'BOSS SHIELD'],
    mechanics: [
      ['Starfall Lanterns', 'Falling lantern strikes target wounded and backline allies.'],
      ['Eclipse Beam', 'A line warning shows where the astral beam will fire.'],
      ['Gravity Toll', 'Phase 2 pulse pulls the team inward and brands tank/melee healing.'],
      ['Lantern Ward', 'Phase shields break into a short Astral Blight on the team.'],
    ],
  },
  {
    bossId: 13,
    stage: 10,
    title: 'Winterglass Magistrate',
    subtitle: 'Crystals, whiteout, frostburn',
    color: '#9fdcff',
    tags: ['FROST', 'CASTER', 'BURST', 'BACKLINE THREAT', 'BOSS SHIELD'],
    mechanics: [
      ['Winterglass Crystals', 'Break Frostglass Prism and Mirrorice Bulwark to drop the boss barrier.'],
      ['Whiteout Pulse', 'Boss-only windows send visible ice lances into the whole team.'],
      ['Frostburn', 'Breaking both crystals exposes the Magistrate but leaves a short team DoT.'],
    ],
  },
  {
    bossId: 4,
    stage: 10,
    title: 'Winterglass Dragon',
    subtitle: 'Scales, broodguard, sky storm',
    color: '#9fdcff',
    tags: ['FROST', 'BURST', 'BACKLINE THREAT', 'SOFT CONTROL', 'MIXED DAMAGE', 'FLYERS'],
    mechanics: [
      ['Frozen Scales', 'Rime and Glass Scales alternate physical and magic resistance.'],
      ['Ice Comets', 'Four visible comet targets test team healing.'],
      ['Frigid Maw', 'A frost cone and moving ice wall punish stacked frontline units.'],
      ['Diamond Storm', 'The dragon flies while ranged units keep firing and melee clears the Broodguard pack.'],
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
