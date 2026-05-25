import assert from 'node:assert/strict';
import { BOSSES } from '../src/data/bosses.js';
import { updateArenaEnemyAi } from '../src/systems/combat-enemy-ai.js';
import { moveActorToward } from '../src/systems/combat-targeting.js';

const arenaTop = 88;
const arenaBottom = 820;
const bounds = {
  arenaLeft: 40,
  arenaRight: 460,
  arenaTop,
  arenaBot: arenaBottom,
  leashForward: 170,
  leashBack: 125,
  leashSide: 120,
};

const boss = {
  ...BOSSES[0],
  x: 250,
  y: 590,
  maxHp: BOSSES[0].hp,
  hp: BOSSES[0].hp,
  isEnemy: true,
  isBoss: true,
  cd: 0,
  bobPhase: 0,
  mechCD: {},
  debuffs: {},
  _meleeBypassReady: true,
  _meleeBypassHits: 5,
};

const tank = {
  name: 'Stage 3 Tank',
  x: 250,
  y: 660,
  size: 24,
  maxHp: 1600,
  hp: 1600,
  isPlayer: true,
  arch: 'tank',
  taunt: true,
};

const melee = {
  name: 'Nearby Melee',
  x: 296,
  y: 618,
  size: 22,
  maxHp: 900,
  hp: 900,
  isPlayer: true,
  arch: 'melee',
};

const units = [tank, melee];
let hits = 0;
const startY = boss.y;

function tick(frame) {
  updateArenaEnemyAi(boss, {
    frame,
    width: 500,
    height: 900,
    arenaLeft: bounds.arenaLeft,
    arenaRight: bounds.arenaRight,
    arenaTop,
    arenaBottom,
    arenaPhase: { phase: 'wave' },
    units,
    enemies: [boss],
    towers: [],
    playerCastle: null,
    groundEffects: [],
    beamFx: [],
    randomRange: (min, max) => (min + max) / 2,
    moveToward: (actor, x, y, speed) => moveActorToward(actor, x, y, speed, bounds),
    updateEnemyMechanics: () => {},
    enemyAttackCooldown: () => 18,
    applySearingBrandOnBasic: () => {},
    applyRoyalStingOnBasic: () => {},
    dealDamage: (target, amount) => {
      target.hp -= amount;
      hits++;
    },
    fireProjectile: (_from, target, amount) => {
      target.hp -= amount;
      hits++;
    },
    emitParticle: () => {},
    addDamageText: () => {},
    showFlash: () => {},
    shake: () => {},
    sound: {},
  });
}

tick(1);
assert.equal(boss.target, tank, 'Stage 3 boss should keep the taunt tank as target even when melee bypass is primed');
assert.equal(boss._v8TargetClass, 'bossTankHold', 'Boss targeting should use strict tank hold while a tank is alive');
assert(boss.y > startY, `Stage 3 boss should walk down toward tank contact, moved from ${startY} to ${boss.y}`);

for (let frame = 2; frame <= 420; frame++) tick(frame);

assert(hits > 0, 'Stage 3 boss should eventually hit the tank after closing');
assert(tank.hp < tank.maxHp, 'Stage 3 boss damage should land on the tank');
assert.equal(melee.hp, melee.maxHp, 'Stage 3 boss should not peel sideways into nearby melee while tank is alive');

console.log('Stage 3 boss tank engage smoke passed');
