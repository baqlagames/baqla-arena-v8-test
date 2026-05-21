#!/usr/bin/env node

import assert from 'node:assert/strict';
import { arenaEngagementBands, moveActorToward } from '../src/systems/combat-targeting.js';
import { updateArenaEnemyAi } from '../src/systems/combat-enemy-ai.js';

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
}

console.log('Enemy castle fallback smoke passed: melee enemies advance and damage the king after the squad is wiped.');
