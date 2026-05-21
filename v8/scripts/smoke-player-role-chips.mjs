#!/usr/bin/env node

import assert from 'node:assert/strict';

const noop = () => {};

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.width = 0;
    this.height = 0;
    this.onload = null;
  }

  set src(value) {
    this._src = value;
  }

  get src() {
    return this._src || '';
  }
}

function createRecordingCanvasContext(textCalls) {
  const gradient = { addColorStop: noop };
  const methods = new Map([
    ['createLinearGradient', () => gradient],
    ['createRadialGradient', () => gradient],
    ['measureText', text => ({ width: String(text || '').length * 7 })],
    ['fillText', (text, x, y) => { textCalls.push({ text: String(text), x, y }); }],
  ]);

  return new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (methods.has(prop)) return methods.get(prop);
      if (prop === 'canvas') return { width: 500, height: 1000 };
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

globalThis.Image = FakeImage;

const { createActorRenderer } = await import('../src/render/actor-renderer.js');

const textCalls = [];
const ctx = createRecordingCanvasContext(textCalls);
const units = [];
const groundFx = [];
const viewState = {
  width: 500,
  frame: 180,
  state: 'battle',
  arena: { phase: 'wave' },
  arenaTop: 42,
  units,
  groundFx,
};

const renderer = createActorRenderer({
  ctx,
  view: () => viewState,
  randomRange: (min, max) => min + (max - min) * 0.5,
  emitParticle: noop,
  addHealEffect: noop,
  applyHealingReceived: (_, amount) => amount,
  applyTrackedHeal: (_, amount) => amount,
  drawSpecAccessory: noop,
  drawWithClashCamera: (_x, _y, fn) => fn(),
  overlayOffsetFor: () => 0,
});

function makeUnit(arch, id, extra = {}) {
  return {
    id,
    unitIdx: id,
    name: arch,
    isPlayer: true,
    arch,
    x: 140 + id * 34,
    y: 640 + id * 6,
    size: arch === 'tank' ? 28 : 22,
    hp: 1000,
    maxHp: 1000,
    color: '#88ccff',
    accent: '#ffd166',
    bobPhase: 0,
    debuffs: {},
    abilCD: {},
    level: 3,
    cellLevel: 3,
    ...extra,
  };
}

const roleUnits = [
  makeUnit('tank', 0, { taunt: true }),
  makeUnit('melee', 1, { prefersMelee: true }),
  makeUnit('healer', 2),
  makeUnit('ranged', 3, { prefersRanged: true }),
  makeUnit('caster', 4),
];

for (const unit of roleUnits) renderer.drawUnitRaw(unit);

for (const label of ['TANK', 'MELEE', 'HEAL', 'RANGE', 'CAST']) {
  assert(textCalls.some(call => call.text === label), `player role chip should render ${label}`);
}

const tankChip = textCalls.find(call => call.text === 'TANK');
const meleeChip = textCalls.find(call => call.text === 'MELEE');
assert(Math.abs(tankChip.x - meleeChip.x) >= 30, 'clustered tank/melee role chips should separate horizontally');

const beforeMinions = textCalls.filter(call => ['TANK', 'MELEE', 'HEAL', 'RANGE', 'CAST'].includes(call.text)).length;
renderer.drawUnitRaw(makeUnit('melee', 5, { isMinion: true }));
renderer.drawUnitRaw(makeUnit('ranged', 6, { isGhost: true }));
renderer.drawUnitRaw(makeUnit('caster', 7, { isMirror: true }));
const afterMinions = textCalls.filter(call => ['TANK', 'MELEE', 'HEAL', 'RANGE', 'CAST'].includes(call.text)).length;
assert.equal(afterMinions, beforeMinions, 'role chips should not render for minions, ghosts, or mirrors');

console.log('smoke-player-role-chips: ok');
