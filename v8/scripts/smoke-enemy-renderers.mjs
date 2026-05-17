#!/usr/bin/env node

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

function createNoopCanvasContext() {
  const gradient = { addColorStop: noop };
  const methods = new Map([
    ['createLinearGradient', () => gradient],
    ['createRadialGradient', () => gradient],
    ['measureText', text => ({ width: String(text || '').length * 7 })],
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

const [
  { ENEMIES },
  { createActorRenderer },
] = await Promise.all([
  import('../src/data/enemies.js'),
  import('../src/render/actor-renderer.js'),
]);

const ctx = createNoopCanvasContext();
const particles = [];
const units = [];
const groundFx = [];
const viewState = {
  width: 500,
  frame: 90,
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
  emitParticle(x, y, color, count = 1, size = 1) {
    particles.push({ x, y, color, count, size });
  },
  addHealEffect: noop,
  applyHealingReceived: (_, amount) => amount,
  applyTrackedHeal: (_, amount) => amount,
  drawSpecAccessory: noop,
  drawWithClashCamera: (x, y, fn) => fn(),
  overlayOffsetFor: () => 0,
});

function makeEnemy(template, enemyArt, index) {
  const maxHp = template.hp || template.maxHp || 100;
  return {
    ...template,
    enemyArt,
    x: 250 + (index % 3 - 1) * 12,
    y: 310 + (index % 5 - 2) * 8,
    size: template.size || 26,
    maxHp,
    hp: maxHp,
    isEnemy: true,
    isBoss: false,
    isElite: index % 11 === 0,
    bobPhase: 0.25 + index * 0.07,
    debuffs: {},
    color: template.color || '#884444',
    accent: template.accent || '#ffd166',
  };
}

const rendered = [];
const artModes = [
  ['gerban', undefined],
  ['classic', 'classic'],
];

for (const [label, enemyArt] of artModes) {
  for (const enemyTemplate of ENEMIES) {
    const enemy = makeEnemy(enemyTemplate, enemyArt, rendered.length);
    try {
      renderer.drawDummyRaw(enemy);
      viewState.frame += 5;
      renderer.drawDummy(enemy);
      rendered.push(`${label} ${enemy.id}: ${enemy.name}`);
    } catch (error) {
      throw new Error(`${enemy.name} ${label} enemy render smoke failed: ${error.message}`, { cause: error });
    }
  }
}

console.log(`Smoke-rendered ${rendered.length} normal enemy bodies through actor renderer.`);
console.log(`Covered ${ENEMIES.length} enemy templates across ${artModes.length} art branches.`);
