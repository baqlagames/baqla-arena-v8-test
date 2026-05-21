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

function createRecordingCanvasContext(textCalls, roundRects) {
  const gradient = { addColorStop: noop };
  const methods = new Map([
    ['createLinearGradient', () => gradient],
    ['createRadialGradient', () => gradient],
    ['measureText', text => ({ width: String(text || '').length * 7 })],
    ['fillText', (text, x, y) => { textCalls.push({ text: String(text), x, y }); }],
    ['roundRect', (x, y, w, h, r) => { roundRects.push({ x, y, w, h, r }); }],
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
const roundRects = [];
const ctx = createRecordingCanvasContext(textCalls, roundRects);
const units = [
  makeUnit('tank', 0, { taunt: true, x: 230, y: 660 }),
  makeUnit('melee', 1, { prefersMelee: true, x: 236, y: 664 }),
];
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

for (const unit of units) renderer.drawUnitRaw(unit);

const roleLabels = ['TANK', 'MELEE', 'HEAL', 'RANGE', 'CAST'];
for (const label of roleLabels) {
  assert(!textCalls.some(call => call.text === label), `player HUD should not render ${label} role text`);
}

const tankTrack = roundRects.find(rect => Math.abs(rect.w - 52) < 0.1 && Math.abs(rect.h - 9) < 0.1);
const meleeTrack = roundRects.find(rect => Math.abs(rect.w - 36) < 0.1 && Math.abs(rect.h - 7) < 0.1);
assert(tankTrack, 'tank player HP bar should use the wider/taller tank track');
assert(meleeTrack, 'melee player HP bar should keep the compact player track');

const tankCenter = tankTrack.x + tankTrack.w / 2;
const meleeCenter = meleeTrack.x + meleeTrack.w / 2;
assert(Math.abs(tankCenter - meleeCenter) >= 30, 'clustered tank/melee HP bars should separate horizontally');

renderer.drawUnitRaw(makeUnit('melee', 5, { isMinion: true }));
renderer.drawUnitRaw(makeUnit('ranged', 6, { isGhost: true }));
renderer.drawUnitRaw(makeUnit('caster', 7, { isMirror: true }));
for (const label of roleLabels) {
  assert(!textCalls.some(call => call.text === label), `minions/ghosts/mirrors should not render ${label} role text`);
}

console.log('smoke-player-role-chips: player HUD labels removed and clustered HP bars separate');
