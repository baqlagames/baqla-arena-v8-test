#!/usr/bin/env node

import { emitShieldAbsorbFx } from '../src/systems/shield-vfx-events.js';
import { absorbEarthwardenShield, absorbGoldShield } from '../src/systems/combat-absorbs.js';
import { drawActorShieldVfx, drawUnitShieldVfx } from '../src/render/shield-vfx.js';
import { unitAttackSpeedVfxState as auraHasteState } from '../src/render/actor-vfx.js';

const noop = () => {};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createNoopCanvasContext() {
  return new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return { width: 500, height: 1000 };
      if (prop === 'measureText') return text => ({ width: String(text || '').length * 7 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

const particles = [];
const groundEffects = [];
const texts = [];
const unit = {
  x: 120,
  y: 220,
  size: 24,
  maxHp: 800,
  hp: 700,
  shieldHp: 100,
  _goldShield: { amt: 80, max: 120, timer: 90, maxTimer: 120 },
  _pwBarrier: { hp: 60, max: 100, timer: 200 },
  _raptureShield: { hp: 50, max: 120 },
  _jazarSigHasteTimer: 90,
};

emitShieldAbsorbFx(unit, {
  type: 'gold',
  color: '#ffd700',
  amount: 40,
  broken: true,
  frame: 12,
  emitParticle: (...args) => particles.push(args),
  groundEffects,
  addDamageText: (...args) => texts.push(args),
});

assert(unit._shieldHitFx && unit._shieldHitFx.timer > 0, 'shield hit fx should be marked');
assert(unit._shieldBreakFx && unit._shieldBreakFx.timer > 0, 'shield break fx should be marked');
assert(particles.length >= 1, 'shield hit should emit particles');
assert(groundEffects.length === 0, 'player shield break should not emit a misplaced ground pulse by default');
assert(texts.some(entry => String(entry[2]).includes('BREAK')), 'shield break should emit break text');

const ctx = createNoopCanvasContext();
drawUnitShieldVfx(ctx, { unit, x: unit.x, y: unit.y, size: unit.size, frame: 24 });
assert(unit._shieldHitFx.timer < unit._shieldHitFx.maxTimer, 'draw should tick hit fx');
assert(unit._shieldBreakFx.timer < unit._shieldBreakFx.maxTimer, 'draw should tick break fx');

const enemy = {
  x: 180,
  y: 260,
  size: 28,
  maxHp: 900,
  _enemyShield: 120,
  _shieldHitFx: { timer: 4, maxTimer: 12, color: '#44aaff', type: 'enemy' },
};
drawActorShieldVfx(ctx, { unit: enemy, x: enemy.x, y: enemy.y, size: enemy.size, frame: 30 });
assert(enemy._shieldHitFx.timer === 3, 'enemy shield hit fx should tick once');
assert(auraHasteState(unit).active, 'haste aura state should detect jazar haste');

const goldShieldTarget = { x: 120, y: 120, size: 16, hp: 100, maxHp: 100, _goldShield: { amt: 20, max: 30, timer: 100, maxTimer: 120 } };
const goldResult = absorbGoldShield(goldShieldTarget, 25, {
  frame: 42,
  emitParticle: (...args) => particles.push(args),
  addDamageText: (...args) => texts.push(args),
  groundEffects,
});
assert(goldResult.dmg === 5 && goldResult.blocked === false, 'gold shield should absorb then pass leftover damage');
assert(goldShieldTarget._goldShield === null, 'gold shield should clear when broken');
assert(goldShieldTarget._shieldBreakFx && goldShieldTarget._shieldBreakFx.type === 'gold', 'gold shield break fx should be marked by absorb path');

const earthTarget = { x: 160, y: 120, size: 16, hp: 100, maxHp: 100, earthwardenShield: 14, earthwardenTimer: 90 };
const earthResult = absorbEarthwardenShield(earthTarget, 14, {
  frame: 43,
  emitParticle: (...args) => particles.push(args),
  addDamageText: (...args) => texts.push(args),
  groundEffects,
});
assert(earthResult.dmg === 0 && earthResult.blocked === true, 'earthwarden shield should fully block exact shield hit');
assert(earthTarget.earthwardenShield === 0, 'earthwarden shield should drop to zero when broken');
assert(earthTarget._shieldBreakFx && earthTarget._shieldBreakFx.type === 'earthwarden', 'earthwarden shield break fx should be marked by absorb path');

console.log('smoke-shield-vfx: ok');
