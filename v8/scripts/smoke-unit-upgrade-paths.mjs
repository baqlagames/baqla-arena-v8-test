#!/usr/bin/env node

const noop = () => {};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

function lerpColor(a, b, t) {
  const pa = a && a[0] === '#' ? a : '#000000';
  const pb = b && b[0] === '#' ? b : '#ffffff';
  const ar = parseInt(pa.slice(1, 3), 16);
  const ag = parseInt(pa.slice(3, 5), 16);
  const ab = parseInt(pa.slice(5, 7), 16);
  const br = parseInt(pb.slice(1, 3), 16);
  const bg = parseInt(pb.slice(3, 5), 16);
  const bb = parseInt(pb.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + bl.toString(16).padStart(2, '0');
}

function statsAt(unitData, level) {
  const out = { ...unitData };
  for (let i = 0; i < Math.min(level - 1, 4); i++) {
    const upgrade = unitData.up[i];
    for (const key in upgrade) out[key] = upgrade[key];
  }
  if (out.range) {
    const rangedLike = out.arch === 'ranged' || out.arch === 'caster' || out.arch === 'healer' || out.prefersRanged || out.projType;
    const meleeLike = out.arch === 'tank' || out.arch === 'melee' || (!rangedLike && out.range <= 80);
    if (rangedLike || meleeLike) out.range = Math.round(out.range + 12);
  }
  out.level = level;
  out.hasL3 = level >= 3;
  out.hasL5 = level >= ARENA_MAX_UNIT_LEVEL;
  return out;
}

function makeSignatureMap(ids) {
  const signatures = {};
  for (const id of ids) {
    if (!id) continue;
    signatures[id] = {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      cd: 30,
      fire: noop,
    };
  }
  return signatures;
}

function createMinion(parent, kind, offset) {
  const level = parent.level || 1;
  const base = {
    x: parent.x + offset,
    y: parent.y + 10,
    maxHp: 220 + level * 30,
    hp: 220 + level * 30,
    dmg: 10 + level,
    speed: 0.3,
    atkSpd: 72,
    range: 40,
    size: 16,
    armor: 1,
    magicRes: 1,
    isPlayer: true,
    isMinion: true,
    parent,
    kind,
    cd: 0,
    color: '#6a8a3a',
    accent: '#2f5a1e',
    facing: 1,
    bobPhase: 0.5,
    arch: 'melee',
  };
  if (kind === 'imp' || kind === 'flameSprite' || kind === 'fireElemental' || kind === 'waterElemental' || kind === 'stormElemental') {
    base.arch = 'ranged';
    base.range = 150;
    base.projType = kind === 'waterElemental' ? 'ice' : kind === 'stormElemental' ? 'lightning' : 'fire';
  }
  if (kind === 'felhound') {
    base.color = '#5a3a8a';
    base.accent = '#2a1a4a';
    base.magicRes = 3;
  }
  if (kind === 'foul' || kind === 'foulTank' || kind === 'foulRanged') {
    base.color = '#7b8a3a';
    base.accent = '#4f5d22';
    if (kind === 'foulTank') base.arch = 'tank';
    if (kind === 'foulRanged') {
      base.arch = 'ranged';
      base.range = 140;
      base.projType = 'curse';
    }
  }
  return base;
}

globalThis.Image = FakeImage;

const [
  { PLAYER_UNITS, VODKA },
  { ARENA_UNIT_BRANCHES, ARENA_BASE_SIGNATURES, ARENA_BRANCH_SIGNATURES },
  { ARENA_ROLE_ROOTS, ARENA_ROLE_PATHS },
  tuning,
  { applyUnitPassives },
  { createSquadUnitFromCell },
  { spawnSquadAttachedMinions },
  { upgradeSquadCell },
  { arena_stageStartGold },
  { arena_upgradeCostFor },
  { createActorRenderer },
  { createSpecAccessoryRenderer },
] = await Promise.all([
  import('../src/data/units.js'),
  import('../src/data/passives.js'),
  import('../src/data/roles.js'),
  import('../src/data/tuning.js'),
  import('../src/systems/unit-passives.js'),
  import('../src/systems/squad-lifecycle.js'),
  import('../src/systems/squad-lifecycle.js'),
  import('../src/systems/squad-actions.js'),
  import('../src/systems/stage-economy.js'),
  import('../src/systems/squad-economy.js'),
  import('../src/render/actor-renderer.js'),
  import('../src/render/spec-accessories.js'),
]);

const {
  ARENA_GOLD_COSTS,
  ARENA_MAX_UNIT_LEVEL,
  ARENA_UNIT_SIZE_SCALE,
  ARENA_UPGRADE_COSTS,
  ARENA_UPGRADE_MULT_BY_BRANCH,
  ARENA_UPGRADE_MULT_BY_UNIT,
} = tuning;
const signatureIds = [
  ...Object.values(ARENA_BASE_SIGNATURES),
  ...Object.values(ARENA_BRANCH_SIGNATURES),
];
const signatures = makeSignatureMap(signatureIds);
const ctx = createNoopCanvasContext();
const particles = [];
const groundFx = [];
const units = [];
const viewState = {
  width: 500,
  frame: 120,
  state: 'battle',
  arena: { phase: 'build' },
  arenaTop: 120,
  units,
  groundFx,
};
const specAccessoryRenderer = createSpecAccessoryRenderer({
  ctx,
  view: () => viewState,
  emitParticle: (x, y, color, n = 1, sz = 2) => particles.push({ x, y, color, n, sz }),
  randomRange: (min, max) => min + (max - min) * 0.5,
});
const actorRenderer = createActorRenderer({
  ctx,
  view: () => viewState,
  emitParticle: (x, y, color, n = 1, sz = 2) => particles.push({ x, y, color, n, sz }),
  addHealEffect: noop,
  applyHealingReceived: (_unit, amount) => amount,
  applyTrackedHeal: noop,
  drawSpecAccessory: unit => specAccessoryRenderer.drawSpecAccessory(unit),
  drawWithClashCamera: (_x, _y, draw) => draw(),
  overlayOffsetFor: () => ({ x: 0, y: 0 }),
  randomRange: (min, max) => min + (max - min) * 0.5,
});

function unitGoldCost(unitIdx) {
  return unitIdx === 99 ? ARENA_GOLD_COSTS[14] : ARENA_GOLD_COSTS[unitIdx];
}

function assertUpgradeEconomyTuning() {
  assert(JSON.stringify(ARENA_UPGRADE_COSTS) === JSON.stringify([0, 45, 125, 190, 275]), 'upgrade tier costs drifted from rebalance');
  assert(ARENA_UPGRADE_COSTS[1] >= 45, 'L2 base upgrade is still too cheap');
  for (let level = 2; level < ARENA_UPGRADE_COSTS.length; level++) {
    assert(ARENA_UPGRADE_COSTS[level] > ARENA_UPGRADE_COSTS[level - 1], 'upgrade tiers must increase each level');
  }

  const cheapestRoot = Math.min(...Object.values(ARENA_ROLE_ROOTS).map(root => root.cost));
  const cheapestTwoRoots = cheapestRoot * 2;
  let minNormalL2 = Infinity;
  for (let unitIdx = 0; unitIdx < PLAYER_UNITS.length; unitIdx++) {
    const l2Cost = arena_upgradeCostFor({ unitIdx, level: 1, branch: null });
    minNormalL2 = Math.min(minNormalL2, l2Cost);
    assert(l2Cost >= 45, `unit ${unitIdx} L2 cost ${l2Cost} below 45g floor`);
    assert(l2Cost >= cheapestRoot, `unit ${unitIdx} L2 cost ${l2Cost} below cheapest root placement ${cheapestRoot}`);

    const totalToL5 = unitGoldCost(unitIdx) + [1, 2, 3, 4].reduce((sum, level) => {
      return sum + arena_upgradeCostFor({ unitIdx, level, branch: null });
    }, 0);
    const oldMult = unitIdx === 7 || unitIdx === 9 ? 1.25
      : unitIdx === 4 || unitIdx === 6 ? 1.20
      : unitIdx === 3 ? 1.15
      : unitIdx === 5 || unitIdx === 13 ? 1.05
      : (unitIdx === 8 || unitIdx === 10 || unitIdx === 11 || unitIdx === 12 ? 1.10 : 1.00);
    const oldTotalToL5 = unitGoldCost(unitIdx) + [28, 100, 150, 220].reduce((sum, cost) => sum + Math.round(cost * oldMult), 0);
    assert(totalToL5 > oldTotalToL5, `unit ${unitIdx} L5 total did not increase`);
  }

  assert(arena_stageStartGold(1) < cheapestTwoRoots + minNormalL2, 'stage 1 can still buy two cheap roots plus immediate L2');
  assert(arena_stageStartGold(5) >= cheapestTwoRoots + minNormalL2, 'stage 5 cannot afford a mixed two-root plus L2 opener');
  assert(ARENA_UPGRADE_MULT_BY_BRANCH['4_a'] >= 1.30, 'Felfel Shadow branch needs explicit high-output multiplier');
  assert(ARENA_UPGRADE_MULT_BY_BRANCH['9_a'] >= 1.30, 'Rumman Siege branch needs explicit high-output multiplier');
  assert(ARENA_UPGRADE_MULT_BY_UNIT[99] === 1.70, 'Vodka base multiplier should match hero rebalance');
  assert(ARENA_UPGRADE_MULT_BY_BRANCH['99_b'] === 1.75, 'Vodka Guardian multiplier should match hero rebalance');
  return { cheapestRoot, minNormalL2 };
}

function applyPassives(unit, unitIdx, level) {
  applyUnitPassives(unit, unitIdx, level, {
    gameTickHz: 120,
    signatures,
  });
}

function statsForCell(cell) {
  return statsAt(cell.unitIdx === 99 ? VODKA : PLAYER_UNITS[cell.unitIdx], cell.level || 1);
}

function createUnitFromCell(cell, key = '0') {
  return createSquadUnitFromCell({
    key,
    cell,
    stats: statsForCell(cell),
    x: 180,
    y: 500,
    frame: viewState.frame,
    tickHz: 120,
    lerpColor,
    applyPassives,
    applyMoveSpeedTuning: noop,
    randomFloat: () => 0.35,
  });
}

function drawUnitCase(name, cell) {
  units.length = 0;
  groundFx.length = 0;
  particles.length = 0;
  viewState.frame += 1;

  const unit = createUnitFromCell(cell, '0');
  units.push(unit);
  spawnSquadAttachedMinions({
    cells: { 0: { ...cell, unitRef: unit } },
    units,
    preserveExisting: false,
    tickHz: 120,
    spawnMinion(parent, kind, count) {
      for (let i = 0; i < count; i++) units.push(createMinion(parent, kind, 24 + i * 14));
    },
    spawnFelfelMirror(parent, level) {
      units.push({
        ...parent,
        x: parent.x + 22,
        y: parent.y + 8,
        maxHp: Math.round(parent.maxHp * 0.6),
        hp: Math.round(parent.maxHp * 0.6),
        isMirror: true,
        parent,
        level,
        bobPhase: 0.8,
      });
    },
    nerfMinion: minion => {
      minion.maxHp = Math.round(minion.maxHp * 0.65);
      minion.hp = minion.maxHp;
    },
    emitParticle: noop,
    randomFloat: () => 0.42,
  });

  for (const runtimeUnit of units) actorRenderer.drawUnitRaw(runtimeUnit);
  if (unit.drawFn && actorRenderer.drawFns[unit.drawFn]) actorRenderer.drawFns[unit.drawFn](unit.x, unit.y, unit);
  return { name, unitCount: units.length, specId: unit.specId };
}

function simulateDirectBranch(unitIdx, branch) {
  const arenaState = { cells: { 0: { unitIdx, col: 0, row: 0, level: 1, branch: null, roleId: null, pathId: null } } };
  const cell = { key: 0, col: 0, row: 0 };
  let gold = 999999;
  for (let level = 1; level < ARENA_MAX_UNIT_LEVEL; level++) {
    const wantsBranch = level === 2 && branch;
    const result = upgradeSquadCell({
      cell,
      branchPick: wantsBranch ? branch : null,
      pathPick: null,
      gold,
      arenaState,
      pathById: () => null,
      applyRolePathToCell: noop,
    });
    if (!result.ok) throw new Error(`upgrade failed for unit ${unitIdx} branch ${branch || 'base'} at L${level + 1}`);
    gold = result.gold;
    drawUnitCase(`unit ${unitIdx} ${branch || 'base'} L${result.cellState.level}`, result.cellState);
  }
}

function simulateRolePath(rootId, path) {
  const root = ARENA_ROLE_ROOTS[rootId];
  const arenaState = {
    cells: {
      0: {
        unitIdx: root.unitIdx,
        col: 0,
        row: 0,
        level: 1,
        branch: null,
        roleId: root.id,
        pathId: null,
        pathName: null,
      },
    },
  };
  const cell = { key: 0, col: 0, row: 0 };
  let gold = 999999;
  const applyRolePathToCell = (cellState, pathDef) => {
    cellState.unitIdx = pathDef.unitIdx;
    cellState.branch = pathDef.branch || null;
    cellState.pathId = pathDef.id;
    cellState.pathName = pathDef.name;
    cellState.pathRole = pathDef.role;
  };

  for (let level = 1; level < ARENA_MAX_UNIT_LEVEL; level++) {
    const result = upgradeSquadCell({
      cell,
      branchPick: null,
      pathPick: level === 2 ? path.id : null,
      gold,
      arenaState,
      pathById: (roleId, pathId) => (ARENA_ROLE_PATHS[roleId] || []).find(candidate => candidate.id === pathId) || null,
      applyRolePathToCell,
    });
    if (!result.ok) throw new Error(`upgrade failed for role ${rootId} path ${path.id} at L${level + 1}`);
    gold = result.gold;
    drawUnitCase(`role ${rootId}/${path.id} L${result.cellState.level}`, result.cellState);
  }
}

const economySummary = assertUpgradeEconomyTuning();
const results = [];

for (let unitIdx = 0; unitIdx < PLAYER_UNITS.length; unitIdx++) {
  results.push(drawUnitCase(`unit ${unitIdx} base L1`, { unitIdx, col: 0, row: 0, level: 1, branch: null }));
  results.push(drawUnitCase(`unit ${unitIdx} base L5`, { unitIdx, col: 0, row: 0, level: ARENA_MAX_UNIT_LEVEL, branch: null }));
  simulateDirectBranch(unitIdx, null);
  const branches = ARENA_UNIT_BRANCHES[unitIdx] || {};
  for (const branch of Object.keys(branches)) {
    results.push(drawUnitCase(`unit ${unitIdx} branch ${branch} L3`, { unitIdx, col: 0, row: 0, level: 3, branch }));
    results.push(drawUnitCase(`unit ${unitIdx} branch ${branch} L5`, { unitIdx, col: 0, row: 0, level: ARENA_MAX_UNIT_LEVEL, branch }));
    simulateDirectBranch(unitIdx, branch);
  }
}

results.push(drawUnitCase('vodka base L5', { unitIdx: 99, col: 0, row: 0, level: ARENA_MAX_UNIT_LEVEL, branch: null }));
for (const branch of Object.keys(ARENA_UNIT_BRANCHES[99] || {})) {
  results.push(drawUnitCase(`vodka branch ${branch} L5`, { unitIdx: 99, col: 0, row: 0, level: ARENA_MAX_UNIT_LEVEL, branch }));
}

for (const rootId of Object.keys(ARENA_ROLE_PATHS)) {
  for (const path of ARENA_ROLE_PATHS[rootId]) {
    simulateRolePath(rootId, path);
  }
}

const uniqueSpecs = new Set();
for (const unitIdx of Object.keys(ARENA_UNIT_BRANCHES)) {
  uniqueSpecs.add(`${unitIdx}_base`);
  for (const branch of Object.keys(ARENA_UNIT_BRANCHES[unitIdx])) uniqueSpecs.add(`${unitIdx}_${branch}`);
}
for (const specId of uniqueSpecs) {
  const [rawUnitIdx, branch] = specId.split('_');
  const unitIdx = Number(rawUnitIdx);
  if (unitIdx === 99 || !PLAYER_UNITS[unitIdx]) continue;
  drawUnitCase(`spec accessory ${specId}`, {
    unitIdx,
    col: 0,
    row: 0,
    level: branch === 'base' ? 3 : ARENA_MAX_UNIT_LEVEL,
    branch: branch === 'base' ? null : branch,
  });
}

console.log(`Smoke-tested ${results.length} direct render cases plus role-root upgrade paths.`);
console.log(`Covered ${PLAYER_UNITS.length} units, ${Object.values(ARENA_UNIT_BRANCHES).reduce((sum, branches) => sum + Object.keys(branches).length, 0)} branches, and ${Object.values(ARENA_ROLE_PATHS).reduce((sum, paths) => sum + paths.length, 0)} role paths.`);
console.log(`Upgrade economy checks: cheapest root ${economySummary.cheapestRoot}g, cheapest normal L2 ${economySummary.minNormalL2}g.`);
