#!/usr/bin/env node

import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { PLAYER_UNITS } from '../src/data/units.js';
import {
  ENEMY_WAVE_MECHANIC_VFX,
  drawEnemyVfxOver,
  drawEnemyVfxUnder,
  drawPlayerAuraOver,
  drawPlayerAuraUnder,
  enemyReadabilityCues,
  playerSignatureReadiness,
} from '../src/render/actor-vfx.js';

function makeCtx() {
  const calls = [];
  const target = {
    calls,
    globalAlpha: 1,
    fillStyle: '#fff',
    strokeStyle: '#fff',
    lineWidth: 1,
    font: '10px Arial',
    textAlign: 'left',
    lineDashOffset: 0,
    save() { calls.push('save'); },
    restore() { calls.push('restore'); },
    beginPath() { calls.push('beginPath'); },
    closePath() { calls.push('closePath'); },
    fill() { calls.push('fill'); },
    stroke() { calls.push('stroke'); },
    arc() { calls.push('arc'); },
    ellipse() { calls.push('ellipse'); },
    moveTo() { calls.push('moveTo'); },
    lineTo() { calls.push('lineTo'); },
    quadraticCurveTo() { calls.push('quadraticCurveTo'); },
    bezierCurveTo() { calls.push('bezierCurveTo'); },
    fillRect() { calls.push('fillRect'); },
    strokeRect() { calls.push('strokeRect'); },
    roundRect() { calls.push('roundRect'); },
    fillText() { calls.push('fillText'); },
    setLineDash() { calls.push('setLineDash'); },
    translate() { calls.push('translate'); },
    rotate() { calls.push('rotate'); },
    scale() { calls.push('scale'); },
  };
  return target;
}

function enemy(id, extra = {}) {
  const template = ENEMIES[id];
  assert(template, `missing enemy ${id}`);
  return {
    ...template,
    ...extra,
    hp: extra.hp || template.hp || 100,
    maxHp: extra.maxHp || template.hp || 100,
    x: 240,
    y: 360,
    size: template.size || 24,
    bobPhase: 0,
    cd: 0,
    isEnemy: true,
  };
}

function boss(id, extra = {}) {
  const template = BOSSES[id];
  assert(template, `missing boss ${id}`);
  return {
    ...template,
    ...extra,
    hp: extra.hp || template.hp || 1000,
    maxHp: extra.maxHp || template.hp || 1000,
    x: 240,
    y: 220,
    size: template.size || 50,
    bobPhase: 0,
    cd: 0,
    isEnemy: true,
    isBoss: true,
  };
}

function player(id, extra = {}) {
  const template = PLAYER_UNITS[id];
  assert(template, `missing player ${id}`);
  return {
    ...template,
    ...extra,
    hp: extra.hp || template.hp || 1000,
    maxHp: extra.maxHp || template.hp || 1000,
    x: 240,
    y: 620,
    size: template.size || 24,
    bobPhase: 0,
    isPlayer: true,
  };
}

function cueKeys(actor) {
  return enemyReadabilityCues(actor).map(cue => cue.key);
}

assert.deepEqual(
  Object.keys(ENEMY_WAVE_MECHANIC_VFX).sort(),
  ['banner', 'exploding', 'medic', 'ritual', 'shield', 'sniper'].sort(),
  'mechanic VFX table should cover every wave mechanic'
);

const traitCases = [
  [enemy(33), 'heavy'],
  [enemy(38), 'warded'],
  [enemy(43), 'flying'],
  [enemy(48), 'burrow'],
  [enemy(26), 'backline'],
  [enemy(30, { fromRift: true }), 'rift'],
  [boss(4), 'boss'],
];
for (const [actor, expected] of traitCases) {
  assert(cueKeys(actor).includes(expected), `${actor.name}: missing cue ${expected}`);
}

for (const mechanic of Object.keys(ENEMY_WAVE_MECHANIC_VFX)) {
  const actor = enemy(30, { waveMechanic: mechanic, _enemyShield: mechanic === 'shield' ? 50 : 0 });
  const cues = enemyReadabilityCues(actor);
  assert(cues.some(cue => cue.type === 'mechanic' && cue.key === mechanic), `missing mechanic cue ${mechanic}`);
}

const ctx = makeCtx();
const renderEnemies = [
  enemy(33, { waveMechanic: 'shield', _enemyShield: 100 }),
  enemy(38, { waveMechanic: 'ritual', chainBoltCD: 300 }),
  enemy(43, { waveMechanic: 'sniper' }),
  enemy(48, { waveMechanic: 'exploding', burrowing: true }),
  enemy(26, { waveMechanic: 'banner', stealthHits: 0 }),
  enemy(4, { waveMechanic: 'medic' }),
  boss(4, { hp: BOSSES[4].hp * 0.30, _phaseFlashTimer: 30 }),
];

for (const actor of renderEnemies) {
  drawEnemyVfxUnder(ctx, { enemy: actor, x: actor.x, y: actor.y, size: actor.size, frame: 120 });
  drawEnemyVfxOver(ctx, {
    enemy: actor,
    x: actor.x,
    y: actor.y,
    size: actor.size,
    frame: 120,
    emitParticle: () => {},
    randomRange: (min, max) => (min + max) / 2,
  });
}

const chargingUnit = player(10, {
  arch: 'healer',
  signature: { t: 75, cd: 100 },
});
const readyUnit = player(8, {
  arch: 'ranged',
  range: 180,
  signature: { t: 100, cd: 100 },
  signatureCastFx: 12,
});
assert.equal(playerSignatureReadiness(player(0)).active, false, 'no signature should not be active');
assert.equal(playerSignatureReadiness(chargingUnit).active, true, '75% signature should show readiness cue');
assert.equal(playerSignatureReadiness(readyUnit).ready, true, 'full signature should be ready');

for (const unit of [
  player(0, { arch: 'tank', taunt: true }),
  chargingUnit,
  readyUnit,
  player(4, { arch: 'melee', stealth: true, stealthHits: 0 }),
]) {
  drawPlayerAuraUnder(ctx, { unit, x: unit.x, y: unit.y, size: unit.size, frame: 120 });
  drawPlayerAuraOver(ctx, {
    unit,
    x: unit.x,
    y: unit.y,
    size: unit.size,
    frame: 120,
    emitParticle: () => {},
    randomRange: (min, max) => (min + max) / 2,
  });
}

assert(ctx.calls.length > 200, `expected VFX drawing calls, saw ${ctx.calls.length}`);
console.log(`VFX readability smoke passed: ${renderEnemies.length} enemy cues and 4 player aura cases rendered.`);
