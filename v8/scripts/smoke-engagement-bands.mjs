import {
  arenaEngagementBands,
  clampActorToLeash,
  effectiveArenaAttackRange,
  isReachableFromLeash,
  limitBurstLanding,
  moveActorToward,
  playerForwardLimitY,
} from '../src/systems/combat-targeting.js';
import { prepareUnitAttackTarget } from '../src/systems/unit-attack-targeting.js';
import { updateArenaEnemyAi } from '../src/systems/combat-enemy-ai.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bounds = {
  arenaLeft: 24,
  arenaRight: 476,
  arenaTop: 100,
  arenaBot: 820,
  leashForward: 400,
  leashBack: 250,
  leashSide: 240,
  playerCastle: { x: 250, y: 790, hp: 1000 },
  enemyCastle: { x: 250, y: 150, hp: 1000 },
};
const bands = arenaEngagementBands(bounds);

function moveMany(actor, tx, ty, ticks = 400) {
  for (let i = 0; i < ticks; i++) moveActorToward(actor, tx, ty, actor.speed || 0.35, bounds);
}

{
  const melee = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 2.4, range: 44, size: 24, isPlayer: true, arch: 'melee' };
  moveMany(melee, 250, 120);
  const leashFront = melee.homeY - bounds.leashForward;
  assert(melee.y < bands.playerMeleeY - 20, `melee should be allowed beyond the middle band (${melee.y} >= ${bands.playerMeleeY})`);
  assert(melee.y >= leashFront - 0.01, `melee crossed forward leash (${melee.y} < ${leashFront})`);
  assert(Math.abs(melee.y - leashFront) < 8, `melee did not settle near forward leash (${melee.y})`);
}

{
  const ranged = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 2.4, range: 190, size: 22, isPlayer: true, arch: 'ranged', prefersRanged: true };
  moveMany(ranged, 250, 120);
  const leashFront = ranged.homeY - bounds.leashForward;
  assert(ranged.y < bands.playerRangedY - 20, `ranged unit should not hit an invisible firing-band wall (${ranged.y} >= ${bands.playerRangedY})`);
  assert(ranged.y >= leashFront - 0.01, `ranged unit crossed forward leash (${ranged.y} < ${leashFront})`);
  assert(effectiveArenaAttackRange(ranged, { inArena: true }) === 175, 'player ranged basic attacks should be capped in the arena');
}

{
  const enemy = { x: 250, y: 180, range: 198, size: 24, isEnemy: true, arch: 'ranged' };
  assert(effectiveArenaAttackRange(enemy, { arenaPhase: true }) === 165, 'enemy ranged basic attacks should be capped in the arena');
}

{
  const diver = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 2.4, range: 44, size: 24, isPlayer: true, arch: 'melee', shadowStep: { range: 150 } };
  diver.y = 120;
  clampActorToLeash(diver, bounds);
  assert(diver.y >= playerForwardLimitY(diver, bounds) - 0.01, `teleport clamp left diver beyond limit (${diver.y})`);
  assert(diver.y < bands.playerMeleeY, 'teleport clamp should still allow landings beyond the middle band');
}

{
  const melee = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 0.3, range: 44, size: 24, isPlayer: true, arch: 'melee' };
  const reachable = { x: 250, y: bands.playerMeleeY - 90, hp: 100, size: 24 };
  const tooDeep = { x: 250, y: bounds.arenaTop + 30, hp: 100, size: 24 };
  assert(isReachableFromLeash(melee, reachable, bounds), 'enemy beyond the middle should be reachable inside the leash');
  assert(!isReachableFromLeash(melee, tooDeep, bounds), 'spawn enemy should not pull melee beyond leash');
}

{
  const unit = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 2.4, range: 44, size: 24, isPlayer: true, arch: 'melee' };
  const result = prepareUnitAttackTarget(unit, {
    arena: { phase: 'wave' },
    enemies: [{ x: 250, y: 145, hp: 100, size: 24 }],
    frame: 1,
    arenaTop: bounds.arenaTop,
    arenaBottom: bounds.arenaBot,
    randomRange: () => 0,
    findRangedEnemyForUnit: () => null,
    findEnemyForUnit: () => null,
    followFamiliarAnchor: () => {},
    isReachable: () => false,
    moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, bounds),
    clampToArena: () => {},
    clampToLeash: actor => clampActorToLeash(actor, bounds),
    beamFx: [],
    groundEffects: [],
    emitParticle: () => {},
    addDamageText: () => {},
    sound: { buff: () => {} },
    shake: () => {},
  });
  assert(!result.canAttack, 'unit should not attack without a reachable target');
  assert(unit.y >= bands.playerMeleeY - 0.01, `no-target melee staging crossed middle band (${unit.y})`);
}

{
  const unit = { x: 250, y: 720, homeX: 250, homeY: 720, speed: 2.4, range: 44, size: 24, isPlayer: true, arch: 'melee', shadowStep: { range: 999, landOffset: 0 }, stealth: true, stealthHits: 0, firstHitDone: false };
  const effects = [];
  const result = prepareUnitAttackTarget(unit, {
    arena: { phase: 'wave' },
    enemies: [{ x: 250, y: 145, hp: 100, size: 24 }],
    frame: 1,
    arenaTop: bounds.arenaTop,
    arenaBottom: bounds.arenaBot,
    randomRange: () => 0,
    findRangedEnemyForUnit: () => null,
    findEnemyForUnit: () => ({ x: 250, y: 145, hp: 100, size: 24 }),
    followFamiliarAnchor: () => {},
    isReachable: () => true,
    moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, bounds),
    clampToArena: actor => clampActorToLeash(actor, bounds),
    clampToLeash: actor => clampActorToLeash(actor, bounds),
    beamFx: [],
    groundEffects: effects,
    emitParticle: () => {},
    addDamageText: () => {},
    sound: { buff: () => {} },
    shake: () => {},
  });
  assert(!result.canAttack, 'shadow step setup should spend this tick repositioning');
  assert(unit.y > bands.playerMeleeY, 'long shadow step should be capped instead of snapping past the middle');
  assert(Math.hypot(unit.x - 250, unit.y - 720) <= 115.01, 'long shadow step should respect visual jump cap');
  assert(unit.y >= unit.homeY - bounds.leashForward + 12 - 0.01, `shadow step landed in spawn/leash-unsafe area (${unit.y})`);
}

{
  const unit = { x: 250, y: 520, homeX: 250, homeY: 720, size: 24, isPlayer: true };
  const far = limitBurstLanding(unit, 250, 190, 140);
  assert(far.limited, 'far burst landing should be limited');
  assert(Math.hypot(far.x - unit.x, far.y - unit.y) <= 140.01, 'burst landing should not exceed max visual jump');
  const near = limitBurstLanding(unit, 250, 405, 140);
  assert(!near.limited && near.y === 405, 'near burst landing should stay exact');
}

{
  const enemy = {
    x: 250,
    y: 180,
    hp: 500,
    maxHp: 500,
    dmg: 20,
    speed: 0.4,
    atkSpd: 60,
    range: 34,
    size: 24,
    isEnemy: true,
    burrow: true,
    burrowTimer: 40,
    cd: 0,
  };
  for (let i = 0; i < 80; i++) {
    updateArenaEnemyAi(enemy, {
      frame: i,
      width: 500,
      height: 900,
      arenaLeft: bounds.arenaLeft,
      arenaRight: bounds.arenaRight,
      arenaTop: bounds.arenaTop,
      arenaBottom: bounds.arenaBot,
      arenaPhase: true,
      units: [],
      enemies: [enemy],
      towers: [],
      playerCastle: bounds.playerCastle,
      groundEffects: [],
      beamFx: [],
      randomRange: (min, max) => (min + max) / 2,
      moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, bounds),
      updateEnemyMechanics: () => {},
      enemyAttackCooldown: () => 60,
      applySearingBrandOnBasic: () => {},
      applyRoyalStingOnBasic: () => {},
      dealDamage: () => 0,
      fireProjectile: () => {},
      emitParticle: () => {},
      addDamageText: () => {},
      showFlash: () => {},
      shake: () => {},
      sound: {},
    });
  }
  assert(enemy.y <= bands.enemyDiveY + 8, `burrow enemy dove past resized arena fight band (${enemy.y} > ${bands.enemyDiveY})`);
}

{
  const enemy = { x: 250, y: 180, hp: 500, maxHp: 500, dmg: 20, speed: 0.4, atkSpd: 60, range: 34, size: 24, isEnemy: true, isElite: true, eliteChargeT: 1, cd: 0 };
  const unit = { x: 250, y: 760, hp: 1000, maxHp: 1000, size: 24, isPlayer: true, arch: 'ranged' };
  updateArenaEnemyAi(enemy, {
    frame: 1,
    width: 500,
    height: 900,
    arenaLeft: bounds.arenaLeft,
    arenaRight: bounds.arenaRight,
    arenaTop: bounds.arenaTop,
    arenaBottom: bounds.arenaBot,
    arenaPhase: true,
    units: [unit],
    enemies: [enemy],
    towers: [],
    playerCastle: bounds.playerCastle,
    groundEffects: [],
    beamFx: [],
    randomRange: (min, max) => (min + max) / 2,
    moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, bounds),
    updateEnemyMechanics: () => {},
    enemyAttackCooldown: () => 60,
    applySearingBrandOnBasic: () => {},
    applyRoyalStingOnBasic: () => {},
    dealDamage: () => 0,
    fireProjectile: () => {},
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
    shake: () => {},
    sound: {},
  });
  assert(enemy.y <= bands.enemyDiveY + 0.01, `elite charge crossed enemy dive band (${enemy.y} > ${bands.enemyDiveY})`);
}

console.log('Engagement band smoke passed for middle staging, free forward chase, burst clamps, and enemy dive bounds.');
