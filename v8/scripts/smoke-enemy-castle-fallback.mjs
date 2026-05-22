#!/usr/bin/env node

import assert from 'node:assert/strict';
import { arenaEngagementBands, moveActorToward } from '../src/systems/combat-targeting.js';
import { updateArenaEnemyAi } from '../src/systems/combat-enemy-ai.js';
import { createBattleObjectiveRuntime } from '../src/systems/battle-objective-runtime.js';
import { createStagePlayerCastle, PLAYER_CASTLE_ATTACK_RANGE } from '../src/systems/stage-lifecycle.js';
import { calculateWaveRewards } from '../src/systems/wave-lifecycle.js';

const bounds = {
  arenaLeft: 24,
  arenaRight: 476,
  arenaTop: 100,
  arenaBot: 820,
  leashForward: 400,
  leashBack: 250,
  leashSide: 240,
  enemyCastle: null,
};
const bands = arenaEngagementBands(bounds);

{
  const { playerCastle: castle } = createStagePlayerCastle({
    stage: { n: 1 },
    stageIndex: 0,
    width: 500,
    arenaBottom: bounds.arenaBot,
  });
  assert.equal(castle.range, PLAYER_CASTLE_ATTACK_RANGE, 'king range should use the tuned last-line defense value');

  const projectiles = [];
  let enemies = [{
    x: castle.x,
    y: castle.y - PLAYER_CASTLE_ATTACK_RANGE - 18,
    hp: 100,
    maxHp: 100,
    isEnemy: true,
    size: 24,
  }];
  const objective = createBattleObjectiveRuntime({
    view: () => ({ enemies, projectiles }),
    distance: (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)),
    randomRange: (min, max) => (min + max) / 2,
  });

  objective.updateCastle(castle);
  assert.equal(projectiles.length, 0, 'king should not fire at enemies outside the shortened range');

  enemies = [{
    x: castle.x,
    y: castle.y - PLAYER_CASTLE_ATTACK_RANGE + 8,
    hp: 100,
    maxHp: 100,
    isEnemy: true,
    size: 24,
  }];
  objective.updateCastle(castle);
  assert.equal(projectiles.length, 1, 'king should still fire when enemies reach last-line range');

  const reward = calculateWaveRewards({
    arena: { round: 1, king: castle, _waveStartKingHp: castle.hp },
    gold: 0,
    stageN: 1,
    stageIncome: () => 20,
    roundGoldMult: () => 1,
    roundBonusCap: 20,
  });
  assert.equal(reward.perfectWave, true, 'king firing should not break perfect wave while king HP is unchanged');
}

function tickEnemy(enemy, castle, units, frame) {
  updateArenaEnemyAi(enemy, {
    frame,
    width: 500,
    height: 900,
    arenaLeft: bounds.arenaLeft,
    arenaRight: bounds.arenaRight,
    arenaTop: bounds.arenaTop,
    arenaBottom: bounds.arenaBot,
    arenaPhase: true,
    units,
    enemies: [enemy],
    towers: [],
    playerCastle: castle,
    groundEffects: [],
    beamFx: [],
    randomRange: (min, max) => (min + max) / 2,
    moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, { ...bounds, playerCastle: castle }),
    updateEnemyMechanics: () => {},
    enemyAttackCooldown: () => 20,
    applySearingBrandOnBasic: () => {},
    applyRoyalStingOnBasic: () => {},
    dealDamage: (target, raw) => {
      target.hp -= Math.round(raw);
    },
    fireProjectile: () => {},
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
    shake: () => {},
    sound: { meteor: () => {} },
  });
}

{
  const castle = {
    x: 250,
    y: 790,
    hp: 600,
    maxHp: 600,
    isPlayer: true,
    isKing: true,
    size: 30,
    name: 'King',
  };
  const enemy = {
    x: 250,
    y: bands.enemyDiveY,
    hp: 300,
    maxHp: 300,
    dmg: 50,
    speed: 12,
    atkSpd: 20,
    range: 34,
    size: 24,
    isEnemy: true,
    arch: 'melee',
    cd: 0,
    bobPhase: 0,
  };
  const deadUnits = [
    { x: 250, y: 650, hp: 0, maxHp: 500, isPlayer: true, arch: 'tank', size: 24 },
    { x: 300, y: 670, hp: 0, maxHp: 300, isPlayer: true, arch: 'healer', size: 20 },
  ];

  for (let frame = 0; frame < 90; frame++) tickEnemy(enemy, castle, deadUnits, frame);

  assert.equal(enemy.target, castle, 'enemy should keep the king castle as its fallback target');
  assert(enemy.y > bands.enemyDiveY + 150, `enemy stayed at the middle fight band instead of advancing (${enemy.y})`);
  assert(castle.hp < castle.maxHp, `enemy reached no castle damage (${castle.hp}/${castle.maxHp})`);
  assert(castle._underAttackTimer > 0, 'castle damage should mark the breach warning timer');
  assert(castle._castleHitFx > 0, 'castle damage should mark the hit impact VFX timer');
}

{
  const castle = {
    x: 250,
    y: 790,
    hp: 900,
    maxHp: 900,
    isPlayer: true,
    isKing: true,
    size: 30,
    name: 'King',
  };
  const liveUnits = [
    { x: 250, y: 650, hp: 500, maxHp: 500, isPlayer: true, arch: 'tank', taunt: true, size: 24 },
    { x: 300, y: 680, hp: 350, maxHp: 350, isPlayer: true, arch: 'healer', size: 20 },
  ];
  const vizier = {
    id: 13,
    name: 'Winterglass Magistrate',
    stormVizier: true,
    x: 250,
    y: 280,
    hp: 26000,
    maxHp: 26000,
    dmg: 120,
    speed: 12,
    atkSpd: 20,
    range: 96,
    size: 50,
    isEnemy: true,
    isBoss: true,
    arch: 'caster',
    cd: 0,
    bobPhase: 0,
  };
  const startX = vizier.x;
  const startY = vizier.y;
  for (let frame = 0; frame < 60; frame++) tickEnemy(vizier, castle, liveUnits, frame);
  assert(Math.hypot(vizier.x - startX, vizier.y - startY) < 0.1, `Winterglass Magistrate should hold its boss arena position while a tank lives (${vizier.x},${vizier.y})`);
  assert.equal(castle.hp, castle.maxHp, 'stationary Vizier should not drift down to damage the castle while a tank lives');

  liveUnits[0].hp = 0;
  for (let frame = 60; frame < 95; frame++) tickEnemy(vizier, castle, liveUnits, frame);
  assert(vizier.target === liveUnits[1], 'Winterglass Magistrate should chase surviving backline once the tank dies');
  assert(vizier.y > startY + 60, `released Winterglass Magistrate should move toward backline after tank death (${vizier.y})`);

  vizier.x = startX;
  vizier.y = startY;
  vizier._stormHoldX = startX;
  vizier._stormHoldY = startY;
  for (const unit of liveUnits) unit.hp = 0;
  for (let frame = 60; frame < 150; frame++) tickEnemy(vizier, castle, liveUnits, frame);
  assert(vizier.target === castle, 'Winterglass Magistrate should switch to the castle after all real player units die');
  assert(vizier.y > startY + 130, `released Winterglass Magistrate should march toward the castle after wipe (${vizier.y})`);
}

console.log('Enemy castle fallback smoke passed: melee enemies advance and damage the king after the squad is wiped.');
