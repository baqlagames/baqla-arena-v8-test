#!/usr/bin/env node

import { GAME_TICK_HZ } from '../src/core/constants.js';
import { tickUnitAlibabaPassives } from '../src/systems/unit-alibaba-ticks.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const unit = {
  x: 250,
  y: 620,
  size: 20,
  hp: 100,
  maxHp: 100,
  dmg: 80,
  _thunderstorm: {
    timer: Math.round(2.5 * GAME_TICK_HZ),
    maxTimer: Math.round(2.5 * GAME_TICK_HZ),
    tickCD: 0,
    tickEvery: 15,
    dmg: 50,
    radius: 380,
    maxTargets: 4,
    stun: Math.round(0.5 * GAME_TICK_HZ),
  },
};
const enemies = [
  { x: 210, y: 360, size: 16, hp: 300, stunned: 0, isEnemy: true },
  { x: 260, y: 335, size: 16, hp: 300, stunned: 0, isEnemy: true },
  { x: 310, y: 390, size: 18, hp: 300, stunned: 0, isEnemy: true },
  { x: 260, y: 320, size: 30, hp: 1000, stunned: 0, isEnemy: true, isBoss: true },
];
const groundEffects = [];
const particles = [];
let damageHits = 0;
let shakeValue = 0;

tickUnitAlibabaPassives(unit, {
  frame: 120,
  enemies,
  arenaBounds: { left: 40, right: 460, top: 110, bottom: 820 },
  groundEffects,
  randomRange: (min, max) => (min + max) / 2,
  dealDamage: (target, amount, source, type, attackTypeOverride) => {
    damageHits++;
    assert(source === unit, 'thunderstorm damage should credit Alibaba');
    assert(type === 'magic', 'thunderstorm damage should be magic');
    assert(attackTypeOverride === 'lightning', 'thunderstorm damage should carry lightning override');
    target.hp -= amount;
    return amount;
  },
  findBestEnemyClusterPoint: () => null,
  emitParticle: (...args) => particles.push(args),
  addDamageText: () => {},
  shake: value => { shakeValue = Math.max(shakeValue, value); },
});

assert(damageHits >= 4, 'thunderstorm should hit most nearby enemies on a pulse');
assert(enemies[0].stunned >= Math.round(0.5 * GAME_TICK_HZ), 'non-boss target should receive 0.5s stun');
assert(enemies[3].stunned === 0, 'boss target should not be stunned');
assert(groundEffects.some(effect => effect.lightningBolt && effect.width >= 5 && effect.y < effect.lbY2 - 180), 'thunderstorm should emit visible sky-to-ground lightning');
assert(groundEffects.filter(effect => effect.lightningBolt).length >= 4, 'thunderstorm should emit multiple lightning bolts');
assert(particles.length > 0, 'thunderstorm should emit impact particles');
assert(shakeValue >= 4, 'thunderstorm pulse should shake on hit');

console.log('Alibaba Thunderstorm smoke passed with sky lightning VFX and stun.');
