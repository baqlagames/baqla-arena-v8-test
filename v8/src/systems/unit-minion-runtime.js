import { MINION_NERF, UNIT_VISUAL_SCALE } from '../data/tuning.js';
import { spawnSquadAttachedMinions } from './squad-lifecycle.js';

export function createUnitMinionRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const unitVisualScale = Number.isFinite(deps.unitVisualScale) ? deps.unitVisualScale : UNIT_VISUAL_SCALE;
  const minionNerf = Number.isFinite(deps.minionNerf) ? deps.minionNerf : MINION_NERF;
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const rnd = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const randomFloat = typeof deps.randomFloat === 'function' ? deps.randomFloat : Math.random;
  const clamp = typeof deps.clamp === 'function' ? deps.clamp : ((value, min, max) => Math.max(min, Math.min(max, value)));
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};
  const addDamageText = typeof deps.addDamageText === 'function' ? deps.addDamageText : () => {};
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const spawnFelfelMirror = typeof deps.spawnFelfelMirror === 'function' ? deps.spawnFelfelMirror : () => {};

  function currentView() {
    const v = view();
    return {
      arena: v.arena || {},
      units: v.units || [],
      groundFx: v.groundFx || [],
      frame: v.frame || 0,
      arenaTop: Number.isFinite(v.arenaTop) ? v.arenaTop : 0,
      arenaBottom: Number.isFinite(v.arenaBottom) ? v.arenaBottom : 1000,
      arenaLeft: Number.isFinite(v.arenaLeft) ? v.arenaLeft : 0,
      arenaRight: Number.isFinite(v.arenaRight) ? v.arenaRight : 500,
      vodkaLevel: Number.isFinite(v.vodkaLevel) ? v.vodkaLevel : 1,
    };
  }

  function nerfMinion(minion) {
    if (!minion) return minion;
    minion.maxHp = Math.round((minion.maxHp || minion.hp || 1) * minionNerf);
    minion.hp = minion.maxHp;
    minion.dmg = Math.round((minion.dmg || 0) * minionNerf);
    return minion;
  }

  function followFamiliarAnchor(unit) {
    const { frame, arenaTop, arenaBottom, arenaLeft, arenaRight } = currentView();
    if (!unit || !unit.familiar || !unit.parent || unit.parent.hp <= 0) return false;
    let side = unit.familiarSide || 1;
    const size = unit.size || 12;
    const wobble = (unit.bobPhase || 0) + frame * 0.055;
    const gap = (unit.parent.size || 22) + 30;
    if (side > 0 && unit.parent.x + gap > arenaRight - size - 18) side = -1;
    if (side < 0 && unit.parent.x - gap < arenaLeft + size + 18) side = 1;
    const tx = clamp(unit.parent.x + side * gap + Math.cos(wobble) * 5, arenaLeft + size, arenaRight - size);
    const ty = clamp(unit.parent.y - 4 + Math.sin(wobble) * 5, arenaTop + Math.max(size, 55), arenaBottom - size);
    const dx = tx - unit.x, dy = ty - unit.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 90) { unit.x = tx; unit.y = ty; }
    else { unit.x += dx * 0.14; unit.y += dy * 0.14; }
    unit.facing = side;
    return true;
  }

  function createMinion(parent, kind, vodkaLevel) {
    if (kind === 'foulTank') {
      const hp = 420 + vodkaLevel * 50;
      return { x: parent.x + rnd(-22, 22), y: parent.y + rnd(-12, 12),
        maxHp: hp, hp, dmg: 8, speed: 0.30, atkSpd: 84, range: 30, size: 22 * unitVisualScale, armor: 5, magicRes: 2,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#3a4f10', accent: '#1a280a', facing: 1, arch: 'tank',
        bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'foulRanged') {
      const hp = 180 + vodkaLevel * 25;
      return { x: parent.x + rnd(-15, 15), y: parent.y + rnd(-10, 10),
        maxHp: hp, hp, dmg: 14, speed: 0.32, atkSpd: 90, range: 140, size: 13 * unitVisualScale, armor: 0, magicRes: 1,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#9b59b6', accent: '#5a2e6a', facing: 1, arch: 'ranged',
        projType: 'curse', bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'fireElemental') {
      const hp = 140 + vodkaLevel * 20;
      return { x: parent.x + 28, y: parent.y - 8,
        maxHp: hp, hp, dmg: 13, speed: 0.30, atkSpd: 90, range: 150, size: 13 * unitVisualScale, armor: 0, magicRes: 2,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#ff6633', accent: '#aa2200', facing: 1, arch: 'ranged',
        projType: 'fire', bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'waterElemental') {
      const hp = 170 + vodkaLevel * 25;
      return { x: parent.x + 28, y: parent.y - 8,
        maxHp: hp, hp, dmg: 11, speed: 0.28, atkSpd: 84, range: 155, size: 14 * unitVisualScale, armor: 1, magicRes: 3,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#44aadd', accent: '#1a6a9a', facing: 1, arch: 'ranged',
        projType: 'ice', bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'stormElemental') {
      const hp = 130 + vodkaLevel * 18;
      return { x: parent.x + 28, y: parent.y - 8,
        maxHp: hp, hp, dmg: 15, speed: 0.32, atkSpd: 78, range: 160, size: 13 * unitVisualScale, armor: 0, magicRes: 2,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#aa88ff', accent: '#6644cc', facing: 1, arch: 'ranged',
        projType: 'lightning', bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'flameSprite') {
      const hp = 220 + (parent.level || 1) * 35;
      return { x: parent.x + rnd(-15, 15), y: parent.y + rnd(-8, 8),
        maxHp: hp, hp, dmg: 9, speed: 0.18, atkSpd: 84, range: 360, size: 12 * unitVisualScale, armor: 0, magicRes: 2,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#ff8833', accent: '#cc4400', facing: 1, arch: 'ranged',
        projType: 'fire', familiar: true, untargetable: true, familiarSide: -1, bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'imp') {
      const hp = 240 + (parent.level || 1) * 35;
      return { x: parent.x + rnd(-18, 18), y: parent.y + rnd(-10, 10),
        maxHp: hp, hp, dmg: 10, speed: 0.18, atkSpd: 72, range: 340, size: 12 * unitVisualScale, armor: 0, magicRes: 1,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#44cc44', accent: '#228822', facing: 1, arch: 'ranged',
        projType: 'fire', familiar: true, untargetable: true, familiarSide: 1, bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'felhound') {
      const hp = 350 + vodkaLevel * 40;
      return { x: parent.x + rnd(-20, 20), y: parent.y + rnd(-12, 12),
        maxHp: hp, hp, dmg: 16, speed: 0.38, atkSpd: 66, range: 36, size: 18 * unitVisualScale, armor: 2, magicRes: 3,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#5a3a8a', accent: '#2a1a4a', facing: 1, arch: 'melee',
        _spellLockCD: 0, _spellLockEvery: 8 * tickHz, bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'wolf') {
      const hp = 400 + (parent.level || 1) * 40;
      return { x: parent.x + 20, y: parent.y + 10, maxHp: hp, hp, dmg: 14, speed: 0.40, atkSpd: 60, range: 36, size: 18, armor: 2, magicRes: 1,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#888888', accent: '#555555', facing: 1,
        bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'raptor') {
      const hp = 300 + (parent.level || 1) * 35;
      return { x: parent.x + 20, y: parent.y + 10, maxHp: hp, hp, dmg: 12, speed: 0.45, atkSpd: 54, range: 36, size: 16, armor: 1, magicRes: 0,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#aa6633', accent: '#663311', facing: 1,
        bobPhase: randomFloat() * Math.PI * 2 };
    }
    if (kind === 'spiritBeast') {
      const hp = 500 + (parent.level || 1) * 50;
      return { x: parent.x + 20, y: parent.y + 10, maxHp: hp, hp, dmg: 16, speed: 0.35, atkSpd: 66, range: 36, size: 20, armor: 3, magicRes: 2,
        isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#3aa84e', accent: '#1a5a2a', facing: 1,
        _spiritMendCD: 0, _spiritMendEvery: 8 * tickHz, _spiritMendPct: 0.05, bobPhase: randomFloat() * Math.PI * 2 };
    }
    const hp = 200 + vodkaLevel * 30;
    return { x: parent.x + rnd(-15, 15), y: parent.y + rnd(-10, 10),
      maxHp: hp, hp, dmg: 12, speed: 0.4, atkSpd: 60, range: 32, size: 13 * unitVisualScale, armor: 0, magicRes: 0,
      isPlayer: true, isMinion: true, parent, kind, cd: 0, color: '#7b8a3a', accent: '#4f5d22', facing: 1, arch: 'melee',
      bobPhase: randomFloat() * Math.PI * 2 };
  }

  function spawnMinion(parent, kind, count = 1) {
    const { units, groundFx, frame, vodkaLevel } = currentView();
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const minion = createMinion(parent, kind, vodkaLevel);
      minion.spawnFrame = frame;
      nerfMinion(minion);
      units.push(minion);
      spawned.push(minion);
      if (kind === 'felhound') {
        addDamageText(minion.x, minion.y - minion.size, 'FELHOUND!', '#aa66ff', { sz: 12, bold: true });
        emitParticle(minion.x, minion.y, '#aa66ff', 18, 4);
        emitParticle(parent.x, parent.y, '#5a3a8a', 10, 3);
        groundFx.push({ x: minion.x, y: minion.y, r: 0, maxR: 40, life: 0.45, color: '#5a3a8a' });
      }
    }
    return spawned;
  }

  function spawnGhoul(parent, sx, sy) {
    const { units, frame } = currentView();
    if (!parent || !parent.raiseGhoul) return null;
    if (parent.raiseGhoul.active >= parent.raiseGhoul.maxGhouls) return null;
    const hp = Math.round(parent.maxHp * 0.25);
    const minion = { x: sx + rnd(-15, 15), y: sy + rnd(-10, 10),
      maxHp: hp, hp, dmg: Math.round(parent.dmg * 0.40), speed: 0.45, atkSpd: 72, range: 32, size: 16 * unitVisualScale, armor: 1, magicRes: 0,
      isPlayer: true, isMinion: true, parent, kind: 'ghoul', cd: 0, color: '#4a6a2a', accent: '#2a4010', facing: 1, arch: 'melee',
      bobPhase: randomFloat() * Math.PI * 2, spawnFrame: frame };
    nerfMinion(minion);
    units.push(minion);
    parent.raiseGhoul.active++;
    emitParticle(sx, sy, '#44ff44', 14, 4);
    addDamageText(sx, sy - 10, 'GHOUL!', '#44ff44');
    return minion;
  }

  function spawnTreant(parent, tx, ty, dur) {
    const { units, frame } = currentView();
    const level = parent.level || 1;
    const hp = 80 + level * 30;
    const minion = { x: tx, y: ty, maxHp: hp, hp, dmg: 0, speed: 0.20, atkSpd: 999, range: 120, size: 12 * unitVisualScale, armor: 1, magicRes: 2,
      isPlayer: true, isMinion: true, parent, kind: 'treant', cd: 0, _treantHealPct: 0.04, _treantTick: 0,
      color: '#2a5a1a', accent: '#1a3a0a', facing: 1, bobPhase: randomFloat() * Math.PI * 2, lifeTicks: dur, spawnFrame: frame };
    nerfMinion(minion);
    units.push(minion);
    emitParticle(tx, ty, '#44ff66', 12, 4);
    addDamageText(tx, ty - 8, 'TREANT!', '#44ff66');
    return minion;
  }

  function spawnPetBear(parent) {
    const { units, frame } = currentView();
    const myPets = units.filter(minion => minion.isMinion && minion.parent === parent && minion.hp > 0).length;
    if (myPets > 0 || (parent.summonCDt || 0) > 0) {
      if (parent.abilCD) parent.abilCD.petBear = 30;
      return null;
    }
    const level = parent.level || 1;
    const hp = 350 + level * 30;
    const minion = { x: parent.x + 10, y: parent.y + 15,
      maxHp: hp, hp, dmg: 18, speed: 0.4, atkSpd: 60, range: 36, size: 18, armor: 2, magicRes: 0,
      isPlayer: true, isMinion: true, parent, kind: 'bear', cd: 0, color: '#8b4513', accent: '#5d2f0d', facing: 1,
      bobPhase: 0, spawnFrame: frame };
    units.push(minion);
    emitParticle(minion.x, minion.y, '#8b4513', 16, 4);
    showFlash('PET BEAR!', '#8b4513', 30);
    return minion;
  }

  function spawnDireBeast(parent) {
    const { units, frame } = currentView();
    const level = parent.level || 1;
    const hp = 200 + level * 30;
    const minion = { x: parent.x + rnd(-20, 20), y: parent.y + rnd(-10, 10), maxHp: hp, hp, dmg: Math.round(parent.dmg * 0.8),
      speed: 0.50, atkSpd: 42, range: 36, size: 16, armor: 1, magicRes: 0,
      isPlayer: true, isMinion: true, parent, kind: 'direBeast', cd: 0,
      color: '#8a6a3a', accent: '#5a4020', facing: 1,
      bobPhase: randomFloat() * Math.PI * 2, lifeTicks: 8 * tickHz, spawnFrame: frame };
    nerfMinion(minion);
    units.push(minion);
    emitParticle(minion.x, minion.y, '#8a6a3a', 16, 4);
    addDamageText(parent.x, parent.y - parent.size, 'DIRE BEAST!', '#8a6a3a');
    return minion;
  }

  function spawnRepairBot(parent) {
    const { units, frame } = currentView();
    let lowest = null, lowPct = Infinity;
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && ally !== parent && !ally.isMinion) {
        const pct = ally.hp / ally.maxHp;
        if (pct < lowPct) { lowPct = pct; lowest = ally; }
      }
    }
    if (!lowest) return null;
    const level = parent.level || 1;
    const hp = 80 + level * 20;
    const minion = { x: parent.x, y: parent.y - 10, maxHp: hp, hp, dmg: 0,
      speed: 0.45, atkSpd: 999, range: 60, size: 10, armor: 0, magicRes: 0,
      isPlayer: true, isMinion: true, parent, kind: 'repairBot', cd: 0,
      _healTarget: lowest, _healAmt: Math.round(lowest.maxHp * 0.035), _healTick: 0, _shieldTick: 0,
      color: '#44cc88', accent: '#228855', facing: 1,
      bobPhase: randomFloat() * Math.PI * 2, lifeTicks: 10 * tickHz, spawnFrame: frame };
    nerfMinion(minion);
    units.push(minion);
    emitParticle(minion.x, minion.y, '#44cc88', 12, 4);
    addDamageText(parent.x, parent.y - parent.size, 'REPAIR BOT!', '#44cc88');
    return minion;
  }

  function spawnSquadMinions(preserveExisting) {
    const { arena, units } = currentView();
    spawnSquadAttachedMinions({
      cells: arena.cells || {},
      units,
      preserveExisting,
      tickHz,
      spawnMinion,
      spawnFelfelMirror,
      nerfMinion,
      emitParticle,
      randomFloat,
    });
  }

  return {
    nerfMinion,
    followFamiliarAnchor,
    spawnMinion,
    spawnGhoul,
    spawnTreant,
    spawnPetBear,
    spawnDireBeast,
    spawnRepairBot,
    spawnSquadMinions,
  };
}
