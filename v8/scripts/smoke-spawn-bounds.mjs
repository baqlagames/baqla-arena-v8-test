import { spawnBossById } from '../src/systems/boss-spawn.js';
import { spawnEnemyByIndex } from '../src/systems/enemy-spawn.js';
import { createRiftRuntime } from '../src/systems/rift-runtime.js';
import { ENEMIES } from '../src/data/enemies.js';
import { STAGE_DMG_MULT, STAGE_HP_MULT } from '../src/data/stages.js';

const area = {
  arenaTop: 100,
  arenaBottom: 760,
  spawnLeft: 64,
  spawnRight: 436,
  width: 500,
};

function assertInside(actor, label) {
  if (!actor) throw new Error(`${label}: missing actor`);
  if (actor.x < area.spawnLeft || actor.x > area.spawnRight || actor.y < area.arenaTop || actor.y > area.arenaBottom) {
    throw new Error(`${label}: outside arena at ${actor.x},${actor.y}`);
  }
}

{
  const enemies = [];
  const enemy = spawnEnemyByIndex({
    typeIdx: 0,
    state: 'battle',
    arenaState: { phase: 'wave', round: 1 },
    stageTime: 0,
    currentStageIdx: 0,
    currentStage: { n: 1 },
    waveIdx: 1,
    frame: 1,
    arenaTop: area.arenaTop,
    arenaBottom: area.arenaBottom,
    spawnY: area.arenaBottom + 999,
    spawnLeft: area.spawnLeft,
    spawnRight: area.spawnRight,
    enemies,
    randomFloat: () => 1,
    lateRoundEnemyMult: () => ({ hp: 1, dmg: 1 }),
    lateStageRoleHpMult: () => 1,
    lateStageNormalDurabilityMult: () => 1,
    lateStageNormalDamageMult: () => 1,
    isCampaignBossRound: () => false,
  });
  assertInside(enemy, 'normal enemy');
}

for (const bossId of [11, 12, 13]) {
  const enemies = [];
  const boss = spawnBossById({
    bossId,
    state: 'battle',
    arenaState: { phase: 'wave' },
    frame: 1,
    width: area.width,
    arenaTop: area.arenaTop,
    arenaBottom: area.arenaBottom,
    spawnY: area.arenaBottom + 999,
    spawnLeft: area.spawnLeft,
    spawnRight: area.spawnRight,
    enemies,
    randomFloat: () => 1,
  });
  assertInside(boss, `boss ${bossId}`);
  for (const actor of enemies) assertInside(actor, `boss ${bossId} spawned actor ${actor.name || actor.id}`);
  if (boss && boss.aerialAnchor) assertInside(boss.aerialAnchor, `boss ${bossId} aerial anchor`);
}

{
  const arena = {};
  const rolls = [0.01, 0.75];
  const riftRuntime = createRiftRuntime({
    view: () => ({
      arena,
      currentStage: { act: 1, n: 6 },
    }),
    randomRange: () => rolls.shift() ?? 0,
  });
  riftRuntime.rollStageRift();
  if (arena.scheduledRiftRound !== 5) throw new Error(`rift scheduling picked ${arena.scheduledRiftRound}, expected round 5`);
}

{
  const arena = {};
  const riftRuntime = createRiftRuntime({
    view: () => ({
      arena,
      currentStage: { act: 1, n: 5 },
    }),
    randomRange: () => 0,
  });
  riftRuntime.rollStageRift();
  if (arena.scheduledRiftRound != null) throw new Error('rift scheduled before minimum stage');
}

{
  const arena = {};
  const enemies = [{ hp: 1 }];
  const riftRuntime = createRiftRuntime({
    view: () => ({
      arena,
      width: area.width,
      arenaTop: area.arenaTop,
      arenaBottom: area.arenaBottom,
      deployTop: 430,
      arenaLeft: area.spawnLeft,
      arenaRight: area.spawnRight,
      currentStage: { act: 1, n: 6 },
      currentStageIdx: 0,
      enemies,
      enemiesData: ENEMIES,
      units: [],
      groundFx: [],
      stageHpMult: STAGE_HP_MULT,
      stageDmgMult: STAGE_DMG_MULT,
      hpMultEnemy: 1,
      unitSizeScale: 1,
    }),
    randomRange: (_min, max) => max + 999,
  });
  riftRuntime.triggerRift();
  assertInside(arena.rift, 'rift telegraph');
  riftRuntime.spawnRiftMinions();
  for (const actor of enemies.filter(e => e.fromRift)) assertInside(actor, `rift actor ${actor.name || actor.id}`);
}

console.log('Spawn bounds smoke passed for enemies, bosses, lieutenants, barriers, aerial anchors, and rift minions.');
