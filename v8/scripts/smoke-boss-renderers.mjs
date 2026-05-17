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
  { BOSSES },
  { createActorRenderer },
] = await Promise.all([
  import('../src/data/bosses.js'),
  import('../src/render/actor-renderer.js'),
]);

const ctx = createNoopCanvasContext();
const particles = [];
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

function makeBoss(template) {
  const maxHp = template.hp || template.maxHp || 10000;
  return {
    ...template,
    id: template.id,
    name: template.name,
    x: 250,
    y: 310,
    size: template.size || 52,
    maxHp,
    hp: maxHp,
    isEnemy: true,
    isBoss: true,
    isElite: false,
    bobPhase: 0.25,
    debuffs: {},
    color: template.color || '#aa4444',
    accent: template.accent || '#ffd166',
  };
}

const rendered = [];
for (const bossTemplate of BOSSES) {
  const boss = makeBoss(bossTemplate);
  try {
    renderer.drawDummyRaw(boss);
    viewState.frame += 7;
    renderer.drawDummy(boss);
    rendered.push(`${boss.id}: ${boss.name}`);
  } catch (error) {
    throw new Error(`${boss.name} boss render smoke failed: ${error.message}`, { cause: error });
  }
}

console.log(`Smoke-rendered ${rendered.length} boss bodies through actor renderer.`);
for (const row of rendered) console.log(`- ${row}`);
